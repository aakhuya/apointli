'use client'

import React from 'react'

interface ApointliLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'light' | 'dark' | 'auto'
  showDot?: boolean
  className?: string
}

const sizeMap = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-5xl',
}

/**
 * Apointli wordmark logo.
 *
 * variant="auto" uses CSS classes that respect the current theme
 * (text-[#0a1628] in light mode, text-white in dark mode) — this is
 * the default and recommended value.
 */
export function ApointliLogo({
  size = 'md',
  variant = 'auto',
  showDot = true,
  className = '',
}: ApointliLogoProps) {
  let colorClass: string
  let dotColor: string

  if (variant === 'light') {
    colorClass = 'text-white'
    dotColor = 'bg-blue-300'
  } else if (variant === 'dark') {
    colorClass = 'text-[#0a1628]'
    dotColor = 'bg-[#2a44e8]'
  } else {
    // auto — respects theme
    colorClass = 'text-[#0a1628] dark:text-white'
    dotColor = 'bg-[#2a44e8] dark:bg-blue-400'
  }

  return (
    <span
      className={`inline-flex items-baseline ${sizeMap[size]} ${colorClass} ${className}`}
      aria-label="apointli"
      style={{
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: 800,
        letterSpacing: '-0.045em',
        lineHeight: 1,
      }}
    >
      apointli
      {showDot && (
        <span
          className={`inline-block w-[0.16em] h-[0.16em] ml-[0.06em] rounded-full ${dotColor}`}
          aria-hidden="true"
        />
      )}
    </span>
  )
}

export function ApointliMark({
  size = 'md',
  variant = 'auto',
  className = '',
}: Omit<ApointliLogoProps, 'showDot'>) {
  return (
    <ApointliLogo
      size={size}
      variant={variant}
      showDot={false}
      className={className}
    />
  )
}
