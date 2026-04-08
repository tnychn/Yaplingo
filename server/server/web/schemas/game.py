from pydantic import BaseModel

from server.service.game import AchievementClaim, AchievementStatus, LeaderboardEntry


class LeaderboardResponse(BaseModel):
    me: LeaderboardEntry
    entries: list[LeaderboardEntry]


class AchievementResponse(AchievementStatus): ...


class AchievementClaimInput(BaseModel):
    achievement_key: str


class AchievementClaimResponse(AchievementClaim): ...


class GemBalanceResponse(BaseModel):
    balance: int


__all__ = [
    "LeaderboardResponse",
    "AchievementResponse",
    "AchievementClaimInput",
    "AchievementClaimResponse",
    "GemBalanceResponse",
]
