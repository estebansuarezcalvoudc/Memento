import json
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    status,
)

from ...core.logging import setup_logger
from ...dependencies.auth_dependencies import (
    get_current_active_user,
    get_current_ws_user,
)
from ...dependencies.service_dependencies import get_conversation_service
from ...schemas.auth.auth_schema import User
from ...schemas.conversation.conversation_schema import (
    ChatRequest,
    ConversationMetadataRetrieve,
    ConversationUpdateRequest,
    Messages,
)
from ...services.conversation.conversation_service import ConversationService

_logger = setup_logger(__name__)
router = APIRouter(prefix="/conversations", tags=["Conversations"])


@router.websocket("/ws")
async def chat_websocket(
    websocket: WebSocket,
    current_user: Annotated[User, Depends(get_current_ws_user)],
    conversation_service: Annotated[
        ConversationService, Depends(get_conversation_service)
    ],
):
    """
    WebSocket endpoint for creating conversations and sending messages with streaming.

    Query params:
        token (str): JWT bearer token for authentication.

    Client sends:
        { "conversation_id": null | "<id>", "message": "...", "current_datetime": "..." }

    Server sends (in order):
        { "type": "conversation_created", "conversation_id": "..." }
        { "type": "retrieving" }  — indicates the assistant is retrieving context before streaming
        { "type": "token", "content": "..." }  — repeated for each LLM token
        { "type": "title", "title": "..." }  — sent before done on first message only
        { "type": "done" }  — sent when streaming has successfully completed
        { "type": "error", "content": "..." }  — on failure, instead of done
    """
    await websocket.accept()

    try:
        raw = await websocket.receive_text()
        chat_request = ChatRequest.model_validate_json(raw)

        event_stream = await conversation_service.handle_chat(
            chat_request, current_user.id
        )

        async for event in event_stream:
            await websocket.send_text(event.model_dump_json())

        await websocket.close()

    except WebSocketDisconnect:
        _logger.info(f"WebSocket disconnected for user {current_user.id}")
    except Exception as e:
        _logger.error(
            f"Error in chat WebSocket for user {current_user.id}: {type(e).__name__}: {e}",
            exc_info=True,
        )
        try:
            await websocket.send_text(
                json.dumps({"type": "error", "content": "Internal server error"})
            )
        except Exception:
            pass
        await websocket.close(code=4000)


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    summary="Retrieve all conversations metadata",
    tags=["Conversations"],
)
async def retrieve_all_conversations_metadata(
    current_user: Annotated[User, Depends(get_current_active_user)],
    conversation_service: Annotated[
        ConversationService, Depends(get_conversation_service)
    ],
) -> list[ConversationMetadataRetrieve]:
    try:
        return conversation_service.retrieve_all_conversations_metadata(current_user.id)
    except Exception as e:
        _logger.error(
            f"Error retrieving all conversations metadata: {str(e)}", exc_info=True
        )
        _logger.error(f"Exception type: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while retrieving all conversations metadata",
        )


@router.get(
    "/{id}",
    status_code=status.HTTP_200_OK,
    summary="Retrieve a dialogue between the user and the assistant",
    tags=["Conversations"],
)
async def retrieve_dialogue(
    id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    conversation_service: Annotated[
        ConversationService, Depends(get_conversation_service)
    ],
) -> Messages:
    try:
        dialogue = conversation_service.retrieve_dialogue(id, current_user.id)
        return dialogue.messages
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(
            f"Error retrieving dialogue with id={id}: {str(e)}", exc_info=True
        )
        _logger.error(f"Exception type: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error while retrieving dialogue with id={id}",
        )


@router.put(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Update the metadata of a conversation",
    tags=["Conversations"],
)
async def update_conversation_metadata(
    id: str,
    metadata: ConversationUpdateRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    conversation_service: Annotated[
        ConversationService, Depends(get_conversation_service)
    ],
) -> None:
    try:
        conversation_service.update_conversation_metadata(id, metadata, current_user.id)
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
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a conversation",
    tags=["Conversations"],
)
async def delete_conversation(
    id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    conversation_service: Annotated[
        ConversationService, Depends(get_conversation_service)
    ],
) -> None:
    try:
        conversation_service.delete_conversation(id, current_user.id)
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Error deleting conversation with id={id}: {str(e)}")
        _logger.error(f"Exception type: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error while deleting conversation with id={id}",
        )
