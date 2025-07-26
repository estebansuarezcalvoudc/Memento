from fastapi import APIRouter, HTTPException, status

from ..core.logging import setup_logger
from ..services.chat_service import ChatService

_logger = setup_logger(__name__)
router = APIRouter()


@router.post(
    "/chat",
    response_model=str,
    status_code=status.HTTP_200_OK,
    summary="Send a message to the chatbot and get a response",
    tags=["Chat"],
)
async def send_message(message: str):
    _logger.debug("Send message was called")

    try:
        chat_service = ChatService()
        return chat_service.send_message(message)
    except Exception as e:
        _logger.error(f"Error sending message: {str(e)}")
        _logger.error(f"Exception type: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while sending message",
        )
