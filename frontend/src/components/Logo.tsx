interface Props {
  size?: number
  variant?: 'icon' | 'full' | 'wordmark'
  className?: string
}

/** LoanDoc AI brand mark — purple document with a spark */
export function Logo({ size = 32, variant = 'icon', className = '' }: Props) {
  const icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6B4CE6" />
          <stop offset="100%" stopColor="#8B7FE8" />
        </linearGradient>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E8E4FF" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>

      {/* Card / document body */}
      <rect x="4" y="3" width="26" height="32" rx="5" fill="url(#logoGrad)" />

      {/* Page fold corner */}
      <path d="M24 3 L30 9 L24 9 Z" fill="#4A2BAD" opacity="0.5" />
      <path d="M24 3 L30 9 H24 Z" fill="#5A3ACC" />

      {/* Document lines */}
      <rect x="9" y="15" width="16" height="2" rx="1" fill="url(#sparkGrad)" opacity="0.9" />
      <rect x="9" y="20" width="12" height="2" rx="1" fill="url(#sparkGrad)" opacity="0.7" />
      <rect x="9" y="25" width="14" height="2" rx="1" fill="url(#sparkGrad)" opacity="0.5" />

      {/* Spark / AI orb — bottom right */}
      <circle cx="30" cy="30" r="9" fill="#1A1814" />
      <circle cx="30" cy="30" r="8.5" fill="url(#logoGrad)" />

      {/* Spark lightning */}
      <path
        d="M31.5 23.5 L28.5 29.5 H31 L28.5 36.5 L34 28.5 H31 L33.5 23.5 Z"
        fill="white"
        opacity="0.95"
      />
    </svg>
  )

  if (variant === 'icon') return icon

  if (variant === 'wordmark') {
    return (
      <div className="flex items-center gap-2.5">
        {icon}
        <div className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-tight text-warm-900">LoanDoc</span>
          <span className="text-base font-bold tracking-tight text-purple-600">AI</span>
        </div>
      </div>
    )
  }

  // full = icon + stacked name
  return (
    <div className="flex flex-col items-center gap-2">
      {icon}
      <span className="text-sm font-bold tracking-tight text-warm-800">
        LoanDoc <span className="text-purple-600">AI</span>
      </span>
    </div>
  )
}
