import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  title?: string
}

const Card: React.FC<CardProps> = ({ children, className = '', title, ...props }) => {
  return (
    <div
      className={`bg-surface p-6 rounded-2xl shadow-lg border border-border animate-fadeIn ${className}`}
      {...props}
    >
      {title && <h3 className="text-xl font-semibold text-text mb-4">{title}</h3>}
      {children}
    </div>
  )
}

export default Card
