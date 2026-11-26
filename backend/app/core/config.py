from typing import List, Union
from pydantic import AnyHttpUrl, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    # Project metadata
    PROJECT_NAME: str = "CiteClash API"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            import json
            if isinstance(v, str):
                return json.loads(v)
            return v
        raise ValueError(v)

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/citeclash"

    # JWT Authentication
    JWT_SECRET_KEY: str = "citeclash_super_secret_jwt_encryption_key_change_in_production_min_32_chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Google OAuth (placeholders)
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"

    # AI Engine Keys (Zero-Budget Multi-LLM Runner)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    ENABLE_GEMINI_GROUNDING: bool = True
    GROQ_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    PERPLEXITY_API_KEY: str = ""
    SERPER_API_KEY: str = ""

    # Phase 5: Billing & Payment Gateway (Lemon Squeezy / Dodo Payments)
    BILLING_PROVIDER: str = "lemon_squeezy" # "lemon_squeezy" | "dodo_payments"
    LEMON_SQUEEZY_API_KEY: str = ""
    DODO_PAYMENTS_API_KEY: str = ""
    BILLING_WEBHOOK_SECRET: str = "whsec_citeclash_dev_secret_token_123"
    BILLING_DEV_SANDBOX_MODE: bool = True

    # Initial Super Admin Seeder
    FIRST_SUPER_ADMIN_EMAIL: str = "admin@citeclash.com"
    FIRST_SUPER_ADMIN_PASSWORD: str = "AdminPassword@123"
    FIRST_SUPER_ADMIN_NAME: str = "CiteClash SuperAdmin"

    # Automated Daily Cron & Security
    CRON_SECRET: str = "citeclash_cron_secret_auth_token_999"

    # Transactional Email (Resend / SMTP)
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "RankPulse AI <notifications@rankpulse.ai>"
    FRONTEND_URL: str = "http://localhost:5173"

    @model_validator(mode="after")
    def enforce_production_security(self) -> "Settings":
        if self.ENVIRONMENT.strip().lower() in ("production", "prod"):
            self.BILLING_DEV_SANDBOX_MODE = False
        return self


settings = Settings()
