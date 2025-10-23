# Yaplingo/server/app/db.py

from sqlalchemy import create_engine, Column, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime
import os

# Path for SQLite database
DB_PATH = os.path.join(os.path.dirname(__file__), "yaplingo.db")

# Initialize database
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# -------------------------------------------------------------------
# Database model
# -------------------------------------------------------------------
class Metrics(Base):
    __tablename__ = "metrics"

    id = Column(String, primary_key=True)
    user_id = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    phoneme_accuracy = Column(Float)
    pronunciation_score = Column(Float)
    fluency_score = Column(Float)
    duration = Column(Float)
    snr_estimate = Column(Float)
    processing_time = Column(Float)


# -------------------------------------------------------------------
# Create tables
# -------------------------------------------------------------------
Base.metadata.create_all(bind=engine)

# -------------------------------------------------------------------
# Helper functions
# -------------------------------------------------------------------
def save_metrics(
    user_id: str,
    phoneme_accuracy: float,
    pronunciation_score: float,
    fluency_score: float,
    duration: float,
    snr_estimate: float,
    processing_time: float,
):
    """Insert one row of metrics into the database"""
    from uuid import uuid4

    db = SessionLocal()
    try:
        metric = Metrics(
            id=str(uuid4()),
            user_id=user_id,
            phoneme_accuracy=phoneme_accuracy,
            pronunciation_score=pronunciation_score,
            fluency_score=fluency_score,
            duration=duration,
            snr_estimate=snr_estimate,
            processing_time=processing_time,
        )
        db.add(metric)
        db.commit()
        print(f"✅ Metrics saved for user_id={user_id}")
    except Exception as e:
        print("❌ Error saving metrics:", e)
        db.rollback()
    finally:
        db.close()


def get_metrics(user_id: str, limit: int = 10):
    """Return last N metrics for a user"""
    db = SessionLocal()
    try:
        rows = (
            db.query(Metrics)
            .filter(Metrics.user_id == user_id)
            .order_by(Metrics.timestamp.desc())
            .limit(limit)
            .all()
        )
        return [r.__dict__ for r in rows]
    finally:
        db.close()
