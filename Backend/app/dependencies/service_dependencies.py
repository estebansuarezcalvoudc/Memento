import threading
from functools import lru_cache

import chromadb
from chromadb.errors import NotFoundError as ChromaNotFoundError
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings

from ..core.logging import setup_logger
from ..core.settings import settings
from ..repositories.implementations.mongo.auth_mongo_repo import AuthMongoRepository
from ..repositories.implementations.mongo.conversation_mongo_repo import (
    ConversationMongoRepository,
)
from ..repositories.implementations.mongo.meeting_mongo_repo import (
    MeetingMongoRepository,
)
from ..repositories.implementations.mongo.settings_mongo_repo import (
    SettingsMongoRepository,
)
from ..services.auth.auth_service import AuthService
from ..services.conversation.conversation_service import ConversationService
from ..services.conversation.rag import Rag
from ..services.meeting.meeting_service import MeetingService
from ..services.settings.models_service import ModelsService
from ..services.settings.providers_service import ProvidersService
from ..services.settings.templates_service import TemplatesService
from ..services.settings.transcription_providers_service import (
    TranscriptionProvidersService,
)

_logger = setup_logger(__name__)

_embeddings = OllamaEmbeddings(
    base_url=settings.ollama_url,
    model=settings.rag_embedding_model,
)


def _get_chroma_client() -> chromadb.HttpClient:
    return chromadb.HttpClient(host=settings.chroma_host, port=settings.chroma_port)


def _create_chroma_store() -> Chroma:
    return Chroma(
        client=_get_chroma_client(),
        collection_name=settings.rag_collection_name,
        embedding_function=_embeddings,
    )


_chroma_store: Chroma | None = None
_chroma_store_lock = threading.Lock()


def get_vector_store() -> Chroma:
    global _chroma_store
    if _chroma_store is None:
        with _chroma_store_lock:
            if _chroma_store is None:
                _chroma_store = _create_chroma_store()
    try:
        _get_chroma_client().get_collection(settings.rag_collection_name)
    except ChromaNotFoundError:
        _logger.warning("ChromaDB collection reference stale, reconnecting...")
        with _chroma_store_lock:
            _chroma_store = _create_chroma_store()
    return _chroma_store


@lru_cache(maxsize=1)
def get_auth_service() -> AuthService:
    return AuthService(
        AuthMongoRepository(),
        MeetingMongoRepository(),
        ConversationMongoRepository(),
        SettingsMongoRepository(),
        get_vector_store(),
    )


@lru_cache(maxsize=1)
def get_rag_service() -> Rag:
    return Rag(SettingsMongoRepository(), get_vector_store())


@lru_cache(maxsize=1)
def get_conversation_service() -> ConversationService:
    return ConversationService(ConversationMongoRepository(), get_rag_service())


@lru_cache(maxsize=1)
def get_meeting_service() -> MeetingService:
    return MeetingService(
        MeetingMongoRepository(),
        SettingsMongoRepository(),
        get_transcription_providers_service(),
        get_vector_store(),
    )


@lru_cache(maxsize=1)
def get_transcription_providers_service() -> TranscriptionProvidersService:
    return TranscriptionProvidersService(SettingsMongoRepository())


@lru_cache(maxsize=1)
def get_models_service() -> ModelsService:
    return ModelsService(SettingsMongoRepository())


@lru_cache(maxsize=1)
def get_providers_service() -> ProvidersService:
    return ProvidersService(SettingsMongoRepository())


@lru_cache(maxsize=1)
def get_templates_service() -> TemplatesService:
    return TemplatesService(SettingsMongoRepository())


def clear_service_dependency_caches() -> None:
    get_auth_service.cache_clear()
    get_rag_service.cache_clear()
    get_conversation_service.cache_clear()
    get_meeting_service.cache_clear()
    get_transcription_providers_service.cache_clear()
    get_models_service.cache_clear()
    get_providers_service.cache_clear()
    get_templates_service.cache_clear()
