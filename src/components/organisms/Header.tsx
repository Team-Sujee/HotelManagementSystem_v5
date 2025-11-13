import React from 'react'
import { useAuthStore } from '../../store/authStore'
import Avatar from '../atoms/Avatar'
import Dropdown, { DropdownItem } from '../molecules/Dropdown'
import Button from '../atoms/Button'
import { LogOut, Settings, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  toggleSidebar: () => void; // For mobile sidebar toggle
}

const Header: React.FC<HeaderProps> = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-surface border-b border-border shadow-sm lg:ml-64">
      <div className="flex items-center gap-4">
        {/* Placeholder for breadcrumbs or page title */}
        <h1 className="text-2xl font-bold text-text">
          {/* Dynamically set page title based on route */}
          Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <Dropdown
            trigger={
              <div className="flex items-center gap-3 cursor-pointer group">
                <Avatar src={user.avatarUrl} alt={user.name} size="md" />
                <div className="hidden md:block text-right">
                  <p className="text-text font-medium group-hover:text-primary transition-colors duration-200">{user.name}</p>
                  <p className="text-sm text-textSecondary group-hover:text-accent transition-colors duration-200">{user.role}</p>
                </div>
              </div>
            }
          >
            <DropdownItem onClick={() => navigate('/profile')} icon={<User className="h-4 w-4 mr-2" />}>
              Profile
            </DropdownItem>
            <DropdownItem onClick={() => navigate('/settings')} icon={<Settings className="h-4 w-4 mr-2" />}>
              Settings
            </DropdownItem>
            <hr className="border-border my-1" />
            <DropdownItem onClick={handleLogout} className="text-error hover:bg-error/10 hover:text-error" icon={<LogOut className="h-4 w-4 mr-2" />}>
              Logout
            </DropdownItem>
          </Dropdown>
        )}
      </div>
    </header>
  )
}

export default Header
