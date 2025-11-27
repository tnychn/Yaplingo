from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # URL used by SQLAlchemy's create_engine. Default to a local sqlite file for
    # development so the app can start without an external DB configured.
    url: str = "sqlite:///./yaplingo.db"
    # Deprecated/optional explicit database URL field (kept for compatibility)
    database_url: str | None = None
    redis_url: str | None = None
    openai_api_key: str | None = None


# Instantiate settings from environment (Pydantic V2 BaseSettings behavior).
# Use Settings() so environment variables (e.g. URL, DATABASE_URL) are read.
settings = Settings()