import { useState } from 'react'
import type { SourceChunk } from '../types'

interface Props {
  sources: SourceChunk[]
}

export function SourceCitation({ sources }: Props) {
  const [open, setOpen] = useState(false)

  if (!sources.length) return null

  return (
    <div className="mt-2 rounded-xl overflow-hidden border border-purple-100 bg-lavender-50 text-xs">
      <button
        className="flex w-full items-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 transition-colors duration-150"
        onClick={() => setOpen((o) => !o)}
      >
        {/* Book icon */}
        <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="font-semibold text-purple-700">
          {sources.length} source{sources.length > 1 ? 's' : ''}
        </span>
        <svg
          className={`ml-auto h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none"
        >
          <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="border-t border-purple-100 divide-y divide-purple-100">
          {sources.map((src, i) => (
            <div key={src.chunk_id} className="px-3 py-2.5 bg-white/60">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="flex-shrink-0 h-4 w-4 rounded bg-purple-100 text-purple-600
                    flex items-center justify-center text-[9px] font-bold">
                    {i + 1}
                  </span>
                  <span className="font-semibold text-warm-700 truncate text-[11px]" title={src.filename}>
                    {src.filename}
                    {src.page_num != null && (
                      <span className="ml-1 font-normal text-warm-400">p.{src.page_num}</span>
                    )}
                  </span>
                </div>
                <span className="flex-shrink-0 rounded-full bg-purple-gradient px-2 py-0.5
                  text-[10px] font-semibold text-white shadow-soft">
                  {(src.relevance_score * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-warm-500 line-clamp-2 leading-relaxed text-[11px]">
                {src.text_preview}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
