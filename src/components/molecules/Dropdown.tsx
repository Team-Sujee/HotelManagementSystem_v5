import React, { useState, useRef, useEffect } from 'react'
import Button from '../atoms/Button'
import { ChevronDown } from 'lucide-react'

interface DropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'left' | 'right'
  className?: string
}

const Dropdown: React.FC<DropdownProps> = ({ trigger, children, align = 'right', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const toggleDropdown = () => setIsOpen(!isOpen)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const alignClass = align === 'left' ? 'left-0' : 'right-0'

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div onClick={toggleDropdown} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div
          className={`absolute z-50 mt-2 w-48 rounded-xl bg-surface shadow-xl border border-border animate-fadeIn ${alignClass}`}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
        >
          <div className="py-1" role="none">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

interface DropdownItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode
  onClick?: () => void
}

export const DropdownItem: React.FC<DropdownItemProps> = ({ children, onClick, className = '', ...props }) => {
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault()
        onClick?.()
      }}
      className={`block px-4 py-2 text-sm text-textSecondary hover:bg-primary/10 hover:text-primary transition-colors duration-150 ${className}`}
      role="menuitem"
      {...props}
    >
      {children}
    </a>
  )
}

export default Dropdown
