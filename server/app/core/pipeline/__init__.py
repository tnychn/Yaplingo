# Yaplingo/server/app/core/pipeline/__init__.py
# add imports at top
from app import db as db_mod
import time

def compute_simple_metrics(align_result):
    """
    align_result: object/dict that contains:
      - total_phonemes
      - mismatches: dict with counts of replacements/insertions/deletions
      - duration_seconds
    """
    total = getattr(align_result, "total_phonemes", None) or align_result.get("total_phonemes", None)
    mismatches = align_result.get("mismatches", {}) if isinstance(align_result, dict) else getattr(align_result, "mismatches", {})
    replacements = mismatches.get("replace", 0)
    deletions = mismatches.get("delete", 0)
    insertions = mismatches.get("insert", 0)
    if total and total > 0:
        phoneme_accuracy = max(0.0, (total - (replacements + deletions + insertions)) / total)
    else:
        phoneme_accuracy = None

    # pronunciation_score: simple heuristic (scale 0-100)
    if phoneme_accuracy is not None:
        pronunciation_score = round(phoneme_accuracy * 100, 2)
    else:
        pronunciation_score = None

    fluency_score = align_result.get("fluency_score") if isinstance(align_result, dict) else getattr(align_result, "fluency_score", None)
    duration = align_result.get("duration_seconds") if isinstance(align_result, dict) else getattr(align_result, "duration_seconds", None)
    processing_time = align_result.get("processing_time") if isinstance(align_result, dict) else getattr(align_result, "processing_time", None)

    return {
        "phoneme_accuracy": phoneme_accuracy,
        "pronunciation_score": pronunciation_score,
        "fluency_score": fluency_score,
        "duration": duration,
        "snr_estimate": align_result.get("snr_estimate") if isinstance(align_result, dict) else getattr(align_result, "snr_estimate", None),
        "processing_time": processing_time,
        "extras": {"replacements": replacements, "deletions": deletions, "insertions": insertions}
    }

import time
from app.db import save_metrics  # from the file you'll create

def run_pipeline_and_return_result(audio_path: str, user_id: str, language: str = "en"):
    """
    Run the full Yaplingo speech pipeline for a given audio input and user.
    Returns the final processed result (transcript, pronunciation feedback, etc.)
    and saves performance metrics to the database.
    """
    start_time = time.time()

    # Example: process the audio (adjust depending on your project)
    from app.core.pipeline.main import pipeline  # or wherever your pipeline is defined
    result = pipeline.process(audio_path, language=language)

    processing_time = time.time() - start_time

    # Compute dummy metrics — you can refine later
    phoneme_accuracy = 0.95
    pronunciation_score = 87.5
    fluency_score = 0.9
    duration = result.get("duration", 3.5)
    snr_estimate = result.get("snr", 12.1)

    # Save metrics (make sure save_metrics() exists in db.py)
    save_metrics(
        user_id=user_id,
        phoneme_accuracy=phoneme_accuracy,
        pronunciation_score=pronunciation_score,
        fluency_score=fluency_score,
        duration=duration,
        snr_estimate=snr_estimate,
        processing_time=processing_time,
    )

    return result
