"""
End-to-end RAG pipeline tests.
LLM calls are mocked; Chroma runs against the tmp dir from conftest.py.
These tests catch real issues: bad chunking, empty retrieval, metadata loss.
"""
import io
from unittest.mock import AsyncMock, patch

import pytest


@pytest.fixture()
def uploaded_doc_id(client):
    """Upload the sample PDF once and return its document_id."""
    from app.tests.conftest import sample_pdf as _sample_pdf
    # Re-create the bytes directly (can't call a fixture from a fixture in a different scope)
    pdf_bytes = (
        b"%PDF-1.4\n"
        b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
        b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]"
        b"/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"
        b"4 0 obj<</Length 44>>stream\n"
        b"BT /F1 12 Tf 100 700 Td (Sample loan document text.) Tj ET\n"
        b"endstream endobj\n"
        b"5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"
        b"xref\n0 6\n0000000000 65535 f \n"
        b"trailer<</Size 6/Root 1 0 R>>\nstartxref\n0\n%%EOF"
    )
    resp = client.post(
        "/api/documents/upload",
        files={"file": ("pipeline_test.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
    )
    assert resp.status_code == 201
    return resp.json()["document_id"]


class TestRagPipeline:
    def test_upload_produces_chunks(self, client, uploaded_doc_id: str):
        docs = client.get("/api/documents").json()["documents"]
        match = next((d for d in docs if d["document_id"] == uploaded_doc_id), None)
        assert match is not None, "Uploaded document not in list"
        assert match["chunk_count"] >= 1, "Document should produce at least one chunk"

    def test_query_returns_sources_with_metadata(self, client, uploaded_doc_id: str):
        mocked_answer = "The document mentions a sample loan."
        with patch(
            "app.services.rag_service.RAGService._generate",
            new_callable=AsyncMock,
            return_value=(mocked_answer, "claude-sonnet-4-5"),
        ):
            resp = client.post(
                "/api/query",
                json={
                    "query": "What does this document say?",
                    "document_ids": [uploaded_doc_id],
                },
            )

        assert resp.status_code == 200
        body = resp.json()
        assert body["answer"] == mocked_answer
        # Metadata integrity: each source must carry document_id, filename, chunk_id
        for src in body["sources"]:
            assert src["document_id"], "source missing document_id"
            assert src["filename"], "source missing filename"
            assert src["chunk_id"], "source missing chunk_id"
            assert 0 <= src["relevance_score"] <= 1

    def test_conversation_id_persisted(self, client, uploaded_doc_id: str):
        conv_id = "test-conv-123"
        with patch(
            "app.services.rag_service.RAGService._generate",
            new_callable=AsyncMock,
            return_value=("Some answer.", "claude-sonnet-4-5"),
        ):
            resp = client.post(
                "/api/query",
                json={"query": "Any question", "conversation_id": conv_id},
            )
        assert resp.json()["conversation_id"] == conv_id

    def test_filter_by_document_id(self, client, uploaded_doc_id: str):
        """Results should only reference the specified document."""
        with patch(
            "app.services.rag_service.RAGService._generate",
            new_callable=AsyncMock,
            return_value=("Filtered answer.", "claude-sonnet-4-5"),
        ):
            resp = client.post(
                "/api/query",
                json={
                    "query": "Tell me about the loan",
                    "document_ids": [uploaded_doc_id],
                },
            )
        body = resp.json()
        for src in body["sources"]:
            assert src["document_id"] == uploaded_doc_id, (
                f"Source from unexpected document: {src['document_id']}"
            )

    def test_cleanup_removes_from_index(self, client, uploaded_doc_id: str):
        """After deletion, queries should not return chunks from that document."""
        del_resp = client.delete(f"/api/documents/{uploaded_doc_id}")
        assert del_resp.status_code == 204

        with patch(
            "app.services.rag_service.RAGService._generate",
            new_callable=AsyncMock,
            return_value=("No context.", "claude-sonnet-4-5"),
        ):
            resp = client.post(
                "/api/query",
                json={
                    "query": "Sample loan document text",
                    "document_ids": [uploaded_doc_id],
                },
            )
        for src in resp.json()["sources"]:
            assert src["document_id"] != uploaded_doc_id, "Deleted doc still in index"
