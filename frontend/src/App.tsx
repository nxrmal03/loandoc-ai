import { useCallback, useState } from 'react'
import { DocumentUploader } from './components/DocumentUploader'
import { DocumentList } from './components/DocumentList'
import { ChatInterface } from './components/ChatInterface'
import { Logo } from './components/Logo'
import { useDocuments } from './hooks/useDocuments'

export default function App() {
  const { documents, loading, upload, remove } = useDocuments()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }, [])

  const handleDelete = useCallback(
    async (id: string) => {
      await remove(id)
      setSelectedIds((prev) => prev.filter((x) => x !== id))
    },
    [remove],
  )

  return (
    <div className="flex h-screen overflow-hidden bg-warm-100">
      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className="flex w-72 flex-shrink-0 flex-col bg-sidebar-gradient border-r border-warm-200">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-warm-200">
          <Logo size={36} variant="wordmark" />
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-hidden p-4">
          {/* Upload zone */}
          <DocumentUploader onUpload={upload} />

          {/* Document list */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-warm-400">
                Documents
              </span>
              {selectedIds.length > 0 && (
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-600">
                  {selectedIds.length} selected
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto -mx-1 px-1">
              <DocumentList
                documents={documents}
                loading={loading}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onDelete={handleDelete}
              />
            </div>
          </div>

          {/* Scope hint */}
          <div className="rounded-xl bg-lavender-100 border border-purple-100 px-3 py-2.5">
            <p className="text-[11px] leading-relaxed text-purple-600">
              {selectedIds.length > 0
                ? `Searching ${selectedIds.length} selected document${selectedIds.length > 1 ? 's' : ''} only.`
                : 'All documents will be searched. Select to narrow scope.'}
            </p>
          </div>
        </div>
      </aside>

      {/* ── Chat panel ───────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-warm-200 bg-white/80 backdrop-blur-sm px-6 py-3.5">
          <div>
            <h2 className="text-sm font-semibold text-warm-800">Document Q&amp;A</h2>
            <p className="text-xs text-warm-400">
              {selectedIds.length > 0
                ? `Searching ${selectedIds.length} document${selectedIds.length > 1 ? 's' : ''}`
                : 'Searching all documents'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
            <span className="text-xs text-warm-400 font-medium">Connected</span>
          </div>
        </header>

        <ChatInterface selectedDocumentIds={selectedIds} />
      </main>
    </div>
  )
}
