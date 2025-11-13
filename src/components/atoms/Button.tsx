import React from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ElementType
  iconPosition?: 'left' | 'right'
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background'

  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-primary shadow-glow-primary',
    secondary: 'bg-secondary text-white hover:bg-secondary/90 focus:ring-secondary',
    outline: 'border border-border text-text hover:bg-surface focus:ring-border',
    ghost: 'text-textSecondary hover:bg-surface focus:ring-surface',
    danger: 'bg-error text-white hover:bg-error/90 focus:ring-error',
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className} ${
        (disabled || loading) ? 'opacity-60 cursor-not-allowed' : ''
      }`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {!loading && Icon && iconPosition === 'left' && <Icon className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}`} />}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}`} />}
    </button>
  )
}

export default Button
