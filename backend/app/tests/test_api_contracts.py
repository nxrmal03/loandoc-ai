"""
API contract tests — exercise every endpoint's request/response shape
and error paths. These tests use the real Chroma client (in-memory via
the tmp dir fixture in conftest.py) but mock LLM calls so no API keys
are needed.
"""
import io
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient


class TestHealth:
    def test_health_ok(self, client: TestClient):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        body = resp.json()
        assert "status" in body
        assert "chroma_connected" in body


class TestDocumentUpload:
    def test_upload_pdf_success(self, client: TestClient, sample_pdf: bytes):
        resp = client.post(
            "/api/documents/upload",
            files={"file": ("test_loan.pdf", io.BytesIO(sample_pdf), "application/pdf")},
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["filename"] == "test_loan.pdf"
        assert body["chunk_count"] >= 1
        assert "document_id" in body
        assert body["status"] == "processed"

    def test_upload_invalid_extension(self, client: TestClient):
        resp = client.post(
            "/api/documents/upload",
            files={"file": ("notes.txt", io.BytesIO(b"hello"), "text/plain")},
        )
        assert resp.status_code == 400
        assert "Unsupported file type" in resp.json()["detail"]

    def test_upload_empty_file(self, client: TestClient):
        resp = client.post(
            "/api/documents/upload",
            files={"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")},
        )
        assert resp.status_code == 400

    def test_upload_too_large(self, client: TestClient):
        big = b"%PDF-1.4" + b"x" * (51 * 1024 * 1024)
        resp = client.post(
            "/api/documents/upload",
            files={"file": ("big.pdf", io.BytesIO(big), "application/pdf")},
        )
        assert resp.status_code == 413


class TestDocumentList:
    def test_list_returns_array(self, client: TestClient):
        resp = client.get("/api/documents")
        assert resp.status_code == 200
        body = resp.json()
        assert "documents" in body
        assert isinstance(body["documents"], list)
        assert "total" in body


class TestDocumentDelete:
    def test_delete_nonexistent(self, client: TestClient):
        resp = client.delete("/api/documents/nonexistent-id")
        assert resp.status_code == 404

    def test_upload_then_delete(self, client: TestClient, sample_pdf: bytes):
        upload = client.post(
            "/api/documents/upload",
            files={"file": ("delete_me.pdf", io.BytesIO(sample_pdf), "application/pdf")},
        )
        doc_id = upload.json()["document_id"]
        resp = client.delete(f"/api/documents/{doc_id}")
        assert resp.status_code == 204
        # Confirm it's gone from list
        listed = client.get("/api/documents").json()["documents"]
        ids = [d["document_id"] for d in listed]
        assert doc_id not in ids


class TestQuery:
    def test_query_bad_body(self, client: TestClient):
        resp = client.post("/api/query", json={})
        assert resp.status_code == 422  # Pydantic validation error

    def test_query_empty_string(self, client: TestClient):
        resp = client.post("/api/query", json={"query": ""})
        assert resp.status_code == 422

    def test_query_no_documents_returns_answer(self, client: TestClient):
        """With no indexed docs, RAG should return the 'I don't know' fallback."""
        mock_response = AsyncMock()
        mock_response.content = "I don't have enough information in the provided documents to answer that question."

        with patch(
            "app.services.rag_service.RAGService._generate",
            new_callable=AsyncMock,
            return_value=(mock_response.content, "claude-sonnet-4-5"),
        ):
            resp = client.post("/api/query", json={"query": "What is the interest rate?"})

        assert resp.status_code == 200
        body = resp.json()
        assert "answer" in body
        assert "sources" in body
        assert "conversation_id" in body
        assert isinstance(body["sources"], list)
