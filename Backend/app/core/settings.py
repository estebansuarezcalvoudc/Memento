from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = ConfigDict(
        env_file=["/.env.docker", "/Backend/.env"],
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    hf_token: str

    encryption_key: str

    secret_key: str
    algorithm: str
    access_token_expire_minutes: int

    ollama_host: str
    ollama_port: int

    mongo_user: str
    mongo_host: str
    mongo_password: str
    mongo_port: int

    chroma_host: str
    chroma_port: int
    rag_embedding_model: str
    rag_collection_name: str

    @property
    def ollama_url(self) -> str:
        return f"http://{self.ollama_host}:{self.ollama_port}"

    @property
    def mongo_url(self) -> str:
        return f"mongodb://{self.mongo_user}:{self.mongo_password}@{self.mongo_host}:{self.mongo_port}"


settings = Settings()
