import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface Props {
  onUpload: (file: File) => Promise<void>
}

type State = 'idle' | 'uploading' | 'success' | 'error'

export function DocumentUploader({ onUpload }: Props) {
  const [state, setState] = useState<State>('idle')
  const [message, setMessage] = useState('')

  const handleDrop = useCallback(
    async (accepted: File[]) => {
      if (!accepted.length) return
      setState('uploading')
      setMessage(accepted[0].name)
      try {
        await onUpload(accepted[0])
        setState('success')
        setMessage('Processed successfully')
        setTimeout(() => setState('idle'), 3000)
      } catch (e) {
        setState('error')
        setMessage((e as Error).message)
        setTimeout(() => setState('idle'), 5000)
      }
    },
    [onUpload],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled: state === 'uploading',
  })

  return (
    <div
      {...getRootProps()}
      className={`
        relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed
        px-4 py-5 cursor-pointer transition-all duration-200
        ${isDragActive
          ? 'border-purple-500 bg-purple-50 scale-[1.02]'
          : state === 'success'
          ? 'border-emerald-400 bg-emerald-50'
          : state === 'error'
          ? 'border-red-400 bg-red-50'
          : state === 'uploading'
          ? 'border-purple-300 bg-lavender-100'
          : 'border-warm-300 bg-white hover:border-purple-400 hover:bg-lavender-50'}
      `}
    >
      <input {...getInputProps()} />

      {/* Icon */}
      <div className={`
        h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200
        ${state === 'success' ? 'bg-emerald-100'
          : state === 'error' ? 'bg-red-100'
          : state === 'uploading' ? 'bg-purple-100'
          : isDragActive ? 'bg-purple-100'
          : 'bg-warm-100'}
      `}>
        {state === 'uploading' ? (
          <svg className="h-4 w-4 text-purple-500 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        ) : state === 'success' ? (
          <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : state === 'error' ? (
          <svg className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="none">
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg className={`h-4 w-4 ${isDragActive ? 'text-purple-500' : 'text-warm-400'}`} viewBox="0 0 24 24" fill="none">
            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      {/* Text */}
      <div className="text-center">
        {state === 'idle' ? (
          <>
            <p className={`text-xs font-medium ${isDragActive ? 'text-purple-600' : 'text-warm-600'}`}>
              {isDragActive ? 'Drop to upload' : 'Upload document'}
            </p>
            <p className="text-[10px] text-warm-400 mt-0.5">PDF or DOCX · Max 50 MB</p>
          </>
        ) : (
          <>
            <p className={`text-xs font-medium truncate max-w-[160px]
              ${state === 'success' ? 'text-emerald-600'
                : state === 'error' ? 'text-red-600'
                : 'text-purple-600'}`}>
              {state === 'uploading' ? 'Processing…' : message}
            </p>
            {state === 'uploading' && (
              <p className="text-[10px] text-warm-400 mt-0.5 truncate max-w-[160px]">{message}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
