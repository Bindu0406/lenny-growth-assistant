from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    postgres_user: str = "postgres"
    postgres_password: str = "password123"
    postgres_db: str = "lenny_assistant"
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    database_url: str = "postgresql+asyncpg://postgres:password123@localhost:5432/lenny_assistant"
    
    default_llm_provider: str = "ollama"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen3:4b"
    
    similarity_threshold: float = 0.50
    top_k_chunks: int = 5

    class Config:
        env_file = ".env"
        extra = "ignore"

@lru_cache()
def get_settings() -> Settings:
    return Settings()