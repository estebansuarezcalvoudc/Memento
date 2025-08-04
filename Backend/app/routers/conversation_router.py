from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from ..core.logging import setup_logger
from ..dependencies.auth_dependencies import get_current_active_user
from ..schemas.auth_schema import User
from ..schemas.conversation_schema import (
    ConversationCreateRequest,
    ConversationCreateResponse,
    ConversationRetrieve,
    ConversationUpdateRequest,
    DialogueRetrieve,
    SendMessageRequest,
)
from ..services.conversation_service import ConversationService

_logger = setup_logger(__name__)
router = APIRouter()


@router.post(
    "/conversations",
    status_code=status.HTTP_200_OK,
    summary="Create a new conversation",
    tags=["Conversations"],
)
async def create_conversation(
    conversation_create_request: ConversationCreateRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> ConversationCreateResponse:
    try:
        conversation_service = ConversationService()
        return conversation_service.create_conversation(conversation_create_request)
    except Exception as e:
        _logger.error(f"Error creating conversation: {str(e)}")
        _logger.error(f"Exception type: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while creating conversation",
        )


@router.post(
    "/conversations/{id}/chat",
    status_code=status.HTTP_200_OK,
    summary="Send a message to the chatbot and get a response",
    tags=["Conversations"],
)
async def send_message(
    id: str,
    send_message_request: SendMessageRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> str:
    try:
        conversation_service = ConversationService()
        return conversation_service.send_message(id, send_message_request)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error sending message: {str(e)}")
        _logger.error(f"Exception type: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while sending message",
        )


@router.get(
    "/conversations",
    status_code=status.HTTP_200_OK,
    summary="Retrieve all conversations metadata",
    tags=["Conversations"],
)
async def retrieve_all_conversations_metadata(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> list[ConversationRetrieve]:
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
    status_code=status.HTTP_200_OK,
    summary="Retrieve a dialogue between the user and the assistant",
    tags=["Conversations"],
)
async def retrieve_dialogue(
    id: str, current_user: Annotated[User, Depends(get_current_active_user)]
) -> DialogueRetrieve:
    try:
        conversation_service = ConversationService()
        return conversation_service.retrieve_dialogue(id)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error retrieving dialogue with id={id}: {str(e)}")
        _logger.error(f"Exception type: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error while retrieving dialogue with id={id}",
        )


@router.put(
    "/conversations/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Update the metadata of a conversation",
    tags=["Conversations"],
)
async def update_conversation_metadata(
    id: str,
    metadata: ConversationUpdateRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> None:
    try:
        conversation_service = ConversationService()
        conversation_service.update_conversation_metadata(id, metadata)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error updating conversation with id={id}: {str(e)}")
        _logger.error(f"Exception type: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error while updating conversation with id={id}",
        )


@router.delete(
    "/conversations/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a conversation",
    tags=["Conversations"],
)
async def delete_conversation(
    id: str, current_user: Annotated[User, Depends(get_current_active_user)]
) -> None:
    try:
        conversation_service = ConversationService()
        conversation_service.delete_conversation(id)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error deleting conversation with id={id}: {str(e)}")
        _logger.error(f"Exception type: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error while deleting conversation with id={id}",
        )
