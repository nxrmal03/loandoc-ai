"""Shared FastAPI dependencies (singleton service instances)."""
from functools import lru_cache

from app.services.document_processor import DocumentProcessor
from app.services.rag_service import RAGService


@lru_cache(maxsize=1)
def get_document_processor() -> DocumentProcessor:
    return DocumentProcessor()


@lru_cache(maxsize=1)
def get_rag_service() -> RAGService:
    return RAGService()
