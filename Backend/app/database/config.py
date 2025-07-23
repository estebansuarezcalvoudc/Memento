from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from ..core.config import settings
from .models.meeting_model import Base

_engine = create_engine(settings.database_url)
_SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)

Base.metadata.create_all(bind=_engine)


def get_db_session():
    db = _SessionLocal()
    try:
        yield db
    finally:
        db.close()
