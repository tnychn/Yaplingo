from collections import Counter
from datetime import date, datetime
from typing import Literal
from zoneinfo import ZoneInfo

from pydantic import BaseModel
from ulid import ULID

from server.repository import Repository
from server.repository.entities import User
from server.repository.shop import GEM_SPEND_RATES
from server.store import Store


class LeaderboardEntry(BaseModel):
    uid: ULID
    name: str
    rank: int
    score: int


class ProximityNeighbour(BaseModel):
    uid: ULID
    name: str
    rank: int
    score: int
    score_gap: int


class Proximity(BaseModel):
    above: list[ProximityNeighbour]
    below: list[ProximityNeighbour]
    my_rank: int
    my_score: int


class AchievementRule(BaseModel):
    key: str
    title: str
    desc: str
    threshold_type: Literal["lifetime_xp", "streak", "lifetime_lessons", "alltime_rank"]
    threshold: int
    gem_reward: int


class AchievementStatus(BaseModel):
    key: str
    title: str
    desc: str
    unlocked: bool
    unlocked_at: datetime | None = None
    progress: float
    gem_reward: int


class AchievementClaim(BaseModel):
    achievement_key: str
    gems_awarded: int
    new_balance: int


class ActiveEvent(BaseModel):
    id: ULID
    name: str
    description: str
    multiplier: float
    starts_at: datetime
    ends_at: datetime


class GemConfig(BaseModel):
    spend_rates: dict[str, int]


class GemSpend(BaseModel):
    new_balance: int
    item_key: str
    xp_added: int


class InventoryStatus(BaseModel):
    streak_freezes: int


class UseSkill(BaseModel):
    skill_key: str
    message: str
    remaining: int


ACHIEVEMENT_RULES: tuple[AchievementRule, ...] = (
    AchievementRule(
        key="first_step",
        title="First Step",
        desc="Earn your first 10 XP",
        threshold_type="lifetime_xp",
        threshold=10,
        gem_reward=5,
    ),
    AchievementRule(
        key="bronze_mic",
        title="Bronze Mic",
        desc="Earn 500 XP lifetime",
        threshold_type="lifetime_xp",
        threshold=500,
        gem_reward=10,
    ),
    AchievementRule(
        key="silver_mic",
        title="Silver Mic",
        desc="Earn 2,000 XP lifetime",
        threshold_type="lifetime_xp",
        threshold=2000,
        gem_reward=20,
    ),
    AchievementRule(
        key="gold_mic",
        title="Gold Mic",
        desc="Earn 10,000 XP lifetime",
        threshold_type="lifetime_xp",
        threshold=10000,
        gem_reward=40,
    ),
    AchievementRule(
        key="platinum_mic",
        title="Platinum Mic",
        desc="Earn 50,000 XP lifetime",
        threshold_type="lifetime_xp",
        threshold=50000,
        gem_reward=75,
    ),
    AchievementRule(
        key="diamond_mic",
        title="Diamond Mic",
        desc="Earn 100,000 XP lifetime",
        threshold_type="lifetime_xp",
        threshold=100000,
        gem_reward=150,
    ),
    AchievementRule(
        key="streak_5",
        title="On Fire",
        desc="Maintain a 5-day streak",
        threshold_type="streak",
        threshold=5,
        gem_reward=10,
    ),
    AchievementRule(
        key="streak_14",
        title="Two Weeks",
        desc="Maintain a 14-day streak",
        threshold_type="streak",
        threshold=14,
        gem_reward=20,
    ),
    AchievementRule(
        key="streak_30",
        title="Unstoppable",
        desc="Maintain a 30-day streak",
        threshold_type="streak",
        threshold=30,
        gem_reward=50,
    ),
    AchievementRule(
        key="streak_100",
        title="Century",
        desc="Maintain a 100-day streak",
        threshold_type="streak",
        threshold=100,
        gem_reward=100,
    ),
    AchievementRule(
        key="streak_365",
        title="Year of Yap",
        desc="Practice every day for a year",
        threshold_type="streak",
        threshold=365,
        gem_reward=500,
    ),
    AchievementRule(
        key="lesson_50",
        title="Half Century",
        desc="Complete 50 Echo + Chat sessions",
        threshold_type="lifetime_lessons",
        threshold=50,
        gem_reward=15,
    ),
    AchievementRule(
        key="lesson_200",
        title="Dedicated",
        desc="Complete 200 Echo + Chat sessions",
        threshold_type="lifetime_lessons",
        threshold=200,
        gem_reward=30,
    ),
    AchievementRule(
        key="lesson_500",
        title="Lesson Legend",
        desc="Complete 500 Echo + Chat sessions",
        threshold_type="lifetime_lessons",
        threshold=500,
        gem_reward=75,
    ),
    AchievementRule(
        key="alltime_legend",
        title="All-Time Legend",
        desc="Reach #1 on the all-time leaderboard",
        threshold_type="alltime_rank",
        threshold=1,
        gem_reward=1000,
    ),
)


