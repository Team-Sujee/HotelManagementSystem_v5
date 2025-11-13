import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { NAV_LINKS } from '../../constants'
import { useAuthStore } from '../../store/authStore'
import { Hotel, Menu, X } from 'lucide-react'
import Button from '../atoms/Button'

interface SidebarProps {
  isOpen: boolean
  toggleSidebar: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { role } = useAuthStore()
  const location = useLocation()

  const filteredLinks = NAV_LINKS.filter(link => role && link.roles.includes(role))

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-surface border-r border-border shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <Link to="/admin-dashboard" className="flex items-center gap-3 text-text text-2xl font-bold">
            <Hotel className="h-8 w-8 text-primary" />
            HMS
          </Link>
          <Button variant="ghost" size="sm" onClick={toggleSidebar} className="lg:hidden" aria-label="Close sidebar">
            <X className="h-6 w-6 text-textSecondary" />
          </Button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {filteredLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl text-textSecondary hover:bg-primary/10 hover:text-primary transition-colors duration-200 group ${
                    location.pathname === link.path ? 'bg-primary/15 text-primary font-medium' : ''
                  }`}
                  onClick={toggleSidebar} // Close sidebar on navigation for mobile
                >
                  <link.icon className={`h-5 w-5 ${location.pathname === link.path ? 'text-primary' : 'text-textSecondary group-hover:text-primary'}`} />
                  <span>{link.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-border text-center text-textSecondary text-sm">
          &copy; {new Date().getFullYear()} HMS. All rights reserved.
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <div className="fixed top-4 left-4 z-30 lg:hidden">
        <Button variant="outline" size="md" onClick={toggleSidebar} aria-label="Open sidebar">
          <Menu className="h-6 w-6 text-text" />
        </Button>
      </div>
    </>
  )
}

export default Sidebar
