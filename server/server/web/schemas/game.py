from datetime import datetime

from pydantic import BaseModel

from server.service.game import (
    AchievementClaim,
    AchievementStatus,
    ActiveEvent,
    GemConfig,
    GemSpend,
    InventoryStatus,
    LeaderboardEntry,
    Proximity,
    ProximityNeighbour,
    UseSkill,
)


class LeaderboardResponse(BaseModel):
    me: LeaderboardEntry
    entries: list[LeaderboardEntry]


class AchievementResponse(AchievementStatus): ...


class AchievementClaimInput(BaseModel):
    achievement_key: str


class AchievementClaimResponse(AchievementClaim): ...


class GemBalanceResponse(BaseModel):
    balance: int


class GemConfigResponse(GemConfig): ...


class SpendGemsInput(BaseModel):
    item_key: str


class SpendGemsResponse(GemSpend): ...


class ActiveEventResponse(ActiveEvent):
    starts_at: datetime
    ends_at: datetime


class ProximityNeighbourResponse(ProximityNeighbour): ...


class ProximityResponse(Proximity): ...


class UserInventoryResponse(InventoryStatus): ...


class UseSkillResponse(UseSkill): ...


__all__ = [
    "LeaderboardResponse",
    "AchievementResponse",
    "AchievementClaimInput",
    "AchievementClaimResponse",
    "GemBalanceResponse",
    "GemConfigResponse",
    "SpendGemsInput",
    "SpendGemsResponse",
    "ActiveEventResponse",
    "ProximityNeighbourResponse",
    "ProximityResponse",
    "UserInventoryResponse",
    "UseSkillResponse",
]
