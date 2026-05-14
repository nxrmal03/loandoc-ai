# LoanDoc AI

A production-grade RAG document Q&A system for loan documents.  
Upload PDFs and DOCX files, then ask natural-language questions and get cited answers powered by Claude + Chroma.

---

## Architecture

```
frontend/   React + TypeScript + Vite + Tailwind CSS
backend/    FastAPI + LangChain + Chroma (local) + Anthropic / OpenAI
```

**RAG pipeline:**
1. Upload → extract text (pypdf / python-docx)
2. Chunk with `RecursiveCharacterTextSplitter` (1 000 chars, 200 overlap)
3. Embed with OpenAI `text-embedding-3-small`
4. Store in local Chroma vector DB (`backend/chroma_db/`)
5. At query time: embed query → retrieve top-5 chunks → Claude Sonnet answers with citations

---

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.11+ |
| Node.js | 18+ |
| npm | 9+ |

---

## Quick Start

### 1. Clone and configure environment

```bash
# Copy env template
cp .env.example backend/.env
```

Open `backend/.env` and fill in your API keys:

```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

All other settings have sensible defaults.

---

### 2. Backend setup

```powershell
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1       # Windows PowerShell
# source venv/bin/activate         # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Start the server (hot-reload enabled)
uvicorn main:app --reload --port 8000
```

The backend starts at **http://localhost:8000**  
Interactive API docs: **http://localhost:8000/docs**

---

### 3. Frontend setup

```powershell
cd frontend

npm install
npm run dev
```

The frontend starts at **http://localhost:5173**

---

## Environment Variables

All variables live in `backend/.env` (copy from `.env.example`).

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | *(required)* | Anthropic API key |
| `OPENAI_API_KEY` | *(required)* | OpenAI API key (embeddings + fallback LLM) |
| `CHROMA_DB_PATH` | `./chroma_db` | Where Chroma persists its vector data |
| `UPLOAD_DIR` | `./data/uploads` | Where raw uploaded files are saved |
| `CHUNK_SIZE` | `1000` | Characters per chunk |
| `CHUNK_OVERLAP` | `200` | Overlap between consecutive chunks |
| `RETRIEVAL_TOP_K` | `5` | Number of chunks retrieved per query |
| `PRIMARY_LLM` | `claude-sonnet-4-5` | Anthropic model used for generation |
| `FALLBACK_LLM` | `gpt-4o` | OpenAI model used if Claude fails |
| `EMBEDDING_MODEL` | `text-embedding-3-small` | OpenAI embedding model |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed frontend origin(s) |

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/documents/upload` | Upload a PDF or DOCX |
| `GET` | `/api/documents` | List all indexed documents |
| `DELETE` | `/api/documents/{id}` | Remove document and its vectors |
| `POST` | `/api/query` | Ask a question (RAG) |
| `GET` | `/api/health` | Health check |

### Upload a document

```bash
curl -X POST http://localhost:8000/api/documents/upload \
  -F "file=@my_loan.pdf"
```

### Ask a question

```bash
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the interest rate on this loan?"}'
```

Optional body fields:
- `document_ids` — list of IDs to restrict search scope
- `conversation_id` — pass back a prior ID to group messages

---

## Running Tests

```powershell
cd backend

# Activate venv first (see above)
pytest -v
```

Tests run against a temporary Chroma DB (no real data touched).  
LLM calls are mocked — no API keys are consumed during tests.

```
app/tests/
├── conftest.py               # shared fixtures + isolated storage
├── test_api_contracts.py     # endpoint schemas and error cases
└── test_rag_pipeline.py      # upload → chunk → query → delete flow
```

---

## Project Structure

```
loandoc-ai/
├── backend/
│   ├── app/
│   │   ├── api/routes.py           # FastAPI route handlers
│   │   ├── core/
│   │   │   ├── config.py           # pydantic-settings config
│   │   │   └── dependencies.py     # singleton service injection
│   │   ├── models/schemas.py       # Pydantic request/response models
│   │   ├── services/
│   │   │   ├── document_processor.py  # ingest pipeline
│   │   │   └── rag_service.py         # retrieval + generation
│   │   └── tests/
│   │       ├── conftest.py
│   │       ├── test_api_contracts.py
│   │       └── test_rag_pipeline.py
│   ├── data/uploads/           # raw uploaded files (gitignored)
│   ├── chroma_db/              # Chroma vector store (gitignored)
│   ├── main.py                 # FastAPI app + CORS
│   ├── pytest.ini
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ChatInterface.tsx
    │   │   ├── DocumentList.tsx
    │   │   ├── DocumentUploader.tsx
    │   │   └── SourceCitation.tsx
    │   ├── hooks/useDocuments.ts
    │   ├── services/api.ts
    │   ├── types/index.ts
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    └── vite.config.ts          # proxies /api → localhost:8000
```

---

## Design Decisions

**Chunk size (1 000 chars / 200 overlap):** Balances retrieval precision vs. context richness. Smaller chunks improve precision; larger chunks preserve more context. Tune via `CHUNK_SIZE` / `CHUNK_OVERLAP` env vars.

**Relevance threshold (0.3):** Chunks scoring below 30% cosine similarity are discarded before generation to reduce hallucination risk. Adjust in `rag_service.py`.

**Context cap (12 000 chars):** Hard limit before sending to Claude to stay comfortably inside token budgets. Increase if using models with larger context windows.

**Model fallback:** If Claude fails (rate limit, outage), the system transparently retries with GPT-4o and records `model_used` in the response so you can track it.

**No Docker:** Everything runs in-process. Chroma uses its embedded SQLite mode — no external service needed.
