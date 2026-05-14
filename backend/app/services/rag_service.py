"""
RAG retrieval & generation pipeline:
  1. Embed user query via Google Generative AI
  2. Similarity search in Chroma (top-k chunks, optionally filtered by doc IDs)
  3. Build prompt with retrieved context
  4. Call Gemini (primary), fall back to smaller Gemini model on error
  5. Return answer + source citations
"""
import logging
import uuid
from typing import Optional

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_chroma import Chroma
from langchain_core.messages import HumanMessage, SystemMessage

from app.core.config import settings
from app.models.schemas import QueryResponse, SourceChunk

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are LoanDoc AI, a precise document assistant for loan-related documents.

Rules you MUST follow:
1. Answer ONLY based on the context passages provided below. Do not use outside knowledge.
2. Do NOT include any inline citations, source references, or chunk IDs in your answer.
3. If the context does not contain enough information to answer, respond with:
   "I don't have enough information in the provided documents to answer that question."
4. Be concise and factual. Avoid speculation or assumptions.
5. If information comes from multiple passages, synthesize it naturally without referencing the sources.

Context passages:
{context}
"""


class RAGService:
    def __init__(self) -> None:
        from app.core.dependencies import get_document_processor

        self._vectorstore: Chroma = get_document_processor().get_vectorstore()

        self._primary_llm = ChatGoogleGenerativeAI(
            model=settings.primary_llm,
            google_api_key=settings.google_api_key,
            max_output_tokens=2048,
        )
        self._fallback_llm = ChatGoogleGenerativeAI(
            model=settings.fallback_llm,
            google_api_key=settings.google_api_key,
            max_output_tokens=2048,
        )

    # ── Public API ─────────────────────────────────────────────────────────────

    async def query(
        self,
        query: str,
        document_ids: Optional[list[str]] = None,
        conversation_id: Optional[str] = None,
    ) -> QueryResponse:
        if not conversation_id:
            conversation_id = str(uuid.uuid4())

        chunks = self._retrieve(query, document_ids)
        if not chunks:
            return QueryResponse(
                answer="I don't have enough information in the provided documents to answer that question.",
                sources=[],
                conversation_id=conversation_id,
                model_used=settings.primary_llm,
            )

        context_text, sources = self._build_context(chunks)
        answer, model_used = await self._generate(query, context_text)

        return QueryResponse(
            answer=answer,
            sources=sources,
            conversation_id=conversation_id,
            model_used=model_used,
        )

    def is_healthy(self) -> bool:
        try:
            self._vectorstore.get(limit=1)
            return True
        except Exception:
            return False

    # ── Retrieval ──────────────────────────────────────────────────────────────

    def _retrieve(
        self, query: str, document_ids: Optional[list[str]]
    ) -> list[tuple]:
        search_kwargs: dict = {"k": settings.retrieval_top_k}
        if document_ids:
            if len(document_ids) == 1:
                search_kwargs["filter"] = {"document_id": document_ids[0]}
            else:
                search_kwargs["filter"] = {"document_id": {"$in": document_ids}}

        results = self._vectorstore.similarity_search_with_relevance_scores(
            query, **search_kwargs
        )
        return [(doc, score) for doc, score in results if score >= 0.3]

    # ── Context building ───────────────────────────────────────────────────────

    def _build_context(
        self, chunks: list[tuple]
    ) -> tuple[str, list[SourceChunk]]:
        context_parts: list[str] = []
        sources: list[SourceChunk] = []

        for doc, score in chunks:
            meta = doc.metadata
            filename = meta.get("filename", "unknown")
            chunk_id = meta.get("chunk_id", "?")
            page_num = meta.get("page_num")
            text = doc.page_content

            context_parts.append(
                f"[Source: {filename}, chunk {chunk_id}]\n{text}"
            )
            sources.append(
                SourceChunk(
                    document_id=meta.get("document_id", ""),
                    filename=filename,
                    chunk_id=chunk_id,
                    page_num=page_num,
                    text_preview=text[:300],
                    relevance_score=round(score, 4),
                )
            )

        context_text = "\n\n---\n\n".join(context_parts)
        if len(context_text) > 12_000:
            context_text = context_text[:12_000] + "\n[...context truncated...]"

        return context_text, sources

    # ── Generation ─────────────────────────────────────────────────────────────

    async def _generate(self, query: str, context: str) -> tuple[str, str]:
        messages = [
            SystemMessage(content=SYSTEM_PROMPT.format(context=context)),
            HumanMessage(content=query),
        ]
        try:
            response = await self._primary_llm.ainvoke(messages)
            return response.content, settings.primary_llm
        except Exception as exc:
            logger.warning("Primary LLM (%s) failed: %s — trying fallback.", settings.primary_llm, exc)

        try:
            response = await self._fallback_llm.ainvoke(messages)
            return response.content, settings.fallback_llm
        except Exception as exc:
            logger.error("Fallback LLM also failed: %s", exc)
            raise RuntimeError("All LLM backends failed. Check your GOOGLE_API_KEY.") from exc
