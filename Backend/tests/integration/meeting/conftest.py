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
def mock_elasticsearch():
    """
    Mock Elasticsearch to avoid real connections during tests.
    Covers index initialization, document indexing, updates and deletes.
    """
    with patch("app.repositories.meeting_repo.Elasticsearch") as mock_es_class:
        mock_es = MagicMock()
        mock_es_class.return_value = mock_es
        mock_es.indices.exists.return_value = False
        yield mock_es
