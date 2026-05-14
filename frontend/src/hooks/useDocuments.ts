import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api'
import type { DocumentMeta } from '../types'

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentMeta[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { documents: docs } = await api.listDocuments()
      setDocuments(docs)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const upload = useCallback(
    async (file: File): Promise<void> => {
      const result = await api.uploadDocument(file)
      setDocuments((prev) => [
        ...prev,
        {
          document_id: result.document_id,
          filename: result.filename,
          chunk_count: result.chunk_count,
          file_size_bytes: file.size,
          uploaded_at: result.uploaded_at,
          content_type: file.type,
        },
      ])
    },
    [],
  )

  const remove = useCallback(async (documentId: string): Promise<void> => {
    await api.deleteDocument(documentId)
    setDocuments((prev) => prev.filter((d) => d.document_id !== documentId))
  }, [])

  return { documents, loading, error, refresh, upload, remove }
}
