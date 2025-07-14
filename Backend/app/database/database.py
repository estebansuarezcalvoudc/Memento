from app.core.config import settings
from sqlmodel import SQLModel, create_engine, Session


engine = create_engine(settings.database_url)
SQLModel.metadata.create_all(engine)


# Crear las tablas (sólo en desarrollo/test, no en producción)
def init_db():
    Base.metadata.create_all(bind=engine)
