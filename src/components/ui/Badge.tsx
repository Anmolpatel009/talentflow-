'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  dot?: boolean
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot = false, children, ...props }, ref) => {
    const variants = {
      default: 'bg-muted text-muted-foreground border-border',
      primary: 'bg-primary/10 text-primary border-primary/20',
      secondary: 'bg-secondary/10 text-secondary border-secondary/20',
      success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      danger: 'bg-red-500/10 text-red-600 border-red-500/20',
      info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      outline: 'bg-transparent text-foreground border-border',
    }

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-xs',
      lg: 'px-3 py-1.5 text-sm',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 font-medium rounded-full border',
          'transition-colors duration-200',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span className={cn(
            'w-1.5 h-1.5 rounded-full',
            variant === 'success' && 'bg-emerald-500',
            variant === 'warning' && 'bg-amber-500',
            variant === 'danger' && 'bg-red-500',
            variant === 'info' && 'bg-blue-500',
            variant === 'primary' && 'bg-primary',
            variant === 'secondary' && 'bg-secondary',
            variant === 'default' && 'bg-muted-foreground',
            variant === 'outline' && 'bg-foreground',
          )} />
        )}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

// Status Badge with pulse animation
export interface StatusBadgeProps extends BadgeProps {
  pulse?: boolean
}

const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ pulse = false, variant = 'success', children, className, ...props }, ref) => {
    return (
      <Badge
        ref={ref}
        variant={variant}
        className={cn('gap-2', className)}
        {...props}
      >
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
              variant === 'success' && 'bg-emerald-500',
              variant === 'warning' && 'bg-amber-500',
              variant === 'danger' && 'bg-red-500',
              variant === 'info' && 'bg-blue-500',
            )} />
          )}
          <span className={cn(
            'relative inline-flex rounded-full h-2 w-2',
            variant === 'success' && 'bg-emerald-500',
            variant === 'warning' && 'bg-amber-500',
            variant === 'danger' && 'bg-red-500',
            variant === 'info' && 'bg-blue-500',
          )} />
        </span>
        {children}
      </Badge>
    )
  }
)

StatusBadge.displayName = 'StatusBadge'

export { Badge, StatusBadge }