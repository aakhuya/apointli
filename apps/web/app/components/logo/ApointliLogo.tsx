import React from 'react'

interface ApointliLogoProps {
  size?: number
  showWordmark?: boolean
  className?: string
  variant?: 'light' | 'dark'
}

export function ApointliLogo({
  size = 40,
  showWordmark = true,
  className = '',
  variant = 'dark',
}: ApointliLogoProps) {
  const textColor = variant === 'light' ? 'text-white' : 'text-[#0a1628]'
  const taglineColor = variant === 'light' ? 'text-blue-100' : 'text-gray-400'
  
  return (
    <div
      className={`flex items-center gap-3 ${className}`}
      aria-label="Apointli"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        role="img"
      >
        {/* Background - Dark Navy */}
        <rect width="48" height="48" rx="14" fill="#0a1628" />
        
        {/* Lowercase 'a' with opening below - appointment mark */}
        <path
          d="M24 34C19.5 34 16 30.5 16 26C16 21.5 19.5 18 24 18C28.5 18 32 21.5 32 26V34"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Opening below - appointment slot */}
        <path
          d="M24 34L24 38"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        
        {/* Small connection dot */}
        <circle cx="30" cy="20" r="2.5" fill="white" opacity="0.5" />
      </svg>

      {showWordmark && (
        <div>
          <span className={`text-xl font-bold tracking-tight ${textColor}`}>
            apointli
          </span>
          <div className={`text-[10px] font-medium tracking-wider ${taglineColor}`}>
            Book. Manage. Grow.
          </div>
        </div>
      )}
    </div>
  )
}

// Icon only version for favicon and mobile
export function ApointliIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      role="img"
    >
      <rect width="48" height="48" rx="14" fill="#0a1628" />
      
      <path
        d="M24 34C19.5 34 16 30.5 16 26C16 21.5 19.5 18 24 18C28.5 18 32 21.5 32 26V34"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      <path
        d="M24 34L24 38"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      
      <circle cx="30" cy="20" r="2.5" fill="white" opacity="0.5" />
    </svg>
  )
}
