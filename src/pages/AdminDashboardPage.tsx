import React from 'react'
import Card from '../components/atoms/Card'
import DashboardWidget from '../components/organisms/DashboardWidget'
import Button from '../components/atoms/Button'
import { Users, Hotel, DollarSign, CalendarCheck, TrendingDown } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts'
import { DashboardMetric, ChartDataPoint } from '../types'

const AdminDashboardPage: React.FC = () => {
  // Mock Data for Dashboard
  const metrics: DashboardMetric[] = [
    { title: 'Total Guests', value: '1,234', change: '+12%', icon: Users, colorClass: 'text-primary' },
    { title: 'Occupied Rooms', value: '45/100', change: '-5%', icon: Hotel, colorClass: 'text-error' },
    { title: 'Monthly Revenue', value: '$125,000', change: '+8%', icon: DollarSign, colorClass: 'text-success' },
    { title: 'Upcoming Bookings', value: '78', change: '+15%', icon: CalendarCheck, colorClass: 'text-secondary' },
  ]

  const revenueTrendData: ChartDataPoint[] = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 5000 },
    { name: 'Apr', value: 4500 },
    { name: 'May', value: 6000 },
    { name: 'Jun', value: 5500 },
    { name: 'Jul', value: 7000 },
  ]

  const roomOccupancyData: ChartDataPoint[] = [
    { name: 'Standard', value: 60 },
    { name: 'Deluxe', value: 85 },
    { name: 'Suite', value: 40 },
    { name: 'Twin', value: 70 },
  ]

  const channelPerformanceData: ChartDataPoint[] = [
    { name: 'Website', value: 300 },
    { name: 'Booking.com', value: 200 },
    { name: 'Expedia', value: 150 },
    { name: 'Walk-in', value: 50 },
  ]

  const PIE_COLORS = ['#9E7FFF', '#38bdf8', '#f472b6', '#10b981', '#f59e0b'];


  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-text mb-6 animate-fadeIn">Admin Dashboard</h2>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <DashboardWidget key={index} metric={metric} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Revenue Trend (Last 7 Months)">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueTrendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2F2F2F" />
              <XAxis dataKey="name" stroke="#A3A3A3" />
              <YAxis stroke="#A3A3A3" />
              <Tooltip
                contentStyle={{ backgroundColor: '#262626', border: '1px solid #2F2F2F', borderRadius: '8px' }}
                itemStyle={{ color: '#FFFFFF' }}
                labelStyle={{ color: '#9E7FFF' }}
              />
              <Line type="monotone" dataKey="value" stroke="#9E7FFF" strokeWidth={3} dot={{ r: 6, fill: '#9E7FFF', stroke: '#9E7FFF', strokeWidth: 2 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Room Type Occupancy">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={roomOccupancyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2F2F2F" />
              <XAxis dataKey="name" stroke="#A3A3A3" />
              <YAxis stroke="#A3A3A3" />
              <Tooltip
                contentStyle={{ backgroundColor: '#262626', border: '1px solid #2F2F2F', borderRadius: '8px' }}
                itemStyle={{ color: '#FFFFFF' }}
                labelStyle={{ color: '#9E7FFF' }}
              />
              <Legend wrapperStyle={{ color: '#A3A3A3' }} />
              <Bar dataKey="value" fill="#38bdf8" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Bookings by Channel">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={channelPerformanceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {channelPerformanceData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#262626', border: '1px solid #2F2F2F', borderRadius: '8px' }}
                itemStyle={{ color: '#FFFFFF' }}
                labelStyle={{ color: '#9E7FFF' }}
              />
              <Legend wrapperStyle={{ color: '#A3A3A3' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Quick Actions">
          <div className="space-y-4">
            <Button variant="primary" className="w-full" icon={CalendarCheck}>Create New Reservation</Button>
            <Button variant="secondary" className="w-full" icon={Hotel}>Manage Rooms</Button>
            <Button variant="outline" className="w-full" icon={Users}>View All Guests</Button>
            <Button variant="danger" className="w-full" icon={TrendingDown}>Process Refund</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AdminDashboardPage
