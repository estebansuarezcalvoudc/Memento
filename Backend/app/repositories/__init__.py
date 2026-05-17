from .implementations.mongo.mongo_client import close_mongo_client as _close


def close_database_connection() -> None:
    _close()