class GameService:
    def __init__(self, store: Store, repository: Repository):
        self.store = store
        self.repository = repository

    async def init(self) -> None:
        entries = await self.repository.aggregation.list_total_points_per_user()
        await self.store.leaderboard.dump(entries)

    async def list_leaderboard(self, limit: int = 50) -> list[LeaderboardEntry]:
        top = await self.store.leaderboard.list(limit)

        users = await self.repository.user.get_many([uid for uid, _ in top])
        mapping: dict[ULID, User] = {u.id: u for u in users}

        entries: list[LeaderboardEntry] = []
        for rank, (uid, score) in enumerate(top, start=1):
            user = mapping[uid]
            entries.append(
                LeaderboardEntry(
                    uid=user.id,
                    name=user.name,
                    rank=rank,
                    score=score,
                )
            )
        return entries

    async def get_leaderboard_user(self, user: User) -> LeaderboardEntry:
        if rank_score := await self.store.leaderboard.get(user):
            return LeaderboardEntry(
                uid=user.id,
                name=user.name,
                rank=rank_score[0],
                score=rank_score[1],
            )
        count = await self.store.leaderboard.count()
        return LeaderboardEntry(uid=user.id, name=user.name, rank=count + 1, score=0)

    async def get_leaderboard_proximity(self, user: User, *, xp_window: int = 200, limit: int = 5) -> Proximity:
        me = await self.get_leaderboard_user(user)
        if me.score <= 0:
            return Proximity(above=[], below=[], my_rank=me.rank, my_score=me.score)

        above_rows, below_rows = await self.store.leaderboard.list_proximity_window(me.score, window=xp_window, limit=limit)
        uids = list(dict.fromkeys([uid for uid, _score in above_rows + below_rows]))
        users = await self.repository.user.get_many(uids)
        users_map: dict[ULID, User] = {u.id: u for u in users}

        async def to_neighbour(uid: ULID, score: int) -> ProximityNeighbour:
            rank_score = await self.store.leaderboard.get_by_uid(uid)
            rank = rank_score[0] if rank_score else 0
            target = users_map.get(uid)
            name = target.name if target else "Unknown"
            return ProximityNeighbour(
                uid=uid,
                name=name,
                rank=rank,
                score=score,
                score_gap=abs(score - me.score),
            )

        return Proximity(
            above=[await to_neighbour(uid, score) for uid, score in above_rows],
            below=[await to_neighbour(uid, score) for uid, score in below_rows],
            my_rank=me.rank,
            my_score=me.score,
        )

    async def get_user_year_activity(self, user: User) -> dict[date, int]:
        tz = ZoneInfo(user.timezone)
        year = datetime.now(tz).year
        start = datetime(year, 1, 1, tzinfo=tz)
        end = datetime(year + 1, 1, 1, tzinfo=tz)
        sessions = await self.repository.aggregation.get_sessions_by_user(user, start=start, end=end)
        return Counter([s.completed_at.astimezone(tz).date() for s in sessions])

    async def get_user_today_points(self, user: User) -> int:
        points_today = await self.store.user.get_points_today(user)
        if points_today is None:
            return await self.store.user.increment_points_today(user, 0)
        return points_today

    async def get_gem_balance(self, user: User) -> int:
        return await self.repository.achievement.get_gem_balance(user.id)

    async def get_gem_config(self) -> GemConfig:
        return GemConfig(spend_rates=dict(GEM_SPEND_RATES))

    async def list_active_events(self, user: User) -> list[ActiveEvent]:
        active = await self.repository.shop.list_active_events(user.id)
        return [
            ActiveEvent(
                id=event.id,
                name=event.name,
                description=event.description,
                multiplier=event.multiplier,
                starts_at=event.starts_at,
                ends_at=event.ends_at,
            )
            for event in active
        ]

    async def get_inventory(self, user: User) -> InventoryStatus:
        inventory = await self.repository.shop.get_inventory(user.id)
        return InventoryStatus(streak_freezes=inventory.streak_freezes)

    async def _is_alltime_rank_one(self, user: User) -> bool:
        rank_score = await self.store.leaderboard.get(user)
        return rank_score is not None and rank_score[0] == 1

    @staticmethod
    def _metric_value(
        rule: AchievementRule,
        user: User,
        sessions_total: int,
        alltime_rank_one: bool,
    ) -> int:
        if rule.threshold_type == "lifetime_xp":
            return max(user.points, 0)
        if rule.threshold_type == "streak":
            return max(user.streak, 0)
        if rule.threshold_type == "lifetime_lessons":
            return max(sessions_total, 0)
        return 1 if alltime_rank_one else 0

    async def list_achievements(self, user: User) -> list[AchievementStatus]:
        unlocked_map = await self.repository.achievement.list_unlocked(user.id)
        sessions_total = await self.repository.aggregation.count_completed_sessions_by_user(user)
        alltime_rank_one = await self._is_alltime_rank_one(user)

        achievements: list[AchievementStatus] = []
        for rule in ACHIEVEMENT_RULES:
            unlocked_at = unlocked_map.get(rule.key)
            if unlocked_at is not None:
                achievements.append(
                    AchievementStatus(
                        key=rule.key,
                        title=rule.title,
                        desc=rule.desc,
                        unlocked=True,
                        unlocked_at=unlocked_at,
                        progress=1.0,
                        gem_reward=rule.gem_reward,
                    )
                )
                continue

            value = self._metric_value(rule, user, sessions_total, alltime_rank_one)
            progress = min(value / rule.threshold, 1.0) if rule.threshold > 0 else 1.0
            achievements.append(
                AchievementStatus(
                    key=rule.key,
                    title=rule.title,
                    desc=rule.desc,
                    unlocked=False,
                    unlocked_at=None,
                    progress=round(progress, 2),
                    gem_reward=rule.gem_reward,
                )
            )
        return achievements

    async def claim_achievement(self, user: User, achievement_key: str) -> AchievementClaim:
        rule = next((item for item in ACHIEVEMENT_RULES if item.key == achievement_key), None)
        if rule is None:
            raise ValueError("Unknown achievement")

        unlocked_map = await self.repository.achievement.list_unlocked(user.id)
        if achievement_key in unlocked_map:
            raise ValueError("Achievement already claimed")

        sessions_total = await self.repository.aggregation.count_completed_sessions_by_user(user)
        alltime_rank_one = await self._is_alltime_rank_one(user)
        value = self._metric_value(rule, user, sessions_total, alltime_rank_one)
        if value < rule.threshold:
            raise PermissionError("Achievement criteria not met")

        claim_result = await self.repository.achievement.claim_and_award(
            user.id,
            achievement_key,
            rule.gem_reward,
        )
        if claim_result is None:
            raise ValueError("Achievement already claimed")
        _unlocked_at, new_balance = claim_result

        return AchievementClaim(
            achievement_key=achievement_key,
            gems_awarded=rule.gem_reward,
            new_balance=new_balance,
        )

    async def spend_gems(self, user: User, item_key: str) -> GemSpend:
        result = await self.repository.shop.spend_gems(user.id, item_key)
        if result.xp_added > 0:
            await self.store.leaderboard.increment(user, result.xp_added)
        return GemSpend(
            new_balance=result.new_balance,
            item_key=result.item_key,
            xp_added=result.xp_added,
        )

    async def use_skill(self, user: User, item_key: str) -> UseSkill:
        result = await self.repository.shop.use_skill(user.id, item_key)
        return UseSkill(
            skill_key=result.skill_key,
            message=result.message,
            remaining=result.remaining,
        )


__all__ = [
    "GameService",
    "LeaderboardEntry",
    "ProximityNeighbour",
    "Proximity",
    "AchievementStatus",
    "AchievementClaim",
    "ActiveEvent",
    "GemConfig",
    "GemSpend",
    "InventoryStatus",
    "UseSkill",
]
