import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status

from app.core.dependencies import get_document_processor, get_rag_service
from app.models.schemas import (
    DocumentListResponse,
    DocumentUploadResponse,
    HealthResponse,
    QueryRequest,
    QueryResponse,
)
from app.services.document_processor import DocumentProcessor
from app.services.rag_service import RAGService

logger = logging.getLogger(__name__)
router = APIRouter()

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
ALLOWED_EXTENSIONS = {".pdf", ".docx"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


# ── Documents ──────────────────────────────────────────────────────────────────

@router.post(
    "/documents/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    file: Annotated[UploadFile, File(description="PDF or DOCX document")],
    processor: Annotated[DocumentProcessor, Depends(get_document_processor)],
) -> DocumentUploadResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required.")

    from pathlib import Path
    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{suffix}'. Upload a PDF or DOCX.",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({len(content) // 1024} KB). Max 50 MB.",
        )
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        result = await processor.process_upload(
            filename=file.filename,
            content=content,
            content_type=file.content_type or "application/octet-stream",
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Document processing error: %s", exc)
        raise HTTPException(status_code=500, detail="Document processing failed.") from exc

    return DocumentUploadResponse(**result)


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(
    processor: Annotated[DocumentProcessor, Depends(get_document_processor)],
) -> DocumentListResponse:
    docs = processor.list_documents()
    return DocumentListResponse(documents=docs, total=len(docs))


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    processor: Annotated[DocumentProcessor, Depends(get_document_processor)],
) -> None:
    deleted = processor.delete_document(document_id)
    if not deleted:
        raise HTTPException(
            status_code=404, detail=f"Document '{document_id}' not found."
        )


# ── Query ──────────────────────────────────────────────────────────────────────

@router.post("/query", response_model=QueryResponse)
async def query_documents(
    body: QueryRequest,
    rag: Annotated[RAGService, Depends(get_rag_service)],
) -> QueryResponse:
    try:
        return await rag.query(
            query=body.query,
            document_ids=body.document_ids,
            conversation_id=body.conversation_id,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("RAG query error: %s", exc)
        raise HTTPException(status_code=500, detail="Query processing failed.") from exc


# ── Health ─────────────────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse)
async def health_check(
    rag: Annotated[RAGService, Depends(get_rag_service)],
) -> HealthResponse:
    chroma_ok = rag.is_healthy()
    return HealthResponse(
        status="ok" if chroma_ok else "degraded",
        chroma_connected=chroma_ok,
    )
