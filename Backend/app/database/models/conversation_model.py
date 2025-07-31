from datetime import datetime

from pydantic import BaseModel


class ConversationModel(BaseModel):
    title: str
    started_at: datetime
