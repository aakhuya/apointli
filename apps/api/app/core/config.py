from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Application
    APP_NAME: str = "Apointli"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 3001

    # Security
    SECRET_KEY: str = "dev-secret-change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3002", "http://localhost:3000"]

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://apointli:apointli123@localhost:5432/apointli"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"


settings = Settings()
