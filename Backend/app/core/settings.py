from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    hf_token: str
    anthropic_key: str

    secret_key: str
    algorithm: str
    access_token_expire_minutes: int

    postgres_user: str
    postgres_password: str
    postgres_db: str
    postgres_host: str
    postgres_port: int

    ollama_host: str
    ollama_port: int

    mongo_user: str
    mongo_host: str
    mongo_password: str
    mongo_port: int

    @property
    def database_url(self) -> str:
        return f"postgresql://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"

    @property
    def ollama_url(self) -> str:
        return f"http://{self.ollama_host}:{self.ollama_port}"

    @property
    def mongo_url(self) -> str:
        return f"mongodb://{self.mongo_user}:{self.mongo_password}@{self.mongo_host}:{self.mongo_port}"

    class Config:
        env_file = ["/.env.docker", "/Backend/.env"]
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"  # Ignore extra environment variables


settings = Settings()  # type: ignore
