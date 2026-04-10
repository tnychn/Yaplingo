from pydantic import BaseModel


class HistoryEntry(BaseModel):
    date_key: str
    xp_earned: int
    goal_met: bool
    lessons_completed: int


class StatsResponse(BaseModel):
    seven_day_avg_xp: float
    thirty_day_best_streak: int
    completion_rate_30d: float
    lifetime_xp: int


__all__ = [
    "HistoryEntry",
    "StatsResponse",
]
