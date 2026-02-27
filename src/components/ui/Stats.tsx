'use client'

import { HTMLAttributes, forwardRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface StatsCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
  }
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  subtitle?: string
  gradient?: boolean
}

const StatsCard = forwardRef<HTMLDivElement, StatsCardProps>(
  ({ className, title, value, change, icon, trend, subtitle, gradient = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-2xl p-6 transition-all duration-300',
          'hover:shadow-card-hover hover:-translate-y-0.5',
          gradient 
            ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white' 
            : 'bg-card border border-border/50 shadow-card',
          className
        )}
        {...props}
      >
        {/* Background Pattern */}
        {gradient && (
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/20" />
            <div className="absolute -left-4 -bottom-4 w-32 h-32 rounded-full bg-white/10" />
          </div>
        )}

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={cn(
                'text-sm font-medium mb-1',
                gradient ? 'text-white/80' : 'text-muted-foreground'
              )}>
                {title}
              </p>
              <p className={cn(
                'text-3xl font-bold tracking-tight',
                gradient ? 'text-white' : 'text-foreground'
              )}>
                {value}
              </p>
            </div>
            {icon && (
              <div className={cn(
                'p-3 rounded-xl',
                gradient 
                  ? 'bg-white/20 text-white' 
                  : 'bg-primary/10 text-primary'
              )}>
                {icon}
              </div>
            )}
          </div>

          {(change || subtitle) && (
            <div className="mt-4 flex items-center gap-2">
              {change && (
                <span className={cn(
                  'inline-flex items-center gap-1 text-sm font-medium',
                  change.type === 'increase' 
                    ? gradient ? 'text-white' : 'text-emerald-600' 
                    : gradient ? 'text-white/80' : 'text-red-600'
                )}>
                  {change.type === 'increase' ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
                    </svg>
                  )}
                  {Math.abs(change.value)}%
                </span>
              )}
              {subtitle && (
                <span className={cn(
                  'text-sm',
                  gradient ? 'text-white/70' : 'text-muted-foreground'
                )}>
                  {subtitle}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
)

StatsCard.displayName = 'StatsCard'

// Mini Stats for compact display
export interface MiniStatsProps extends HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  icon?: ReactNode
}

const MiniStats = forwardRef<HTMLDivElement, MiniStatsProps>(
  ({ className, label, value, icon, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-3 p-4 rounded-xl bg-muted/50',
          className
        )}
        {...props}
      >
        {icon && (
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold text-foreground">{value}</p>
        </div>
      </div>
    )
  }
)

MiniStats.displayName = 'MiniStats'

// Progress Ring
export interface ProgressRingProps extends HTMLAttributes<HTMLDivElement> {
  progress: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  label?: string
}

const ProgressRing = forwardRef<HTMLDivElement, ProgressRingProps>(
  ({ className, progress, size = 'md', showValue = true, label, ...props }, ref) => {
    const sizes = {
      sm: { container: 'w-16 h-16', text: 'text-xs' },
      md: { container: 'w-24 h-24', text: 'text-sm' },
      lg: { container: 'w-32 h-32', text: 'text-base' },
    }

    const strokeWidth = size === 'sm' ? 4 : size === 'md' ? 6 : 8
    const radius = size === 'sm' ? 28 : size === 'md' ? 44 : 60
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (progress / 100) * circumference

    return (
      <div ref={ref} className={cn('relative inline-flex', sizes[size].container, className)} {...props}>
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted"
          />
          {/* Progress circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500 ease-out"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('font-bold text-foreground', sizes[size].text)}>
              {progress}%
            </span>
            {label && (
              <span className="text-xs text-muted-foreground">{label}</span>
            )}
          </div>
        )}
      </div>
    )
  }
)

ProgressRing.displayName = 'ProgressRing'

export { StatsCard, MiniStats, ProgressRing }