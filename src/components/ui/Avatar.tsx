'use client'

import { HTMLAttributes, forwardRef, useState } from 'react'
import { cn, getInitials } from '@/lib/utils'

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  status?: 'online' | 'offline' | 'busy' | 'away'
  showStatus?: boolean
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, name, size = 'md', status, showStatus = false, ...props }, ref) => {
    const [imageError, setImageError] = useState(false)

    const sizes = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg',
      xl: 'w-16 h-16 text-xl',
      '2xl': 'w-20 h-20 text-2xl',
    }

    const statusSizes = {
      xs: 'w-1.5 h-1.5',
      sm: 'w-2 h-2',
      md: 'w-2.5 h-2.5',
      lg: 'w-3 h-3',
      xl: 'w-4 h-4',
      '2xl': 'w-5 h-5',
    }

    const statusColors = {
      online: 'bg-emerald-500',
      offline: 'bg-gray-400',
      busy: 'bg-red-500',
      away: 'bg-amber-500',
    }

    const initials = name ? getInitials(name) : '?'

    return (
      <div className={cn('relative inline-flex', className)} ref={ref} {...props}>
        <div
          className={cn(
            'relative rounded-full flex items-center justify-center font-semibold overflow-hidden',
            'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white',
            'shadow-md ring-2 ring-white',
            sizes[size]
          )}
        >
          {src && !imageError ? (
            <img
              src={src}
              alt={alt || name || 'Avatar'}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        {showStatus && status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 rounded-full ring-2 ring-white',
              statusSizes[size],
              statusColors[status]
            )}
          />
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'

// Avatar Group
export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  max?: number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  avatars: Array<{ src?: string | null; name?: string; alt?: string }>
}

const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, avatars, max = 4, size = 'md', ...props }, ref) => {
    const displayAvatars = avatars.slice(0, max)
    const remaining = avatars.length - max

    const sizes = {
      xs: 'w-6 h-6 text-xs -ml-1.5',
      sm: 'w-8 h-8 text-sm -ml-2',
      md: 'w-10 h-10 text-base -ml-2.5',
      lg: 'w-12 h-12 text-lg -ml-3',
      xl: 'w-16 h-16 text-xl -ml-4',
    }

    return (
      <div ref={ref} className={cn('flex items-center', className)} {...props}>
        {displayAvatars.map((avatar, index) => (
          <Avatar
            key={index}
            src={avatar.src}
            name={avatar.name}
            alt={avatar.alt}
            size={size}
            className={cn(index > 0 && sizes[size].split(' ').find(c => c.startsWith('-ml')))}
          />
        ))}
        {remaining > 0 && (
          <div
            className={cn(
              'rounded-full flex items-center justify-center font-semibold',
              'bg-muted text-muted-foreground ring-2 ring-white',
              sizes[size]
            )}
          >
            +{remaining}
          </div>
        )}
      </div>
    )
  }
)

AvatarGroup.displayName = 'AvatarGroup'

export { Avatar, AvatarGroup }