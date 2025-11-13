import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import Button from '../atoms/Button'
import FormField from '../molecules/FormField'
import Card from '../atoms/Card'
import { Mail, Lock, Hotel } from 'lucide-react'
import { UserRole } from '../../types'

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Basic validation and mock login
    if (email === 'admin@hms.com' && password === 'password') {
      login({
        id: 'admin1',
        name: 'Admin User',
        email: 'admin@hms.com',
        role: UserRole.Admin,
        avatarUrl: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      })
      navigate('/admin-dashboard')
    } else if (email === 'receptionist@hms.com' && password === 'password') {
      login({
        id: 'receptionist1',
        name: 'Receptionist Jane',
        email: 'receptionist@hms.com',
        role: UserRole.Receptionist,
        avatarUrl: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      })
      navigate('/admin-dashboard')
    } else if (email === 'housekeeping@hms.com' && password === 'password') {
      login({
        id: 'housekeeping1',
        name: 'Housekeeper John',
        email: 'housekeeping@hms.com',
        role: UserRole.Housekeeping,
        avatarUrl: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      })
      navigate('/housekeeping')
    }
    else {
      setError('Invalid credentials. Try admin@hms.com / receptionist@hms.com / housekeeping@hms.com with password "password".')
    }
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md p-8 animate-fadeIn">
      <div className="flex flex-col items-center mb-8">
        <Hotel className="h-16 w-16 text-primary mb-4 animate-pulseGlow" />
        <h2 className="text-3xl font-bold text-text mb-2">Welcome Back!</h2>
        <p className="text-textSecondary text-center">Sign in to your Hotel Management System account.</p>
      </div>
      <form onSubmit={handleSubmit}>
        <FormField
          label="Email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={Mail}
          required
          className="mb-4"
        />
        <FormField
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={Lock}
          required
          className="mb-6"
        />
        {error && <p className="text-error text-sm mb-4 text-center">{error}</p>}
        <Button type="submit" className="w-full" loading={loading} size="lg">
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>
      <p className="mt-6 text-center text-textSecondary text-sm">
        Forgot your password? <a href="#" className="text-primary hover:underline">Reset it here</a>.
      </p>
    </Card>
  )
}

export default LoginForm
