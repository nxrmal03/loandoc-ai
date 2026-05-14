from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ── Document schemas ───────────────────────────────────────────────────────────

class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    chunk_count: int
    status: str = "processed"
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)


class DocumentMeta(BaseModel):
    document_id: str
    filename: str
    file_size_bytes: int
    chunk_count: int
    uploaded_at: datetime
    content_type: str


class DocumentListResponse(BaseModel):
    documents: list[DocumentMeta]
    total: int


# ── Query schemas ──────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    document_ids: Optional[list[str]] = None  # None = search all docs
    conversation_id: Optional[str] = None


class SourceChunk(BaseModel):
    document_id: str
    filename: str
    chunk_id: str
    page_num: Optional[int] = None
    text_preview: str  # first 300 chars of chunk
    relevance_score: float


class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]
    conversation_id: str
    model_used: str


# ── Health schema ──────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    chroma_connected: bool
    version: str = "0.1.0"
