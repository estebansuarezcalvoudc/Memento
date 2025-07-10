from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    hf_token: str

    class Config:
        env_file = "Backend/.env"
        env_file_encoding = "utf-8"


settings = Settings()
