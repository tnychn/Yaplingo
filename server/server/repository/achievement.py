from datetime import datetime

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from ulid import ULID

from .entities import UserAchievement, UserGemBalance


class AchievementRepository:
    def __init__(self, session: async_sessionmaker[AsyncSession]):
        self._session = session

    async def list_unlocked(self, user_id: ULID) -> dict[str, datetime]:
        async with self._session() as session:
            query = select(UserAchievement).where(UserAchievement.user_id == user_id)
            rows = (await session.exec(query)).all()
            return {row.achievement_key: row.unlocked_at for row in rows}

    async def get_gem_balance(self, user_id: ULID) -> int:
        async with self._session() as session:
            query = select(UserGemBalance).where(UserGemBalance.user_id == user_id)
            row = (await session.exec(query)).one_or_none()
            return row.balance if row is not None else 0

    async def claim_and_award(
        self,
        user_id: ULID,
        achievement_key: str,
        gem_reward: int,
    ) -> tuple[datetime, int] | None:
        async with self._session() as session:
            try:
                async with session.begin():
                    existing = (await session.exec(
                        select(UserAchievement).where(
                            UserAchievement.user_id == user_id,
                            UserAchievement.achievement_key == achievement_key,
                        )
                    )).one_or_none()
                    if existing is not None:
                        return None

                    achievement = UserAchievement(user_id=user_id, achievement_key=achievement_key)
                    session.add(achievement)

                    gem_row = (await session.exec(
                        select(UserGemBalance)
                        .where(UserGemBalance.user_id == user_id)
                        .with_for_update()
                    )).one_or_none()
                    if gem_row is None:
                        gem_row = UserGemBalance(user_id=user_id, balance=0)
                        session.add(gem_row)

                    gem_row.balance += gem_reward
                    await session.flush()
                    return achievement.unlocked_at, gem_row.balance
            except IntegrityError:
                await session.rollback()
                return None


__all__ = ["AchievementRepository"]
