import React, { useState, useMemo } from 'react'
import Card from '../components/atoms/Card'
import DashboardWidget from '../components/organisms/DashboardWidget'
import Button from '../components/atoms/Button'
import Table from '../components/molecules/Table'
import Badge from '../components/atoms/Badge'
import { Users, Hotel, DollarSign, CalendarCheck, TrendingDown, Eye, ChevronRight } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts'
import { DashboardMetric, ChartDataPoint, Reservation, ReservationStatus } from '../types'
import { MOCK_RESERVATIONS } from '../constants'

const AdminDashboardPage: React.FC = () => {
  const [showAllReports, setShowAllReports] = useState(false)
  const [showAllReservations, setShowAllReservations] = useState(false)
  
  // Get today's reservations
  const today = new Date().toISOString().split('T')[0]
  const todayReservations = useMemo(() => {
    return MOCK_RESERVATIONS.filter(r => {
      const checkInDate = r.checkInDate.split('T')[0]
      const checkOutDate = r.checkOutDate.split('T')[0]
      return checkInDate === today || checkOutDate === today
    }).slice(0, showAllReservations ? 20 : 5)
  }, [showAllReservations, today])
  
  // Calculate metrics from actual data
  const totalReservations = MOCK_RESERVATIONS.length
  const checkedInToday = MOCK_RESERVATIONS.filter(r => 
    r.status === ReservationStatus.CheckedIn && r.checkInDate.split('T')[0] === today
  ).length
  const checkedOutToday = MOCK_RESERVATIONS.filter(r => 
    r.status === ReservationStatus.CheckedOut && r.checkOutDate.split('T')[0] === today
  ).length
  const totalRevenue = MOCK_RESERVATIONS
    .filter(r => r.status !== ReservationStatus.Cancelled)
    .reduce((sum, r) => sum + r.totalAmount, 0)
  
  // Mock Data for Dashboard
  const metrics: DashboardMetric[] = [
    { title: 'Total Reservations', value: totalReservations.toString(), change: '+12%', icon: CalendarCheck, colorClass: 'text-primary' },
    { title: 'Checked-In Today', value: checkedInToday.toString(), change: '-5%', icon: Hotel, colorClass: 'text-error' },
    { title: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, change: '+8%', icon: DollarSign, colorClass: 'text-success' },
    { title: 'Checked-Out Today', value: checkedOutToday.toString(), change: '+15%', icon: Users, colorClass: 'text-secondary' },
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
      
      {/* Reservations Details Section */}
      <Card title="Today's Reservations">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-background rounded-lg border border-border">
              <p className="text-sm text-textSecondary mb-1">Check-Ins Today</p>
              <p className="text-2xl font-bold text-text">{checkedInToday}</p>
            </div>
            <div className="p-4 bg-background rounded-lg border border-border">
              <p className="text-sm text-textSecondary mb-1">Check-Outs Today</p>
              <p className="text-2xl font-bold text-text">{checkedOutToday}</p>
            </div>
            <div className="p-4 bg-background rounded-lg border border-border">
              <p className="text-sm text-textSecondary mb-1">Total Today</p>
              <p className="text-2xl font-bold text-text">{todayReservations.length}</p>
            </div>
          </div>
          
          <Table<Reservation>
            data={todayReservations}
            columns={[
              {
                key: 'reservationNumber',
                header: 'Reservation #',
                render: (reservation) => (
                  <span className="font-medium text-primary">{reservation.reservationNumber}</span>
                ),
              },
              {
                key: 'guestName',
                header: 'Guest',
                render: (reservation) => (
                  <div>
                    <div className="font-medium">{reservation.guestName}</div>
                    <div className="text-sm text-textSecondary">{reservation.guestEmail}</div>
                  </div>
                ),
              },
              {
                key: 'roomNumber',
                header: 'Room',
                render: (reservation) => (
                  <div>
                    <div className="font-medium">{reservation.roomNumber}</div>
                    <div className="text-sm text-textSecondary">{reservation.roomType}</div>
                  </div>
                ),
              },
              {
                key: 'dates',
                header: 'Check-In / Check-Out',
                render: (reservation) => (
                  <div>
                    <div className="text-sm">{new Date(reservation.checkInDate).toLocaleDateString()}</div>
                    <div className="text-sm text-textSecondary">{new Date(reservation.checkOutDate).toLocaleDateString()}</div>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (reservation) => {
                  const variant = reservation.status === ReservationStatus.CheckedIn ? 'primary' :
                                 reservation.status === ReservationStatus.CheckedOut ? 'info' :
                                 reservation.status === ReservationStatus.Confirmed ? 'secondary' :
                                 'error'
                  return <Badge variant={variant}>{reservation.status}</Badge>
                },
              },
              {
                key: 'totalAmount',
                header: 'Amount',
                render: (reservation) => (
                  <span className="font-semibold">${reservation.totalAmount.toFixed(2)}</span>
                ),
              },
            ]}
            emptyMessage="No reservations for today."
          />
          
          {MOCK_RESERVATIONS.filter(r => {
            const checkInDate = r.checkInDate.split('T')[0]
            const checkOutDate = r.checkOutDate.split('T')[0]
            return checkInDate === today || checkOutDate === today
          }).length > 5 && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAllReservations(!showAllReservations)}
                icon={ChevronRight}
                className={showAllReservations ? '' : ''}
              >
                {showAllReservations ? 'Show Less' : 'View More'}
              </Button>
            </div>
          )}
        </div>
      </Card>
      
      {/* Additional Reports Section */}
      {!showAllReports && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShowAllReports(true)}
            icon={ChevronRight}
          >
            View More Reports
          </Button>
        </div>
      )}
      
      {showAllReports && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-semibold text-text">Additional Reports</h3>
            <Button
              variant="outline"
              onClick={() => setShowAllReports(false)}
            >
              Show Less
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Guest Demographics">
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
                  <Bar dataKey="value" fill="#f472b6" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            
            <Card title="Revenue by Room Type">
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
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboardPage
