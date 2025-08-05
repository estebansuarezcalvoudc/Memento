from functools import wraps

from bson.errors import InvalidId
from fastapi import HTTPException, status


def handle_invalid_id(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except InvalidId as e:
            id_value = kwargs.get("id") or "unknown"
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"The id={id_value} is not a valid id",
            ) from e

    return wrapper
