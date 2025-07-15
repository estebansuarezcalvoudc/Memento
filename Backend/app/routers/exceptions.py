from fastapi import HTTPException, status


class AttributeListSizeMismatch(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="There should be the same number of each attribute",
        )
