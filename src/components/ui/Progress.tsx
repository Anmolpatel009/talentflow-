'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

// Progress Bar
export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'gradient' | 'success' | 'warning' | 'danger'
  showValue?: boolean
  animated?: boolean
}

const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, value, max = 100, size = 'md', variant = 'default', showValue = false, animated = false, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    const sizes = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    }

    const variants = {
      default: 'bg-primary',
      gradient: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500',
      success: 'bg-emerald-500',
      warning: 'bg-amber-500',
      danger: 'bg-red-500',
    }

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        <div className={cn('w-full bg-muted rounded-full overflow-hidden', sizes[size])}>
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              variants[variant],
              animated && 'animate-shimmer'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showValue && (
          <p className="text-sm text-muted-foreground mt-1 text-right">{Math.round(percentage)}%</p>
        )}
      </div>
    )
  }
)

ProgressBar.displayName = 'ProgressBar'

// Skeleton Loader
export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'rectangular', width, height, ...props }, ref) => {
    const variants = {
      text: 'rounded',
      circular: 'rounded-full',
      rectangular: 'rounded-xl',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'bg-muted animate-pulse',
          variants[variant],
          className
        )}
        style={{ width, height }}
        {...props}
      />
    )
  }
)

Skeleton.displayName = 'Skeleton'

// Loading Spinner
export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'primary' | 'white'
}

const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', variant = 'default', ...props }, ref) => {
    const sizes = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8',
    }

    const variants = {
      default: 'text-muted-foreground',
      primary: 'text-primary',
      white: 'text-white',
    }

    return (
      <div ref={ref} className={cn('animate-spin', sizes[size], variants[variant], className)} {...props}>
        <svg fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    )
  }
)

Spinner.displayName = 'Spinner'

// Empty State
export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center py-12 px-4 text-center',
          className
        )}
        {...props}
      >
        {icon && (
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
        )}
        {action}
      </div>
    )
  }
)

EmptyState.displayName = 'EmptyState'

// Divider
export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
  label?: string
}

const Divider = forwardRef<HTMLDivElement, DividerProps>(
  ({ className, orientation = 'horizontal', label, ...props }, ref) => {
    if (orientation === 'vertical') {
      return (
        <div
          ref={ref}
          className={cn('w-px bg-border self-stretch', className)}
          {...props}
        />
      )
    }

    if (label) {
      return (
        <div ref={ref} className={cn('flex items-center gap-4', className)} {...props}>
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-muted-foreground">{label}</span>
          <div className="flex-1 h-px bg-border" />
        </div>
      )
    }

    return (
      <div ref={ref} className={cn('h-px bg-border w-full', className)} {...props} />
    )
  }
)

Divider.displayName = 'Divider'

// Tooltip
export interface TooltipProps extends HTMLAttributes<HTMLDivElement> {
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  ({ className, content, position = 'top', children, ...props }, ref) => {
    const positions = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    }

    return (
      <div ref={ref} className={cn('relative group', className)} {...props}>
        {children}
        <div
          className={cn(
            'absolute z-50 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg',
            'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
            'transition-all duration-200 whitespace-nowrap',
            'shadow-lg',
            positions[position]
          )}
        >
          {content}
        </div>
      </div>
    )
  }
)

Tooltip.displayName = 'Tooltip'

export { ProgressBar, Skeleton, Spinner, EmptyState, Divider, Tooltip }