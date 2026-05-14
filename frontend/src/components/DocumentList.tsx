import type { DocumentMeta } from '../types'

interface Props {
  documents: DocumentMeta[]
  loading: boolean
  selectedIds: string[]
  onToggleSelect: (id: string) => void
  onDelete: (id: string) => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentList({ documents, loading, selectedIds, onToggleSelect, onDelete }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2 py-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-warm-200 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!documents.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
        <div className="h-10 w-10 rounded-2xl bg-warm-200 flex items-center justify-center">
          <svg className="h-5 w-5 text-warm-400" viewBox="0 0 24 24" fill="none">
            <path d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="text-xs text-warm-400">No documents yet</p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {documents.map((doc) => {
        const selected = selectedIds.includes(doc.document_id)
        const ext = doc.filename.split('.').pop()?.toUpperCase() ?? 'DOC'

        return (
          <li
            key={doc.document_id}
            onClick={() => onToggleSelect(doc.document_id)}
            className={`
              group flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 cursor-pointer
              transition-all duration-150
              ${selected
                ? 'bg-purple-100 ring-1 ring-purple-200'
                : 'hover:bg-warm-200/60'}
            `}
          >
            {/* File type badge */}
            <div className={`
              flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center
              text-[9px] font-bold tracking-wide
              ${selected ? 'bg-purple-600 text-white' : 'bg-warm-200 text-warm-500'}
            `}>
              {ext}
            </div>

            {/* Name + meta */}
            <div className="min-w-0 flex-1">
              <p className={`truncate text-[11px] font-semibold leading-tight
                ${selected ? 'text-purple-800' : 'text-warm-700'}`}
                title={doc.filename}>
                {doc.filename}
              </p>
              <p className="text-[10px] text-warm-400 mt-0.5">
                {doc.chunk_count} chunks · {formatBytes(doc.file_size_bytes)}
              </p>
            </div>

            {/* Delete */}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(doc.document_id) }}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 h-6 w-6 rounded-lg
                flex items-center justify-center text-warm-300 hover:text-red-400
                hover:bg-red-50 transition-all duration-150"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
