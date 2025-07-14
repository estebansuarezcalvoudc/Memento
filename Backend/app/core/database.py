from sqlmodel import SQLModel, create_engine
from ..core.config import settings


engine = create_engine(settings.database_url)
SQLModel.metadata.create_all(engine)
