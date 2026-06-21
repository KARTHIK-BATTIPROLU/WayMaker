from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    mongo_uri: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    groq_api_key_1: str
    groq_api_key_2: str
    serper_api_key: str
    frontend_url: str = "http://localhost:5173"
    # Marketing Kit v2
    replicate_api_token: str = "dummy"
    imgbb_api_key: str = "dummy"
    n8n_webhook_url: str = "dummy_url"
    n8n_deploy_secret: str = ""
    n8n_schedule_secret: str = "dev-refresh-secret"
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
