from collections import Counter
from datetime import date, datetime, timedelta
from typing import Literal
from zoneinfo import ZoneInfo

from pydantic import BaseModel
from ulid import ULID

from server.repository import Repository
from server.repository.entities import User
from server.store import Store

DAILY_GOAL_XP = 300


class LeaderboardEntry(BaseModel):
    uid: ULID
    name: str
    rank: int
    score: int


class HistoryEntry(BaseModel):
    date_key: str
    xp_earned: int
    goal_met: bool
    lessons_completed: int


class StatsData(BaseModel):
    seven_day_avg_xp: float
    thirty_day_best_streak: int
    completion_rate_30d: float
    lifetime_xp: int


LeaderboardPeriod = Literal["this-week", "all-time"]


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

    # TODO: combine into one atomic operation
    async def increment_user_points(self, user: User, points_to_add: int) -> None:
        assert points_to_add >= 0, "points to add must be non-negative"
        points_today = await self.store.user.increment_points_today(user, points_to_add)
        await self.store.leaderboard.increment(user, points_to_add)
        await self.repository.user.increment_points(user, points_to_add)
        if points_today >= user.streak_milestone and not user.streak_claimed_today:
            await self.repository.user.increment_streak(user)

    async def get_xp_history(self, user: User, days: int = 30) -> list[HistoryEntry]:
        """Get XP history for the last N days, filling in zeros for missing days."""
        tz = ZoneInfo(user.timezone)
        today = datetime.now(tz).date()
        start_date = today - timedelta(days=days - 1)
        start = datetime(start_date.year, start_date.month, start_date.day, tzinfo=tz)
        end = datetime(today.year, today.month, today.day, tzinfo=tz) + timedelta(days=1)

        sessions = await self.repository.aggregation.get_sessions_by_user(user, start=start, end=end)

        daily_xp: dict[str, int] = {}
        daily_sessions: dict[str, int] = {}
        for s in sessions:
            day = s.completed_at.astimezone(tz).date().isoformat()
            daily_xp[day] = daily_xp.get(day, 0) + s.points
            daily_sessions[day] = daily_sessions.get(day, 0) + 1

        history: list[HistoryEntry] = []
        current = start_date
        while current <= today:
            key = current.isoformat()
            xp = daily_xp.get(key, 0)
            sessions_count = daily_sessions.get(key, 0)
            history.append(
                HistoryEntry(
                    date_key=key,
                    xp_earned=xp,
                    goal_met=xp >= DAILY_GOAL_XP,
                    lessons_completed=sessions_count,
                )
            )
            current += timedelta(days=1)
        return history

    async def get_stats(self, user: User) -> StatsData:
        """Get aggregated stats for the user."""
        history = await self.get_xp_history(user, 30)
        last_7 = history[-7:]
        seven_day_avg = sum(e.xp_earned for e in last_7) / 7
        active_days = sum(1 for e in history if e.xp_earned > 0)
        completion_rate = (active_days / 30) * 100

        best_streak = current_run = 0
        for entry in history:
            if entry.xp_earned > 0:
                current_run += 1
                best_streak = max(best_streak, current_run)
            else:
                current_run = 0

        lifetime_xp = user.points

        return StatsData(
            seven_day_avg_xp=round(seven_day_avg, 1),
            thirty_day_best_streak=best_streak,
            completion_rate_30d=round(completion_rate, 1),
            lifetime_xp=lifetime_xp,
        )


__all__ = ["GameService", "LeaderboardPeriod", "HistoryEntry", "StatsData"]
