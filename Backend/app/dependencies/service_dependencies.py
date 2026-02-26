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
from ..repositories.implementations.mongo.settings_repo import SettingsMongoRepository
from ..services.auth.auth_service import AuthService
from ..services.conversation.conversation_service import ConversationService
from ..services.conversation.rag_service import RagService
from ..services.meeting.meeting_service import MeetingService
from ..services.settings.models_service import ModelsService
from ..services.settings.providers_service import ProvidersService
from ..services.settings.templates_service import TemplatesService
from ..services.transcription.implementations.whisperx.whisperx_transcription_service import (
    WhisperXTranscriptionService,
)

_logger = setup_logger(__name__)

_embeddings = OllamaEmbeddings(
    base_url=settings.ollama_url,
    model=settings.rag_embedding_model,
)
_chroma_client = chromadb.HttpClient(
    host=settings.chroma_host, port=settings.chroma_port
)


def _create_chroma_store() -> Chroma:
    return Chroma(
        client=_chroma_client,
        collection_name=settings.rag_collection_name,
        embedding_function=_embeddings,
    )


_chroma_store = _create_chroma_store()


def get_vector_store() -> Chroma:
    global _chroma_store
    try:
        _chroma_store._collection.count()
    except ChromaNotFoundError:
        _logger.warning("ChromaDB collection reference stale, reconnecting...")
        _chroma_store = _create_chroma_store()
    return _chroma_store


def get_auth_service() -> AuthService:
    return AuthService(AuthMongoRepository())


def get_rag_service() -> RagService:
    return RagService(SettingsMongoRepository(), get_vector_store())


def get_conversation_service() -> ConversationService:
    return ConversationService(ConversationMongoRepository(), get_rag_service())


def get_meeting_service() -> MeetingService:
    return MeetingService(
        MeetingMongoRepository(), get_transcription_service(), get_vector_store()
    )


def get_transcription_service() -> WhisperXTranscriptionService:
    return WhisperXTranscriptionService(SettingsMongoRepository())


def get_models_service() -> ModelsService:
    return ModelsService(SettingsMongoRepository())


def get_providers_service() -> ProvidersService:
    return ProvidersService(SettingsMongoRepository())


def get_templates_service() -> TemplatesService:
    return TemplatesService(SettingsMongoRepository())
