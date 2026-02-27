'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading = false,
    leftIcon,
    rightIcon,
    disabled,
    children, 
    ...props 
  }, ref) => {
    const baseStyles = `
      relative inline-flex items-center justify-center font-semibold
      transition-all duration-300 ease-smooth
      focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
      overflow-hidden
    `

    const variants = {
      primary: `
        text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500
        bg-[length:200%_200%] animate-gradient
        shadow-button hover:shadow-button-hover hover:-translate-y-0.5
        before:absolute before:inset-0 before:bg-white/20 before:opacity-0 
        hover:before:opacity-100 before:transition-opacity before:duration-300
      `,
      secondary: `
        bg-card text-foreground border border-border
        hover:bg-muted hover:border-primary/30 hover:shadow-soft
        active:scale-[0.98]
      `,
      ghost: `
        text-foreground hover:bg-muted hover:text-foreground
        active:scale-[0.98]
      `,
      danger: `
        text-white bg-gradient-to-r from-red-500 to-rose-500
        shadow-md hover:shadow-lg hover:-translate-y-0.5
      `,
      success: `
        text-white bg-gradient-to-r from-emerald-500 to-green-500
        shadow-md hover:shadow-lg hover:-translate-y-0.5
      `,
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
      md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
      lg: 'px-6 py-3 text-base rounded-xl gap-2',
      xl: 'px-8 py-4 text-lg rounded-2xl gap-3',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg 
            className="absolute w-5 h-5 animate-spin" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
              fill="none"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        <span className={cn('flex items-center gap-2', isLoading && 'opacity-0')}>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </span>
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }