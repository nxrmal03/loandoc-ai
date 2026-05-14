import type {
  DocumentMeta,
  QueryResponse,
  UploadResponse,
} from '../types'

const BASE = '/api'

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(body.detail ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  uploadDocument(file: File): Promise<UploadResponse> {
    const form = new FormData()
    form.append('file', file)
    return request('/documents/upload', { method: 'POST', body: form })
  },

  listDocuments(): Promise<{ documents: DocumentMeta[]; total: number }> {
    return request('/documents')
  },

  deleteDocument(documentId: string): Promise<void> {
    return request(`/documents/${documentId}`, { method: 'DELETE' })
  },

  query(payload: {
    query: string
    document_ids?: string[]
    conversation_id?: string
  }): Promise<QueryResponse> {
    return request('/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  },

  health(): Promise<{ status: string; chroma_connected: boolean }> {
    return request('/health')
  },
}
