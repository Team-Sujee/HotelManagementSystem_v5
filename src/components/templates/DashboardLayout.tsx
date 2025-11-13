import React, { useState } from 'react'
import Sidebar from '../organisms/Sidebar'
import Header from '../organisms/Header'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
