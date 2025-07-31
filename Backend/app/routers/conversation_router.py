from fastapi import APIRouter, HTTPException, status

from ..core.logging import setup_logger
from ..schemas.conversation_schema import ConversationRetrieve, DialogueRetrieve
from ..services.conversation_service import ConversationService

_logger = setup_logger(__name__)
router = APIRouter()


@router.post(
    "/conversations/chat",
    response_model=str,
    status_code=status.HTTP_200_OK,
    summary="Send a message to the chatbot and get a response",
    tags=["Conversations"],
)
async def send_message(message: str):
    _logger.debug("Send message was called")

    try:
        conversation_service = ConversationService()
        return conversation_service.send_message(message)
    except Exception as e:
        _logger.error(f"Error sending message: {str(e)}")
        _logger.error(f"Exception type: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while sending message",
        )


@router.get(
    "/conversations",
    response_model=list[ConversationRetrieve],
    status_code=status.HTTP_200_OK,
    summary="Retrieve all conversations metadata",
    tags=["Conversations"],
)
async def retrieve_all_conversations_metadata():
    try:
        conversation_service = ConversationService()
        return conversation_service.retrieve_all_conversations_metadata()
    except Exception as e:
        _logger.error(f"Error retrieving all conversations metadata: {str(e)}")
        _logger.error(f"Exception type: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while retrieving all conversations metadata",
        )


@router.get(
    "/conversations/{id}",
    response_model=DialogueRetrieve,
    status_code=status.HTTP_200_OK,
    summary="Retrieve a dialogue between the user and the assistant",
    tags=["Conversations"],
)
async def retrieve_dialogue(id: str):
    try:
        conversation_service = ConversationService()
        return conversation_service.retrieve_dialogue(id)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error retrieving dialogue with id <{id}>º: {str(e)}")
        _logger.error(f"Exception type: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error while retrieving dialogue with id: {id}",
        )
