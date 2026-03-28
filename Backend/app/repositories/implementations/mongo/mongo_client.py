from functools import lru_cache

import pymongo
from pymongo.database import Database

from ....core.settings import settings


@lru_cache(maxsize=1)
def get_mongo_client() -> pymongo.MongoClient:
    return pymongo.MongoClient(settings.mongo_url)


def get_mongo_database() -> Database:
    return get_mongo_client()["tfg_db"]


def close_mongo_client() -> None:
    if get_mongo_client.cache_info().currsize == 0:
        return

    get_mongo_client().close()
    get_mongo_client.cache_clear()
