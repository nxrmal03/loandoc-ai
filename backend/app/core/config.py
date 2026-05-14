from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # API key
    google_api_key: str

    # Storage
    chroma_db_path: str = "./chroma_db"
    upload_dir: str = "./data/uploads"

    # RAG tuning
    chunk_size: int = 1000
    chunk_overlap: int = 200
    retrieval_top_k: int = 5

    # Models
    primary_llm: str = "models/gemini-2.5-flash"
    fallback_llm: str = "models/gemini-2.0-flash-lite"
    embedding_model: str = "models/gemini-embedding-001"

    # Server
    backend_port: int = 8000
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def chroma_db_path_abs(self) -> Path:
        return Path(self.chroma_db_path).resolve()

    @property
    def upload_dir_abs(self) -> Path:
        return Path(self.upload_dir).resolve()


settings = Settings()
