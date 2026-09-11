import localFont from 'next/font/local'

const jakarta = localFont({
  src: [
    {
      path: '../../fonts/PlusJakartaSans-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../fonts/PlusJakartaSans-ExtraBold.woff2',
      weight: '800',
      style: 'normal',
    },
  ],
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
})

interface ApointliLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'dark' | 'light'
  showDot?: boolean
  className?: string
}

const sizeMap = {
  sm: 'text-2xl',
  md: 'text-3xl',
  lg: 'text-4xl',
  xl: 'text-6xl',
}

export function ApointliLogo({
  size = 'md',
  variant = 'dark',
  showDot = true,
  className = '',
}: ApointliLogoProps) {
  const colorClass = variant === 'light' ? 'text-white' : 'text-[#0a1628]'
  const dotColor = variant === 'light' ? 'bg-blue-300' : 'bg-[#2a44e8]'

  return (
    <span
      className={`inline-flex items-baseline ${jakarta.className} ${sizeMap[size]} font-extrabold tracking-[-0.04em] ${colorClass} ${className}`}
      aria-label="apointli"
    >
      apointli
      {showDot && (
        <span
          className={`inline-block w-[0.18em] h-[0.18em] ml-[0.08em] rounded-full ${dotColor}`}
          aria-hidden="true"
        />
      )}
    </span>
  )
}

export function ApointliMark({ size = 'md', variant = 'dark', className = '' }: Omit<ApointliLogoProps, 'showDot'>) {
  return <ApointliLogo size={size} variant={variant} showDot={false} className={className} />
}
