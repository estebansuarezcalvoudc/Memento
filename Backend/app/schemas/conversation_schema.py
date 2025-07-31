from pydantic import BaseModel


class UserChatbotInteraction(BaseModel):
    user_message: dict[str, str]
    assistant_response: dict[str, str]


class ConversationCreate(BaseModel):
    title: str
