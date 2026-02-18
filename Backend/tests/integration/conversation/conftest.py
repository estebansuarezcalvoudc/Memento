from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.conversation.conversation_service import ConversationService
from app.utils.singleton_meta import SingletonMeta


@pytest.fixture(autouse=True)
def reset_conversation_service_singleton():
    """
    Reset ConversationService singleton before and after each test so every
    test gets a fresh instance initialized against the current mock infrastructure.
    """
    SingletonMeta._instances.pop(ConversationService, None)
    yield
    SingletonMeta._instances.pop(ConversationService, None)


@pytest.fixture
def mock_mcp_client():
    """
    Mock MCPClient to avoid real MCP server connections and AI model calls.
    Provides a pre-configured async send_message that returns a canned reply.
    """
    with patch("app.services.conversation.conversation_service.MCPClient") as mock_class:
        mock_instance = MagicMock()
        mock_instance.send_message = AsyncMock(return_value="AI response")
        mock_class.return_value = mock_instance
        yield mock_instance
