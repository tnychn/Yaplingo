from datetime import datetime

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


class TopicMasteryResponse(BaseModel):
    topic: str
    total_xp: int
    lesson_count: int
    avg_accuracy: float
    avg_speed_ms: float
    mastery_score: float
    tier: str
    updated_at: datetime | None


__all__ = [
    "HistoryEntry",
    "StatsResponse",
    "TopicMasteryResponse",
]
