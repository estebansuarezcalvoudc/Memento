from ...database.config import get_db_session


def get_db_session():
    yield from get_db_session()
