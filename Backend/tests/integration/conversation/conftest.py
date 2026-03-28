from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


@pytest.fixture(autouse=True)
def mock_vector_store():
    """
    Mock the vector store to avoid real ChromaDB connections during tests.
    """
    with patch("app.dependencies.service_dependencies.get_vector_store") as mock:
        mock.return_value = MagicMock()
        yield mock.return_value


@pytest.fixture
def mock_rag_get_reply():
    """
    Mock Rag.get_reply to avoid real LLM and ChromaDB calls.
    Returns a canned AI response.
    """
    with patch(
        "app.services.conversation.rag.Rag.get_reply",
        new_callable=AsyncMock,
    ) as mock:
        mock.return_value = "AI response"
        yield mock


async def _ai_response_stream() -> AsyncGenerator[str, None]:
    for token in ["AI", " ", "response"]:
        yield token


@pytest.fixture
def mock_rag_get_reply_stream():
    """
    Mock Rag.retrieve_context and Rag.stream_reply to avoid real LLM and
    ChromaDB calls. retrieve_context returns a canned context string;
    stream_reply yields tokens "AI", " ", "response".
    """
    with patch(
        "app.services.conversation.rag.Rag.retrieve_context",
        new_callable=AsyncMock,
    ) as mock_retrieve, patch(
        "app.services.conversation.rag.Rag.stream_reply",
        return_value=_ai_response_stream(),
    ) as mock_stream:
        mock_retrieve.return_value = "some context"
        yield mock_retrieve, mock_stream


@pytest.fixture
def find_title_update_call():
    def _find_title_update_call(mock_mongo):
        for call in mock_mongo.update_one.call_args_list:
            update_doc = call[0][1]
            if "title" in update_doc.get("$set", {}):
                return call
        return None

    return _find_title_update_call
