from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession
from ulid import ULID

from .entities import User, UserInventory, UserStreakState
from .exceptions import EntityExistsError


class UserRepository:
    def __init__(self, session: async_sessionmaker[AsyncSession]):
        self._session = session

    async def dump(self, user: User) -> User:
        try:
            async with self._session() as session:
                session.add(user)
                await session.commit()
        except IntegrityError:
            raise EntityExistsError()
        return user

    async def get_one(self, uid_name: ULID | str) -> User | None:
        async with self._session() as session:
            if isinstance(uid_name, ULID):
                user = await session.get(User, uid_name)
            else:
                query = select(User).where(User.name == uid_name)
                user = (await session.exec(query)).one_or_none()
            return user

    async def get_many(self, uids: list[ULID]) -> list[User]:
        if not uids:
            return []
        async with self._session() as session:
            query = select(User).where(col(User.id).in_(uids))
            results = await session.exec(query)
            return list(results.all())

    async def increment_points(self, user: User, points_to_add: int) -> None:
        async with self._session() as session:
            user.points += points_to_add
            session.add(user)
            await session.commit()

    async def increment_streak(self, user: User) -> None:
        async with self._session() as session:
            db_user = await session.get(User, user.id)
            if db_user is None:
                return

            tz = ZoneInfo(str(db_user.timezone))
            now = datetime.now(tz)
            today = now.date()

            if db_user.streak <= 0:
                new_streak = 1
                await self._set_previous_streak(session, db_user.id, 0)
            else:
                streaked_date = db_user.streaked_at.astimezone(tz).date()
                gap_days = (today - streaked_date).days
                if gap_days <= 0:
                    new_streak = db_user.streak
                elif gap_days == 1:
                    new_streak = db_user.streak + 1
                elif gap_days == 2:
                    inventory = (await session.exec(
                        select(UserInventory).where(UserInventory.user_id == db_user.id).with_for_update()
                    )).one_or_none()
                    if inventory is not None and inventory.streak_freezes > 0:
                        inventory.streak_freezes -= 1
                        session.add(inventory)
                        new_streak = db_user.streak + 1
                    else:
                        await self._set_previous_streak(session, db_user.id, db_user.streak)
                        new_streak = 1
                else:
                    await self._set_previous_streak(session, db_user.id, db_user.streak)
                    new_streak = 1

            db_user.streak = new_streak
            db_user.streaked_at = now.astimezone(timezone.utc)
            session.add(db_user)
            await session.commit()

            user.streak = db_user.streak
            user.streaked_at = db_user.streaked_at

    async def reset_streak(self, user: User) -> None:
        async with self._session() as session:
            db_user = await session.get(User, user.id)
            if db_user is None:
                return
            if db_user.streak > 0:
                await self._set_previous_streak(session, db_user.id, db_user.streak)
            db_user.streak = 0
            session.add(db_user)
            await session.commit()

            user.streak = db_user.streak

    async def get_previous_streak(self, user_id: ULID) -> int:
        async with self._session() as session:
            state = await self._get_streak_state(session, user_id, for_update=False)
            return state.previous_streak if state is not None else 0

    async def clear_previous_streak(self, user_id: ULID) -> None:
        async with self._session() as session:
            async with session.begin():
                await self._set_previous_streak(session, user_id, 0)

    async def _get_streak_state(
        self,
        session: AsyncSession,
        user_id: ULID,
        *,
        for_update: bool,
    ) -> UserStreakState | None:
        query = select(UserStreakState).where(UserStreakState.user_id == user_id)
        if for_update:
            query = query.with_for_update()
        return (await session.exec(query)).one_or_none()

    async def _set_previous_streak(self, session: AsyncSession, user_id: ULID, previous_streak: int) -> None:
        state = await self._get_streak_state(session, user_id, for_update=True)
        value = max(previous_streak, 0)
        if state is None:
            state = UserStreakState(user_id=user_id, previous_streak=value)
        else:
            state.previous_streak = value
        session.add(state)


__all__ = ["UserRepository"]
