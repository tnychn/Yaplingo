from fastapi import APIRouter, HTTPException, Query, status

from ..dependencies import Service, User
from ..schemas.game import (
    AchievementClaimInput,
    AchievementClaimResponse,
    AchievementResponse,
    ActiveEventResponse,
    GemBalanceResponse,
    GemConfigResponse,
    LeaderboardResponse,
    ProximityResponse,
    SpendGemsInput,
    SpendGemsResponse,
    UseSkillResponse,
    UserInventoryResponse,
)

router = APIRouter()


@router.get("/leaderboard")
async def leaderboard(user: User, service: Service) -> LeaderboardResponse:
    entries = await service.game.list_leaderboard()
    my_entry = await service.game.get_leaderboard_user(user)
    return LeaderboardResponse(me=my_entry, entries=entries)


@router.get("/leaderboard/proximity")
async def leaderboard_proximity(
    user: User,
    service: Service,
    xp_window: int = Query(200, ge=10, le=1000),
) -> ProximityResponse:
    proximity = await service.game.get_leaderboard_proximity(user, xp_window=xp_window)
    return ProximityResponse(**proximity.model_dump())


@router.get("/achievements")
async def achievements(user: User, service: Service) -> list[AchievementResponse]:
    items = await service.game.list_achievements(user)
    return [AchievementResponse(**item.model_dump()) for item in items]


@router.get("/gems")
async def gems(user: User, service: Service) -> GemBalanceResponse:
    balance = await service.game.get_gem_balance(user)
    return GemBalanceResponse(balance=balance)


@router.get("/gems/config")
async def gem_config(service: Service) -> GemConfigResponse:
    config = await service.game.get_gem_config()
    return GemConfigResponse(**config.model_dump())


@router.post("/gems/spend")
async def spend_gems(
    payload: SpendGemsInput,
    user: User,
    service: Service,
) -> SpendGemsResponse:
    try:
        result = await service.game.spend_gems(user, payload.item_key)
    except (ValueError, PermissionError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    return SpendGemsResponse(**result.model_dump())


@router.get("/active-events")
async def active_events(user: User, service: Service) -> list[ActiveEventResponse]:
    events = await service.game.list_active_events(user)
    return [ActiveEventResponse(**event.model_dump()) for event in events]


@router.get("/inventory")
async def inventory(user: User, service: Service) -> UserInventoryResponse:
    inv = await service.game.get_inventory(user)
    return UserInventoryResponse(**inv.model_dump())


@router.post("/inventory/use")
async def use_skill(
    user: User,
    service: Service,
    item_key: str = Query(..., min_length=1),
) -> UseSkillResponse:
    try:
        result = await service.game.use_skill(user, item_key)
    except (ValueError, PermissionError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    return UseSkillResponse(**result.model_dump())


@router.post("/achievements/claim")
async def claim_achievement(
    payload: AchievementClaimInput,
    user: User,
    service: Service,
) -> AchievementClaimResponse:
    try:
        unlocked = await service.game.claim_achievement(user, payload.achievement_key)
    except (ValueError, PermissionError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    return AchievementClaimResponse(**unlocked.model_dump())


__all__ = ["router"]
