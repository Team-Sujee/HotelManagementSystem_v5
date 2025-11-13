import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ElementType
}

const Input: React.FC<InputProps> = ({ label, error, icon: Icon, className = '', ...props }) => {
  const baseStyles = 'w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200'
  const errorStyles = error ? 'border-error focus:ring-error' : ''

  return (
    <div className="relative">
      {label && (
        <label htmlFor={props.id || props.name} className="block text-sm font-medium text-textSecondary mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-textSecondary" aria-hidden="true" />
          </div>
        )}
        <input
          className={`${baseStyles} ${errorStyles} ${Icon ? 'pl-10' : 'pl-4'} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  )
}

export default Input
