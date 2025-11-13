import React from 'react'
import * as LucideIcons from 'lucide-react'

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: keyof typeof LucideIcons
  size?: number | string
  color?: string
  className?: string
}

const Icon: React.FC<IconProps> = ({ name, size = 24, color = 'currentColor', className = '', ...props }) => {
  const LucideIcon = LucideIcons[name]

  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found in Lucide React.`)
    return null
  }

  return <LucideIcon size={size} color={color} className={className} {...props} />
}

export default Icon
