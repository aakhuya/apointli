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
  const iconColor = variant === 'light' ? '#ffffff' : '#2a44e8'
  
  return (
    <div
      className={`flex items-center gap-3 ${className}`}
      aria-label="Apointli"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        role="img"
      >
        {/*
          Lowercase 'a' shape with location pin cut out of the center (negative space).
          Everything below is a single filled path — the pin is created by drawing
          the 'a' and the pin as one path using the evenodd fill rule.
        */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="
            M 50 12
            C 27 12 10 30 10 52
            C 10 62 13 71 19 78
            C 24 84 34 90 50 90
            C 62 90 74 86 82 78
            C 86 74 90 66 90 56
            L 90 40
            C 90 36 87 33 83 33
            C 79 33 76 36 76 40
            L 76 52
            C 76 68 66 78 50 78
            C 35 78 24 68 24 52
            C 24 36 35 26 50 26
            C 58 26 65 29 70 35
            L 82 30
            C 75 19 63 12 50 12
            Z
            M 50 32
            C 42 32 36 38 36 46
            C 36 52 40 56 44 60
            L 50 66
            L 56 60
            C 60 56 64 52 64 46
            C 64 38 58 32 50 32
            Z
            M 50 42
            C 53 42 56 45 56 48
            C 56 51 53 54 50 54
            C 47 54 44 51 44 48
            C 44 45 47 42 50 42
            Z
          "
          fill={iconColor}
        />
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
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      role="img"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="
          M 50 12
          C 27 12 10 30 10 52
          C 10 62 13 71 19 78
          C 24 84 34 90 50 90
          C 62 90 74 86 82 78
          C 86 74 90 66 90 56
          L 90 40
          C 90 36 87 33 83 33
          C 79 33 76 36 76 40
          L 76 52
          C 76 68 66 78 50 78
          C 35 78 24 68 24 52
          C 24 36 35 26 50 26
          C 58 26 65 29 70 35
          L 82 30
          C 75 19 63 12 50 12
          Z
          M 50 32
          C 42 32 36 38 36 46
          C 36 52 40 56 44 60
          L 50 66
          L 56 60
          C 60 56 64 52 64 46
          C 64 38 58 32 50 32
          Z
          M 50 42
          C 53 42 56 45 56 48
          C 56 51 53 54 50 54
          C 47 54 44 51 44 48
          C 44 45 47 42 50 42
          Z
        "
        fill="#2a44e8"
      />
    </svg>
  )
}
