"""
Shared fixtures for integration tests.

Tests spin up a temporary Chroma DB and upload directory so they never
touch the real data. Each test session is isolated and cleaned up on teardown.
"""
import os
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session", autouse=True)
def isolated_env(tmp_path_factory):
    """Override storage paths with temp dirs for the entire test session."""
    tmp = tmp_path_factory.mktemp("loandoc_test")
    uploads = tmp / "uploads"
    chroma = tmp / "chroma_db"
    uploads.mkdir()
    chroma.mkdir()

    os.environ["CHROMA_DB_PATH"] = str(chroma)
    os.environ["UPLOAD_DIR"] = str(uploads)
    # Ensure dummy keys don't block imports (real calls won't happen in unit scope)
    os.environ.setdefault("ANTHROPIC_API_KEY", "test-key")
    os.environ.setdefault("OPENAI_API_KEY", "test-key")
    yield
    # tmp_path_factory cleans up automatically


@pytest.fixture(scope="session")
def client():
    # Import after env vars are set
    from main import app
    from app.core.dependencies import get_document_processor, get_rag_service
    get_document_processor.cache_clear()
    get_rag_service.cache_clear()
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def sample_pdf() -> bytes:
    """Minimal valid PDF with extractable text."""
    return (
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
