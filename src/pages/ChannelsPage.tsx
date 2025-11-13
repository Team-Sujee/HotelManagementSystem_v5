import React, { useState, useMemo } from 'react'
import { MOCK_CHANNELS, MOCK_CHANNEL_PERFORMANCE } from '../constants'
import { Channel, ChannelPerformance, ChannelType, ChannelStatus } from '../types'
import Table from '../components/molecules/Table'
import Button from '../components/atoms/Button'
import Input from '../components/atoms/Input'
import Badge from '../components/atoms/Badge'
import Card from '../components/atoms/Card'
import Modal from '../components/molecules/Modal'
import FormField from '../components/molecules/FormField'
import DashboardWidget from '../components/organisms/DashboardWidget'
import { 
  Plus, Edit, Trash2, DollarSign, TrendingUp, Users,
  Download, Filter, BarChart3, Percent
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'

const ChannelsPage: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>(MOCK_CHANNELS)
  const [performance, setPerformance] = useState<ChannelPerformance[]>(MOCK_CHANNEL_PERFORMANCE)
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ChannelStatus | 'All'>('All')

  const [channelForm, setChannelForm] = useState({
    name: '',
    type: ChannelType.OTA,
    commissionRate: '',
    status: ChannelStatus.Active,
  })

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalChannels = channels.length
    const activeChannels = channels.filter(c => c.status === ChannelStatus.Active).length
    const avgCommissionRate = channels.reduce((sum, c) => sum + c.commissionRate, 0) / channels.length
    const totalReservations = performance.reduce((sum, p) => sum + p.totalReservations, 0)
    const totalRevenue = performance.reduce((sum, p) => sum + p.totalRevenue, 0)
    const totalCommission = performance.reduce((sum, p) => sum + p.commissionAmount, 0)

    return {
      totalChannels,
      activeChannels,
      avgCommissionRate,
      totalReservations,
      totalRevenue,
      totalCommission,
    }
  }, [channels, performance])

  // Filter channels
  const filteredChannels = useMemo(() => {
    return channels.filter(channel => {
      const matchesSearch = 
        channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        channel.type.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'All' || channel.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [channels, searchTerm, statusFilter])

  // Chart data
  const revenueChartData = useMemo(() => {
    return performance.map(p => ({
      name: p.channelName,
      revenue: p.totalRevenue,
      commission: p.commissionAmount,
      profit: p.profitAmount,
    }))
  }, [performance])

  const contributionChartData = useMemo(() => {
    return performance.map(p => ({
      name: p.channelName,
      value: p.revenueContributionPercent,
    }))
  }, [performance])

  const PIE_COLORS = ['#9E7FFF', '#38bdf8', '#f472b6', '#10b981', '#f59e0b']

  const handleCreateChannel = () => {
    const newChannel: Channel = {
      id: `CH${channels.length + 1}`,
      name: channelForm.name,
      type: channelForm.type,
      commissionRate: parseFloat(channelForm.commissionRate),
      status: channelForm.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setChannels([...channels, newChannel])
    setIsChannelModalOpen(false)
    setChannelForm({ name: '', type: ChannelType.OTA, commissionRate: '', status: ChannelStatus.Active })
  }

  const handleToggleChannelStatus = (id: string) => {
    setChannels(channels.map(c => 
      c.id === id 
        ? { ...c, status: c.status === ChannelStatus.Active ? ChannelStatus.Inactive : ChannelStatus.Active, updatedAt: new Date().toISOString() }
        : c
    ))
  }

  const channelColumns = [
    {
      key: 'name',
      header: 'Channel Name',
      render: (channel: Channel) => <span className="font-medium">{channel.name}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (channel: Channel) => <Badge variant="outline">{channel.type}</Badge>,
    },
    {
      key: 'commissionRate',
      header: 'Commission Rate',
      render: (channel: Channel) => (
        <span className="font-semibold">{channel.commissionRate}%</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (channel: Channel) => (
        <Badge variant={channel.status === ChannelStatus.Active ? 'success' : 'outline'}>
          {channel.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (channel: Channel) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedChannel(channel)
              setChannelForm({
                name: channel.name,
                type: channel.type,
                commissionRate: channel.commissionRate.toString(),
                status: channel.status,
              })
              setIsChannelModalOpen(true)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleChannelStatus(channel.id)}
          >
            {channel.status === ChannelStatus.Active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ]

  const performanceColumns = [
    {
      key: 'channelName',
      header: 'Channel',
      render: (perf: ChannelPerformance) => <span className="font-medium">{perf.channelName}</span>,
    },
    {
      key: 'totalReservations',
      header: 'Reservations',
      render: (perf: ChannelPerformance) => <span>{perf.totalReservations}</span>,
    },
    {
      key: 'totalRevenue',
      header: 'Total Revenue',
      render: (perf: ChannelPerformance) => (
        <span className="font-semibold text-primary">${perf.totalRevenue.toLocaleString()}</span>
      ),
    },
    {
      key: 'commissionAmount',
      header: 'Commission',
      render: (perf: ChannelPerformance) => (
        <span className="text-error">${perf.commissionAmount.toLocaleString()}</span>
      ),
    },
    {
      key: 'profitAmount',
      header: 'Profit',
      render: (perf: ChannelPerformance) => (
        <span className="text-success">${perf.profitAmount.toLocaleString()}</span>
      ),
    },
    {
      key: 'revenueContributionPercent',
      header: 'Contribution %',
      render: (perf: ChannelPerformance) => (
        <span className="font-medium">{perf.revenueContributionPercent}%</span>
      ),
    },
    {
      key: 'averageRoomPrice',
      header: 'Avg. Room Price',
      render: (perf: ChannelPerformance) => (
        <span>${perf.averageRoomPrice.toFixed(2)}</span>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 animate-fadeIn">
        <h2 className="text-3xl font-bold text-text">Channel Management</h2>
        <div className="flex gap-3">
          <Button variant="outline" icon={Download}>
            Export Report
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => {
            setSelectedChannel(null)
            setChannelForm({ name: '', type: ChannelType.OTA, commissionRate: '', status: ChannelStatus.Active })
            setIsChannelModalOpen(true)
          }}>
            Add Channel
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <DashboardWidget 
          metric={{
            title: 'Total Channels',
            value: kpis.totalChannels,
            icon: BarChart3,
            colorClass: 'text-primary',
          }}
        />
        <DashboardWidget 
          metric={{
            title: 'Active Channels',
            value: kpis.activeChannels,
            icon: TrendingUp,
            colorClass: 'text-success',
          }}
        />
        <DashboardWidget 
          metric={{
            title: 'Avg. Commission',
            value: `${kpis.avgCommissionRate.toFixed(1)}%`,
            icon: Percent,
            colorClass: 'text-secondary',
          }}
        />
        <DashboardWidget 
          metric={{
            title: 'Total Reservations',
            value: kpis.totalReservations,
            icon: Users,
            colorClass: 'text-blue-500',
          }}
        />
        <DashboardWidget 
          metric={{
            title: 'Total Revenue',
            value: `$${kpis.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            colorClass: 'text-primary',
          }}
        />
        <DashboardWidget 
          metric={{
            title: 'Total Commission',
            value: `$${kpis.totalCommission.toLocaleString()}`,
            icon: DollarSign,
            colorClass: 'text-error',
          }}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Revenue by Channel">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2F2F2F" />
              <XAxis dataKey="name" stroke="#A3A3A3" />
              <YAxis stroke="#A3A3A3" />
              <Tooltip
                contentStyle={{ backgroundColor: '#262626', border: '1px solid #2F2F2F', borderRadius: '8px' }}
                itemStyle={{ color: '#FFFFFF' }}
                labelStyle={{ color: '#9E7FFF' }}
              />
              <Legend wrapperStyle={{ color: '#A3A3A3' }} />
              <Bar dataKey="revenue" fill="#9E7FFF" name="Revenue" />
              <Bar dataKey="commission" fill="#ef4444" name="Commission" />
              <Bar dataKey="profit" fill="#10b981" name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Revenue Contribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={contributionChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, value }) => `${name} ${value}%`}
              >
                {contributionChartData.map((_, index) => (
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

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search channels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Filter}
          />
        </div>
        <select
          className="px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ChannelStatus | 'All')}
        >
          <option value="All">All Status</option>
          <option value={ChannelStatus.Active}>Active</option>
          <option value={ChannelStatus.Inactive}>Inactive</option>
        </select>
      </div>

      {/* Channels Table */}
      <Card title="Channel Configuration">
        <Table<Channel>
          data={filteredChannels}
          columns={channelColumns}
          emptyMessage="No channels found."
        />
      </Card>

      {/* Performance Table */}
      <Card title="Channel Performance">
        <Table<ChannelPerformance>
          data={performance}
          columns={performanceColumns}
          emptyMessage="No performance data available."
        />
      </Card>

      {/* Channel Modal */}
      <Modal
        isOpen={isChannelModalOpen}
        onClose={() => setIsChannelModalOpen(false)}
        title={selectedChannel ? 'Edit Channel' : 'Add Channel'}
      >
        <div className="space-y-4">
          <FormField
            label="Channel Name"
            type="text"
            value={channelForm.name}
            onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">Channel Type</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={channelForm.type}
              onChange={(e) => setChannelForm({ ...channelForm, type: e.target.value as ChannelType })}
            >
              <option value={ChannelType.OTA}>OTA</option>
              <option value={ChannelType.TravelAgent}>Travel Agent</option>
              <option value={ChannelType.Corporate}>Corporate</option>
              <option value={ChannelType.Website}>Website</option>
            </select>
          </div>
          <FormField
            label="Commission Rate (%)"
            type="number"
            value={channelForm.commissionRate}
            onChange={(e) => setChannelForm({ ...channelForm, commissionRate: e.target.value })}
            required
            min="0"
            max="100"
            step="0.1"
          />
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">Status</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={channelForm.status}
              onChange={(e) => setChannelForm({ ...channelForm, status: e.target.value as ChannelStatus })}
            >
              <option value={ChannelStatus.Active}>Active</option>
              <option value={ChannelStatus.Inactive}>Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsChannelModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateChannel}
              disabled={!channelForm.name || !channelForm.commissionRate}
            >
              {selectedChannel ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ChannelsPage


