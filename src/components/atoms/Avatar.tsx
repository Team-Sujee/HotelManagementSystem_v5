import React from 'react'
import { User as UserIcon } from 'lucide-react'

interface AvatarProps {
  src?: string
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const Avatar: React.FC<AvatarProps> = ({ src, alt = 'User Avatar', size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-xl',
  }

  return (
    <div
      className={`relative flex items-center justify-center rounded-full bg-surface text-textSecondary overflow-hidden flex-shrink-0 ${sizeClasses[size]} ${className}`}
      aria-label={alt}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <UserIcon className="h-2/3 w-2/3" />
      )}
    </div>
  )
}

export default Avatar
