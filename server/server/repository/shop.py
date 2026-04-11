from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from ulid import ULID

from .entities import User, UserGemBalance, UserGemTransaction, UserInventory, UserStreakState, UserXPMultiplierEvent

GEM_SPEND_RATES: dict[str, int] = {
    "streak_freeze": 50,
    "xp_boost_1h": 100,
    "xp_boost_30m_30x": 500,
    "buy_xp_500": 50,
}

XP_BOOST_ITEMS: dict[str, tuple[str, str, float, timedelta]] = {
    "xp_boost_1h": (
        "Personal XP Boost",
        "2x XP for 1 hour",
        2.0,
        timedelta(hours=1),
    ),
    "xp_boost_30m_30x": (
        "Mega XP Boost",
        "30x XP for 30 minutes",
        30.0,
        timedelta(minutes=30),
    ),
}

USABLE_SKILLS: set[str] = {"streak_freeze"}


@dataclass(frozen=True)
class SpendResult:
    new_balance: int
    item_key: str
    xp_added: int


@dataclass(frozen=True)
class UseSkillResult:
    skill_key: str
    message: str
    remaining: int


class ShopRepository:
    def __init__(self, session: async_sessionmaker[AsyncSession]):
        self._session = session

    def get_spend_rates(self) -> dict[str, int]:
        return dict(GEM_SPEND_RATES)

    async def get_streak_freeze_count(self, user_id: ULID) -> int:
        async with self._session() as session:
            query = select(UserInventory).where(UserInventory.user_id == user_id)
            row = (await session.exec(query)).one_or_none()
            return row.streak_freezes if row is not None else 0

    async def get_inventory(self, user_id: ULID) -> UserInventory:
        async with self._session() as session:
            query = select(UserInventory).where(UserInventory.user_id == user_id)
            row = (await session.exec(query)).one_or_none()
            if row is None:
                return UserInventory(user_id=user_id, streak_freezes=0)
            return row

    async def list_active_events(self, user_id: ULID) -> list[UserXPMultiplierEvent]:
        now = datetime.now(timezone.utc)
        async with self._session() as session:
            query = (
                select(UserXPMultiplierEvent)
                .where(
                    UserXPMultiplierEvent.user_id == user_id,
                    UserXPMultiplierEvent.is_active == True,  # noqa: E712
                    UserXPMultiplierEvent.starts_at <= now,
                    UserXPMultiplierEvent.ends_at >= now,
                )
                .order_by(UserXPMultiplierEvent.multiplier.desc(), UserXPMultiplierEvent.ends_at.asc())
            )
            return list((await session.exec(query)).all())

    async def get_active_multiplier(self, user_id: ULID) -> float:
        active = await self.list_active_events(user_id)
        if not active:
            return 1.0
        return max(event.multiplier for event in active)

    async def spend_gems(self, user_id: ULID, item_key: str) -> SpendResult:
        if (cost := GEM_SPEND_RATES.get(item_key)) is None:
            raise ValueError("Unknown item")

        xp_added = 0
        now = datetime.now(timezone.utc)

        async with self._session() as session:
            async with session.begin():
                balance = (await session.exec(
                    select(UserGemBalance).where(UserGemBalance.user_id == user_id).with_for_update()
                )).one_or_none()
                if balance is None or balance.balance < cost:
                    raise PermissionError("Insufficient gems")

                balance.balance -= cost
                session.add(balance)
                session.add(UserGemTransaction(user_id=user_id, amount=-cost, reason=item_key))

                if item_key == "streak_freeze":
                    inventory = (await session.exec(
                        select(UserInventory).where(UserInventory.user_id == user_id).with_for_update()
                    )).one_or_none()
                    if inventory is None:
                        inventory = UserInventory(user_id=user_id, streak_freezes=0)
                    inventory.streak_freezes += 1
                    session.add(inventory)
                elif item_key in XP_BOOST_ITEMS:
                    name, description, multiplier, duration = XP_BOOST_ITEMS[item_key]
                    session.add(
                        UserXPMultiplierEvent(
                            user_id=user_id,
                            name=name,
                            description=description,
                            multiplier=multiplier,
                            starts_at=now,
                            ends_at=now + duration,
                            is_active=True,
                        )
                    )
                elif item_key == "buy_xp_500":
                    user = (await session.exec(
                        select(User).where(User.id == user_id).with_for_update()
                    )).one_or_none()
                    if user is None:
                        raise ValueError("User not found")
                    xp_added = 500
                    user.points += xp_added
                    session.add(user)

                await session.flush()
                return SpendResult(
                    new_balance=balance.balance,
                    item_key=item_key,
                    xp_added=xp_added,
                )

    async def use_skill(self, user_id: ULID, item_key: str) -> UseSkillResult:
        if item_key not in USABLE_SKILLS:
            raise ValueError(f"Item '{item_key}' cannot be manually activated")

        async with self._session() as session:
            async with session.begin():
                inventory = (await session.exec(
                    select(UserInventory).where(UserInventory.user_id == user_id).with_for_update()
                )).one_or_none()
                if inventory is None or inventory.streak_freezes < 1:
                    raise PermissionError("No streak restores available")

                user = (await session.exec(
                    select(User).where(User.id == user_id).with_for_update()
                )).one_or_none()
                if user is None:
                    raise ValueError("User not found")

                streak_state = (await session.exec(
                    select(UserStreakState).where(UserStreakState.user_id == user_id).with_for_update()
                )).one_or_none()
                previous_streak = max(streak_state.previous_streak if streak_state is not None else 0, 0)
                if previous_streak == 0:
                    return UseSkillResult(
                        skill_key=item_key,
                        message="No streak available to restore.",
                        remaining=inventory.streak_freezes,
                    )

                inventory.streak_freezes -= 1
                session.add(inventory)

                user.streak = previous_streak
                tz = ZoneInfo(str(user.timezone))
                yesterday = datetime.now(tz) - timedelta(days=1)
                user.streaked_at = yesterday.astimezone(timezone.utc)
                session.add(user)
                streak_state.previous_streak = 0
                session.add(streak_state)

                await session.flush()
                return UseSkillResult(
                    skill_key=item_key,
                    message=f"Streak restored! Your {previous_streak}-day streak is back.",
                    remaining=inventory.streak_freezes,
                )


__all__ = [
    "ShopRepository",
    "SpendResult",
    "UseSkillResult",
    "GEM_SPEND_RATES",
]
