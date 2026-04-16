from __future__ import annotations

from redis.asyncio import Redis
from ulid import ULID

from server.repository.entities import User


class LeaderboardStore:
    class Key:
        leaderboard = "leaderboard:xp"

    def __init__(self, client: Redis):
        self._client = client

    async def dump(self, entries: list[tuple[ULID, int]]) -> None:
        if mapping := {str(uid): points for uid, points in entries}:
            await self._client.zadd(LeaderboardStore.Key.leaderboard, mapping)

    async def increment(self, user: User, points: int) -> int:
        return int(await self._client.zincrby(LeaderboardStore.Key.leaderboard, points, str(user.id)))

    async def list(self, n: int = 50) -> list[tuple[ULID, int]]:
        results = await self._client.zrevrange(LeaderboardStore.Key.leaderboard, 0, n - 1, withscores=True)
        return [(ULID.from_str(uid), int(score)) for uid, score in results]

    async def get(self, user: User) -> tuple[int, int] | None:
        rank = await self._client.zrevrank(LeaderboardStore.Key.leaderboard, str(user.id))
        if rank is None:
            return None
        score = await self._client.zscore(LeaderboardStore.Key.leaderboard, str(user.id))
        if score is None:
            return None
        return (rank + 1, int(score))  # zrevrank is 0-based so add 1 for 1-based rank

    async def get_by_uid(self, uid: ULID) -> tuple[int, int] | None:
        rank = await self._client.zrevrank(LeaderboardStore.Key.leaderboard, str(uid))
        if rank is None:
            return None
        score = await self._client.zscore(LeaderboardStore.Key.leaderboard, str(uid))
        if score is None:
            return None
        return (rank + 1, int(score))

    async def list_proximity_window(self, score: int, window: int, limit: int = 5) -> tuple[list[tuple[ULID, int]], list[tuple[ULID, int]]]:
        above_results = await self._client.zrangebyscore(
            LeaderboardStore.Key.leaderboard,
            score + 1,
            score + window,
            start=0,
            num=limit,
            withscores=True,
        )
        below_results = await self._client.zrevrangebyscore(
            LeaderboardStore.Key.leaderboard,
            score - 1,
            score - window,
            start=0,
            num=limit,
            withscores=True,
        )
        above = [(ULID.from_str(uid), int(raw_score)) for uid, raw_score in above_results]
        below = [(ULID.from_str(uid), int(raw_score)) for uid, raw_score in below_results]
        return above, below

    async def count(self) -> int:
        return await self._client.zcard(LeaderboardStore.Key.leaderboard)


__all__ = ["LeaderboardStore"]
