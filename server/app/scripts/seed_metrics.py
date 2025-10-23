import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app import db as db_mod

def seed_dummy_metrics():
    db_mod.save_metrics(
        user_id="user123",
        phoneme_accuracy=0.92,
        pronunciation_score=85.3,
        fluency_score=0.88,
        duration=3.6,
        snr_estimate=11.2,
        processing_time=0.52,
    )
    print("✅ Dummy metrics inserted successfully!")

if __name__ == "__main__":
    seed_dummy_metrics()