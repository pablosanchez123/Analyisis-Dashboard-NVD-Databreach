from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_path: str = "../data/nvd.sqlite"
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    class Config:
        env_file = "../.env"
        extra = "ignore"  # .env is shared with ingestion scripts (NVD_API_KEY etc.)


settings = Settings()
