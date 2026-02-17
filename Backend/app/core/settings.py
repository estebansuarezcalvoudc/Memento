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

    openai_key: str

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

    elastic_search_host: str
    elastic_search_port: str
    elastic_search_username: str
    elastic_search_password: str

    @property
    def ollama_url(self) -> str:
        return f"http://{self.ollama_host}:{self.ollama_port}"

    @property
    def mongo_url(self) -> str:
        return f"mongodb://{self.mongo_user}:{self.mongo_password}@{self.mongo_host}:{self.mongo_port}"

    @property
    def elastic_search_url(self) -> str:
        return f"http://{self.elastic_search_host}:{self.elastic_search_port}"

    @property
    def elastic_search_auth(self) -> tuple[str, str]:
        return (self.elastic_search_username, self.elastic_search_password)


settings = Settings()  # type: ignore
