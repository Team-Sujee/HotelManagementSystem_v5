import React from 'react'
import LoginForm from '../components/organisms/LoginForm'

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-surface p-4">
      <LoginForm />
    </div>
  )
}

export default LoginPage
