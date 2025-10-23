from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, File, Response, UploadFile, HTTPException
from ulid import ULID
from app.core import PipelineResult, Transcript, Yaplingo
from app import db as db_mod
from typing import List
from pydantic import BaseModel

# ensure DB/tables are created at import
db_mod.init_db()


TRANSCRIPTS: dict[ULID, Transcript] = {}  # TODO: use Redis for storing temporary data

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.yaplingo = Yaplingo()
    yield


app = FastAPI(lifespan=lifespan)


def yaplingo() -> Yaplingo:
    return app.state.yaplingo


@app.get("/")
async def get_new_transcript(yaplingo: Yaplingo = Depends(yaplingo)) -> Transcript:
    transcript = yaplingo.generate_transcript()
    TRANSCRIPTS[transcript.id] = transcript
    return transcript


@app.get("/{tid}")
async def get_transcript(tid: ULID) -> Transcript | None:
    return TRANSCRIPTS.get(tid)


@app.get("/{tid}/pronunciation.wav")
async def get_transcript_pronunciation(tid: ULID, yaplingo: Yaplingo = Depends(yaplingo)):
    transcript = TRANSCRIPTS.get(tid)
    if transcript is None:
        return Response(status_code=404)
    audio = yaplingo.get_pronunciation(transcript.text)
    return Response(content=audio, media_type="audio/vnd.wav")


@app.post("/{tid}/teach")
async def post_transcript_teach(
    tid: ULID,
    audio: UploadFile = File(...),
    yaplingo: Yaplingo = Depends(yaplingo),
) -> PipelineResult | None:
    transcript = TRANSCRIPTS.get(tid)
    if transcript is None:
        return None
    data = await audio.read()
    return yaplingo.analyze(data, transcript)

# pydantic models for responses
class MetricOut(BaseModel):
    id: str
    phoneme_accuracy: float = None
    pronunciation_score: float = None
    fluency_score: float = None
    duration: float = None
    snr_estimate: float = None
    processing_time: float = None
    extras: dict = None
    created_at: str

class SessionMetricsOut(BaseModel):
    session_id: str
    transcript_id: str = None
    created_at: str
    metrics: List[MetricOut]

class TrendRow(BaseModel):
    session_id: str
    created_at: str
    phoneme_accuracy: float = None
    pronunciation_score: float = None
    fluency_score: float = None

# add endpoints
@app.get("/metrics/{user_id}", response_model=List[SessionMetricsOut])
def api_get_metrics(user_id: str, limit: int = 20):
    results = db_mod.get_metrics(user_id=user_id, limit=limit)
    return results

@app.get("/metrics/{user_id}/trend", response_model=List[TrendRow])
def api_get_trend(user_id: str, limit: int = 10):
    trend = db_mod.get_trend(user_id=user_id, limit=limit)
    return trend