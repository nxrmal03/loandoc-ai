export interface DocumentMeta {
  document_id: string
  filename: string
  file_size_bytes: number
  chunk_count: number
  uploaded_at: string
  content_type: string
}

export interface SourceChunk {
  document_id: string
  filename: string
  chunk_id: string
  page_num: number | null
  text_preview: string
  relevance_score: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: SourceChunk[]
  model_used?: string
  timestamp: Date
}

export interface QueryResponse {
  answer: string
  sources: SourceChunk[]
  conversation_id: string
  model_used: string
}

export interface UploadResponse {
  document_id: string
  filename: string
  chunk_count: number
  status: string
  uploaded_at: string
}
