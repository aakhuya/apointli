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
  const textColor = variant === 'light' ? 'text-white' : 'text-[#0f172a]'
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
        {/* Background - Deep Navy */}
        <rect width="48" height="48" rx="14" fill="#1e3a8a" />
        
        {/* Lowercase 'a' shape */}
        <path
          d="M24 34C19.5 34 16 30.5 16 26C16 21.5 19.5 18 24 18C28.5 18 32 21.5 32 26V34"
          stroke="white"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Opening below - appointment slot */}
        <path
          d="M24 34L24 38"
          stroke="#c7d2fe"
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* Appointment indicator - small checkmark */}
        <path
          d="M20 26L23 29L30 22"
          stroke="#c7d2fe"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Small scheduling dot */}
        <circle cx="34" cy="12" r="3" fill="#c7d2fe" />
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

// Icon only version
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
      <rect width="48" height="48" rx="14" fill="#1e3a8a" />
      
      <path
        d="M24 34C19.5 34 16 30.5 16 26C16 21.5 19.5 18 24 18C28.5 18 32 21.5 32 26V34"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      <path
        d="M24 34L24 38"
        stroke="#c7d2fe"
        strokeWidth="4"
        strokeLinecap="round"
      />
      
      <path
        d="M20 26L23 29L30 22"
        stroke="#c7d2fe"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      <circle cx="34" cy="12" r="3" fill="#c7d2fe" />
    </svg>
  )
}
