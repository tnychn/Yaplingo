from fastapi import APIRouter, Query

from server.service.game import HistoryEntry, StatsData, TopicMastery

from ..dependencies import Service, User

router = APIRouter()


@router.get("/history", response_model=list[HistoryEntry])
async def get_xp_history(
    user: User,
    service: Service,
    days: int = Query(30, ge=7, le=365),
) -> list[HistoryEntry]:
    """Get XP history for the last N days."""
    return await service.game.get_xp_history(user, days)


@router.get("/stats", response_model=StatsData)
async def get_stats(user: User, service: Service) -> StatsData:
    """Get aggregated stats for the current user."""
    return await service.game.get_stats(user)


@router.get("/mastery", response_model=list[TopicMastery])
async def get_mastery(user: User, service: Service) -> list[TopicMastery]:
    """Get topic mastery data for the current user."""
    return await service.game.get_mastery(user)


__all__ = ["router"]
