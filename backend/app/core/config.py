from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # App
    APP_NAME: str = "Faculty DSS API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    # Use psycopg (v3) driver — more reliable on Windows than psycopg2
    DATABASE_URL: str = "postgresql+psycopg://postgres:password@localhost:5432/faculty_dss"

    # Clerk Auth
    CLERK_SECRET_KEY: str = "sk_test_PLACEHOLDER"
    CLERK_JWKS_URL: str = "https://YOUR_CLERK_DOMAIN.clerk.accounts.dev/.well-known/jwks.json"

    # CORS — comma-separated origins allowed
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]


settings = Settings()
