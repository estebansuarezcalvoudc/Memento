from unittest.mock import MagicMock, patch

import pytest


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
