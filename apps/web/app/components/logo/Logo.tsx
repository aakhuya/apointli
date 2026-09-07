import React from 'react'

interface LogoProps {
  variant?: 'full' | 'icon' | 'horizontal'
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ variant = 'full', className = '', size = 'md' }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-6 h-6', text: 'text-lg', tagline: 'text-xs' },
    md: { icon: 'w-8 h-8', text: 'text-xl', tagline: 'text-sm' },
    lg: { icon: 'w-10 h-10', text: 'text-2xl', tagline: 'text-base' },
  }

  const sizeClasses = sizes[size]

  if (variant === 'icon') {
    return (
      <div className={`relative ${className}`}>
        <div className={`${sizeClasses.icon} bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] rounded-xl flex items-center justify-center shadow-sm`}>
          <span className="text-white font-bold text-sm tracking-tight">a</span>
        </div>
      </div>
    )
  }

  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className={`${sizeClasses.icon} bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] rounded-xl flex items-center justify-center shadow-sm`}>
          <span className="text-white font-bold text-sm tracking-tight">a</span>
        </div>
        <div>
          <span className={`${sizeClasses.text} font-bold text-[#1e3a8a] tracking-tight`}>apointli</span>
          <div className={`${sizeClasses.tagline} text-gray-500 font-medium tracking-wide`}>
            Book. Manage. Grow.
          </div>
        </div>
      </div>
    )
  }

  // Full variant - vertical
  return (
    <div className={`text-center ${className}`}>
      <div className="flex justify-center mb-2">
        <div className={`${sizeClasses.icon} bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] rounded-2xl flex items-center justify-center shadow-sm`}>
          <span className="text-white font-bold text-lg tracking-tight">a</span>
        </div>
      </div>
      <div className={`${sizeClasses.text} font-bold text-[#1e3a8a] tracking-tight`}>apointli</div>
      <div className={`${sizeClasses.tagline} text-gray-500 font-medium tracking-wider mt-0.5`}>
        Book. Manage. Grow.
      </div>
    </div>
  )
}
