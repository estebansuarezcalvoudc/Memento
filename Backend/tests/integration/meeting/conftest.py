from unittest.mock import MagicMock, patch

import pytest

from app.services.meeting.meeting_service import MeetingService
from app.utils.singleton_meta import SingletonMeta


@pytest.fixture(autouse=True)
def reset_meeting_service_singleton():
    """
    Reset MeetingService singleton before and after each test so every test
    gets a fresh instance initialized against the current mock infrastructure.
    """
    SingletonMeta._instances.pop(MeetingService, None)
    yield
    SingletonMeta._instances.pop(MeetingService, None)


@pytest.fixture
def mock_vector_store():
    """
    Mock the vector store to avoid real ChromaDB connections during tests.
    Covers document indexing and deletion.
    """
    with patch("app.dependencies.service_dependencies.get_vector_store") as mock:
        mock_store = MagicMock()
        mock.return_value = mock_store
        yield mock_store
