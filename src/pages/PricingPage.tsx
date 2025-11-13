import React, { useState, useMemo } from 'react'
import { MOCK_BASE_PRICES, MOCK_SEASONS, MOCK_PRICE_HISTORY } from '../constants'
import { BasePrice, Season, PriceHistory, SeasonStatus, PriceAdjustmentType, ChannelPricingRule } from '../types'
import Table from '../components/molecules/Table'
import Button from '../components/atoms/Button'
import Input from '../components/atoms/Input'
import Badge from '../components/atoms/Badge'
import Card from '../components/atoms/Card'
import Modal from '../components/molecules/Modal'
import FormField from '../components/molecules/FormField'
import DashboardWidget from '../components/organisms/DashboardWidget'
import { 
  Plus, Edit, Trash2, DollarSign, TrendingUp, TrendingDown,
  Calendar, Download, History, Settings
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const PricingPage: React.FC = () => {
  const [basePrices, setBasePrices] = useState<BasePrice[]>(MOCK_BASE_PRICES)
  const [seasons, setSeasons] = useState<Season[]>(MOCK_SEASONS)
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>(MOCK_PRICE_HISTORY)
  const [isBasePriceModalOpen, setIsBasePriceModalOpen] = useState(false)
  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [selectedBasePrice, setSelectedBasePrice] = useState<BasePrice | null>(null)
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null)
  const [activeTab, setActiveTab] = useState<'base' | 'seasons' | 'history'>('base')

  // Form state
  const [basePriceForm, setBasePriceForm] = useState({
    roomType: '',
    basePrice: '',
    maximumOccupancy: '',
    currency: 'USD',
  })

  const [seasonForm, setSeasonForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    adjustmentType: PriceAdjustmentType.Percentage,
    adjustmentValue: '',
    status: SeasonStatus.Active,
  })

  // Calculate KPIs
  const kpis = useMemo(() => {
    const activeSeasons = seasons.filter(s => s.status === SeasonStatus.Active).length
    const avgRoomPrice = basePrices.reduce((sum, bp) => sum + bp.basePrice, 0) / basePrices.length
    const seasonRates = seasons.map(s => {
      const base = basePrices[0]?.basePrice || 150
      if (s.adjustmentType === PriceAdjustmentType.Percentage) {
        return base * (1 + s.adjustmentValue / 100)
      }
      return base + s.adjustmentValue
    })
    const highestRate = Math.max(...seasonRates, avgRoomPrice)
    const lowestRate = Math.min(...seasonRates, avgRoomPrice)

    return {
      activeSeasons,
      avgRoomPrice,
      highestRate,
      lowestRate,
    }
  }, [basePrices, seasons])

  // Chart data for seasonal fluctuations
  const seasonalChartData = useMemo(() => {
    const basePrice = basePrices[0]?.basePrice || 150
    return seasons.map(season => {
      let adjustedPrice = basePrice
      if (season.adjustmentType === PriceAdjustmentType.Percentage) {
        adjustedPrice = basePrice * (1 + season.adjustmentValue / 100)
      } else {
        adjustedPrice = basePrice + season.adjustmentValue
      }
      return {
        name: season.name,
        price: adjustedPrice,
        basePrice: basePrice,
      }
    })
  }, [basePrices, seasons])

  const handleCreateBasePrice = () => {
    const newBasePrice: BasePrice = {
      id: `BP${basePrices.length + 1}`,
      roomType: basePriceForm.roomType,
      basePrice: parseFloat(basePriceForm.basePrice),
      maximumOccupancy: parseInt(basePriceForm.maximumOccupancy),
      currency: basePriceForm.currency,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Admin',
    }
    setBasePrices([...basePrices, newBasePrice])
    setIsBasePriceModalOpen(false)
    setBasePriceForm({ roomType: '', basePrice: '', maximumOccupancy: '', currency: 'USD' })
  }

  const handleUpdateBasePrice = (id: string, newPrice: number) => {
    const price = basePrices.find(bp => bp.id === id)
    if (price) {
      // Add to history
      const historyEntry: PriceHistory = {
        id: `PH${priceHistory.length + 1}`,
        roomType: price.roomType,
        oldPrice: price.basePrice,
        newPrice: newPrice,
        changedAt: new Date().toISOString(),
        changedBy: 'Admin',
        reason: 'Price update',
      }
      setPriceHistory([historyEntry, ...priceHistory])

      // Update price
      setBasePrices(basePrices.map(bp => 
        bp.id === id 
          ? { ...bp, basePrice: newPrice, updatedAt: new Date().toISOString() }
          : bp
      ))
    }
  }

  const handleCreateSeason = () => {
    const newSeason: Season = {
      id: `SEASON${seasons.length + 1}`,
      name: seasonForm.name,
      startDate: seasonForm.startDate,
      endDate: seasonForm.endDate,
      adjustmentType: seasonForm.adjustmentType,
      adjustmentValue: parseFloat(seasonForm.adjustmentValue),
      status: seasonForm.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setSeasons([...seasons, newSeason])
    setIsSeasonModalOpen(false)
    setSeasonForm({
      name: '',
      startDate: '',
      endDate: '',
      adjustmentType: PriceAdjustmentType.Percentage,
      adjustmentValue: '',
      status: SeasonStatus.Active,
    })
  }

  const basePriceColumns = [
    {
      key: 'roomType',
      header: 'Room Type',
      render: (price: BasePrice) => <span className="font-medium">{price.roomType}</span>,
    },
    {
      key: 'basePrice',
      header: 'Base Price',
      render: (price: BasePrice) => (
        <span className="font-semibold text-primary">${price.basePrice.toFixed(2)}</span>
      ),
    },
    {
      key: 'maximumOccupancy',
      header: 'Max Occupancy',
      render: (price: BasePrice) => <span>{price.maximumOccupancy} guests</span>,
    },
    {
      key: 'currency',
      header: 'Currency',
      render: (price: BasePrice) => <Badge variant="outline">{price.currency}</Badge>,
    },
    {
      key: 'updatedAt',
      header: 'Last Updated',
      render: (price: BasePrice) => (
        <span className="text-sm text-textSecondary">
          {new Date(price.updatedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (price: BasePrice) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedBasePrice(price)
              setIsBasePriceModalOpen(true)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const seasonColumns = [
    {
      key: 'name',
      header: 'Season Name',
      render: (season: Season) => <span className="font-medium">{season.name}</span>,
    },
    {
      key: 'dates',
      header: 'Date Range',
      render: (season: Season) => (
        <div className="text-sm">
          <div>{new Date(season.startDate).toLocaleDateString()}</div>
          <div className="text-textSecondary">to {new Date(season.endDate).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      key: 'adjustment',
      header: 'Adjustment',
      render: (season: Season) => (
        <div>
          {season.adjustmentType === PriceAdjustmentType.Percentage ? (
            <span className={season.adjustmentValue >= 0 ? 'text-success' : 'text-error'}>
              {season.adjustmentValue >= 0 ? '+' : ''}{season.adjustmentValue}%
            </span>
          ) : (
            <span className={season.adjustmentValue >= 0 ? 'text-success' : 'text-error'}>
              {season.adjustmentValue >= 0 ? '+' : ''}${season.adjustmentValue}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (season: Season) => (
        <Badge variant={season.status === SeasonStatus.Active ? 'success' : 'outline'}>
          {season.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (season: Season) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedSeason(season)
              setSeasonForm({
                name: season.name,
                startDate: season.startDate,
                endDate: season.endDate,
                adjustmentType: season.adjustmentType,
                adjustmentValue: season.adjustmentValue.toString(),
                status: season.status,
              })
              setIsSeasonModalOpen(true)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const historyColumns = [
    {
      key: 'roomType',
      header: 'Room Type',
      render: (history: PriceHistory) => <span className="font-medium">{history.roomType}</span>,
    },
    {
      key: 'oldPrice',
      header: 'Old Price',
      render: (history: PriceHistory) => <span>${history.oldPrice.toFixed(2)}</span>,
    },
    {
      key: 'newPrice',
      header: 'New Price',
      render: (history: PriceHistory) => (
        <span className="font-semibold text-primary">${history.newPrice.toFixed(2)}</span>
      ),
    },
    {
      key: 'change',
      header: 'Change',
      render: (history: PriceHistory) => {
        const change = history.newPrice - history.oldPrice
        const percentChange = ((change / history.oldPrice) * 100).toFixed(1)
        return (
          <div className={change >= 0 ? 'text-success' : 'text-error'}>
            {change >= 0 ? '+' : ''}${change.toFixed(2)} ({percentChange}%)
          </div>
        )
      },
    },
    {
      key: 'changedAt',
      header: 'Changed At',
      render: (history: PriceHistory) => (
        <span className="text-sm">{new Date(history.changedAt).toLocaleString()}</span>
      ),
    },
    {
      key: 'changedBy',
      header: 'Changed By',
      render: (history: PriceHistory) => <span className="text-sm">{history.changedBy}</span>,
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (history: PriceHistory) => (
        <span className="text-sm text-textSecondary">{history.reason || 'N/A'}</span>
      ),
    },
  ]

  // Channel Pricing Management (new)
  const { list: listRules, create: createRule, update: updateRule, remove: removeRule } = require('../store/channelPricingStore').useChannelPricingStore()
  const [channelFilters, setChannelFilters] = useState<{ roomType: string | 'All'; channel: ChannelPricingRule['channel'] | 'All'; active: boolean | 'All' }>({ roomType: 'All', channel: 'All', active: 'All' })
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false)
  const [editRule, setEditRule] = useState<ChannelPricingRule | null>(null)
  const roomTypes = useMemo(() => Array.from(new Set(basePrices.map(b => b.roomType))), [basePrices])
  const [ruleForm, setRuleForm] = useState({
    roomType: roomTypes[0] || '',
    channel: 'Website' as ChannelPricingRule['channel'],
    adjustmentType: 'Percentage' as 'Amount' | 'Percentage',
    adjustmentValue: 0,
    commissionType: 'Percentage' as 'Fixed' | 'Percentage',
    commissionValue: 0,
    seasonId: '',
    promoCode: '',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '',
  })
  const rules = listRules(channelFilters)
  const openCreateRule = () => { setEditRule(null); setIsRuleModalOpen(true) }
  const openEditRule = (r: ChannelPricingRule) => { setEditRule(r); setRuleForm({
    roomType: r.roomType, channel: r.channel, adjustmentType: r.adjustmentType, adjustmentValue: r.adjustmentValue,
    commissionType: r.commissionType || 'Percentage', commissionValue: r.commissionValue || 0,
    seasonId: r.seasonId || '', promoCode: r.promoCode || '',
    validFrom: r.validFrom.split('T')[0], validTo: r.validTo ? r.validTo.split('T')[0] : ''
  }); setIsRuleModalOpen(true) }
  const saveRule = () => {
    if (editRule) {
      updateRule(editRule.id, { ...ruleForm, validFrom: new Date(ruleForm.validFrom).toISOString(), validTo: ruleForm.validTo ? new Date(ruleForm.validTo).toISOString() : undefined })
    } else {
      createRule({ ...ruleForm, validFrom: new Date(ruleForm.validFrom).toISOString(), validTo: ruleForm.validTo ? new Date(ruleForm.validTo).toISOString() : undefined, createdBy: 'Admin' } as any)
    }
    setIsRuleModalOpen(false)
  }
  const channelColumns = [
    { key: 'roomType', header: 'Room Type' },
    { key: 'channel', header: 'Channel' },
    { key: 'adjustment', header: 'Adjustment', render: (r: ChannelPricingRule) => (<span>{r.adjustmentType === 'Percentage' ? `${r.adjustmentValue}%` : `$${r.adjustmentValue}`}</span>) },
    { key: 'commission', header: 'Commission', render: (r: ChannelPricingRule) => (<span>{r.commissionType ? (r.commissionType === 'Percentage' ? `${r.commissionValue}%` : `$${r.commissionValue}`) : '—'}</span>) },
    { key: 'valid', header: 'Validity', render: (r: ChannelPricingRule) => (<div className="text-sm"><div>From: {new Date(r.validFrom).toLocaleDateString()}</div><div className="text-textSecondary">To: {r.validTo ? new Date(r.validTo).toLocaleDateString() : '—'}</div></div>) },
    { key: 'actions', header: 'Actions', className: 'text-right', render: (r: ChannelPricingRule) => (<div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => openEditRule(r)}>Edit</Button><Button variant="ghost" size="sm" onClick={() => removeRule(r.id)} className="text-error">Delete</Button></div>) },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 animate-fadeIn">
        <h2 className="text-3xl font-bold text-text">Pricing Management</h2>
        <div className="flex gap-3">
          <Button variant="outline" icon={Download}>
            Export
          </Button>
          {activeTab === 'base' && (
            <Button variant="primary" icon={Plus} onClick={() => {
              setSelectedBasePrice(null)
              setBasePriceForm({ roomType: '', basePrice: '', maximumOccupancy: '', currency: 'USD' })
              setIsBasePriceModalOpen(true)
            }}>
              Add Base Price
            </Button>
          )}
          {activeTab === 'seasons' && (
            <Button variant="primary" icon={Plus} onClick={() => {
              setSelectedSeason(null)
              setSeasonForm({
                name: '',
                startDate: '',
                endDate: '',
                adjustmentType: PriceAdjustmentType.Percentage,
                adjustmentValue: '',
                status: SeasonStatus.Active,
              })
              setIsSeasonModalOpen(true)
            }}>
              Add Season
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DashboardWidget 
          metric={{
            title: 'Active Seasons',
            value: kpis.activeSeasons,
            icon: Calendar,
            colorClass: 'text-primary',
          }}
        />
        <DashboardWidget 
          metric={{
            title: 'Avg. Room Price',
            value: `$${kpis.avgRoomPrice.toFixed(2)}`,
            icon: DollarSign,
            colorClass: 'text-success',
          }}
        />
        <DashboardWidget 
          metric={{
            title: 'Highest Rate',
            value: `$${kpis.highestRate.toFixed(2)}`,
            icon: TrendingUp,
            colorClass: 'text-error',
          }}
        />
        <DashboardWidget 
          metric={{
            title: 'Lowest Rate',
            value: `$${kpis.lowestRate.toFixed(2)}`,
            icon: TrendingDown,
            colorClass: 'text-secondary',
          }}
        />
      </div>

      {/* Seasonal Price Chart */}
      {activeTab === 'seasons' && seasonalChartData.length > 0 && (
        <Card title="Seasonal Price Fluctuations">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={seasonalChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2F2F2F" />
              <XAxis dataKey="name" stroke="#A3A3A3" />
              <YAxis stroke="#A3A3A3" />
              <Tooltip
                contentStyle={{ backgroundColor: '#262626', border: '1px solid #2F2F2F', borderRadius: '8px' }}
                itemStyle={{ color: '#FFFFFF' }}
                labelStyle={{ color: '#9E7FFF' }}
              />
              <Legend wrapperStyle={{ color: '#A3A3A3' }} />
              <Line type="monotone" dataKey="basePrice" stroke="#A3A3A3" strokeDasharray="5 5" name="Base Price" />
              <Line type="monotone" dataKey="price" stroke="#9E7FFF" strokeWidth={2} name="Seasonal Price" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab('base')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'base'
              ? 'text-primary border-b-2 border-primary'
              : 'text-textSecondary hover:text-text'
          }`}
        >
          Base Pricing
        </button>
        <button
          onClick={() => setActiveTab('seasons')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'seasons'
              ? 'text-primary border-b-2 border-primary'
              : 'text-textSecondary hover:text-text'
          }`}
        >
          Seasonal Pricing
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-primary border-b-2 border-primary'
              : 'text-textSecondary hover:text-text'
          }`}
        >
          Price History
        </button>
      </div>

      {/* Base Prices Table */}
      {activeTab === 'base' && (
        <Table<BasePrice>
          data={basePrices}
          columns={basePriceColumns}
          emptyMessage="No base prices configured."
        />
      )}

      {/* Seasons Table */}
      {activeTab === 'seasons' && (
        <Table<Season>
          data={seasons}
          columns={seasonColumns}
          emptyMessage="No seasons configured."
        />
      )}

      {/* Channel Pricing Management */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text">Channel Pricing Management</h3>
          <Button variant="primary" onClick={openCreateRule}>Add Pricing Rule</Button>
        </div>
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Room Type</label>
            <select className="px-3 py-2.5 bg-surface border border-border rounded-xl" value={channelFilters.roomType} onChange={(e) => setChannelFilters(prev => ({ ...prev, roomType: e.target.value as any }))}>
              <option value="All">All</option>
              {roomTypes.map(rt => <option key={rt} value={rt}>{rt}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Channel</label>
            <select className="px-3 py-2.5 bg-surface border border-border rounded-xl" value={channelFilters.channel} onChange={(e) => setChannelFilters(prev => ({ ...prev, channel: e.target.value as any }))}>
              {['All','Website','Walk-in','Booking.com','Agoda','Corporate','Travel Agent'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Status</label>
            <select className="px-3 py-2.5 bg-surface border border-border rounded-xl" value={channelFilters.active as any} onChange={(e) => setChannelFilters(prev => ({ ...prev, active: e.target.value === 'All' ? 'All' : e.target.value === 'true' }))}>
              <option value="All">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
        <Table<ChannelPricingRule> data={rules} columns={channelColumns} emptyMessage="No channel pricing rules." />
      </Card>

      {/* Price History Table */}
      {activeTab === 'history' && (
        <Table<PriceHistory>
          data={priceHistory}
          columns={historyColumns}
          emptyMessage="No price history available."
        />
      )}

      {/* Base Price Modal */}
      <Modal
        isOpen={isBasePriceModalOpen}
        onClose={() => setIsBasePriceModalOpen(false)}
        title={selectedBasePrice ? 'Edit Base Price' : 'Add Base Price'}
      >
        <div className="space-y-4">
          <FormField
            label="Room Type"
            type="text"
            value={basePriceForm.roomType}
            onChange={(e) => setBasePriceForm({ ...basePriceForm, roomType: e.target.value })}
            required
          />
          <FormField
            label="Base Price"
            type="number"
            value={basePriceForm.basePrice}
            onChange={(e) => setBasePriceForm({ ...basePriceForm, basePrice: e.target.value })}
            required
            min="0"
            step="0.01"
          />
          <FormField
            label="Maximum Occupancy"
            type="number"
            value={basePriceForm.maximumOccupancy}
            onChange={(e) => setBasePriceForm({ ...basePriceForm, maximumOccupancy: e.target.value })}
            required
            min="1"
          />
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">Currency</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={basePriceForm.currency}
              onChange={(e) => setBasePriceForm({ ...basePriceForm, currency: e.target.value })}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsBasePriceModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateBasePrice}
              disabled={!basePriceForm.roomType || !basePriceForm.basePrice || !basePriceForm.maximumOccupancy}
            >
              {selectedBasePrice ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Season Modal */}
      <Modal
        isOpen={isSeasonModalOpen}
        onClose={() => setIsSeasonModalOpen(false)}
        title={selectedSeason ? 'Edit Season' : 'Add Season'}
      >
        <div className="space-y-4">
          <FormField
            label="Season Name"
            type="text"
            value={seasonForm.name}
            onChange={(e) => setSeasonForm({ ...seasonForm, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Start Date"
              type="date"
              value={seasonForm.startDate}
              onChange={(e) => setSeasonForm({ ...seasonForm, startDate: e.target.value })}
              required
            />
            <FormField
              label="End Date"
              type="date"
              value={seasonForm.endDate}
              onChange={(e) => setSeasonForm({ ...seasonForm, endDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">Adjustment Type</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={seasonForm.adjustmentType}
              onChange={(e) => setSeasonForm({ ...seasonForm, adjustmentType: e.target.value as PriceAdjustmentType })}
            >
              <option value={PriceAdjustmentType.Percentage}>Percentage</option>
              <option value={PriceAdjustmentType.Amount}>Amount</option>
            </select>
          </div>
          <FormField
            label={seasonForm.adjustmentType === PriceAdjustmentType.Percentage ? 'Adjustment (%)' : 'Adjustment ($)'}
            type="number"
            value={seasonForm.adjustmentValue}
            onChange={(e) => setSeasonForm({ ...seasonForm, adjustmentValue: e.target.value })}
            required
            step={seasonForm.adjustmentType === PriceAdjustmentType.Percentage ? '0.1' : '0.01'}
          />
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">Status</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={seasonForm.status}
              onChange={(e) => setSeasonForm({ ...seasonForm, status: e.target.value as SeasonStatus })}
            >
              <option value={SeasonStatus.Active}>Active</option>
              <option value={SeasonStatus.Inactive}>Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsSeasonModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateSeason}
              disabled={!seasonForm.name || !seasonForm.startDate || !seasonForm.endDate || !seasonForm.adjustmentValue}
            >
              {selectedSeason ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Channel Rule Modal */}
      <Modal isOpen={isRuleModalOpen} onClose={() => setIsRuleModalOpen(false)} title={editRule ? 'Edit Pricing Rule' : 'Add Pricing Rule'}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Room Type</label>
            <select className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl" value={ruleForm.roomType} onChange={(e) => setRuleForm({ ...ruleForm, roomType: e.target.value })}>
              {roomTypes.map(rt => <option key={rt} value={rt}>{rt}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Channel</label>
            <select className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl" value={ruleForm.channel} onChange={(e) => setRuleForm({ ...ruleForm, channel: e.target.value as any })}>
              {['Website','Walk-in','Booking.com','Agoda','Corporate','Travel Agent'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Adjustment Type</label>
            <select className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl" value={ruleForm.adjustmentType} onChange={(e) => setRuleForm({ ...ruleForm, adjustmentType: e.target.value as any })}>
              <option value="Percentage">Percentage</option>
              <option value="Amount">Amount</option>
            </select>
          </div>
          <FormField label="Adjustment Value" type="number" value={ruleForm.adjustmentValue} onChange={(e) => setRuleForm({ ...ruleForm, adjustmentValue: parseFloat(e.target.value) || 0 })} />
          <div>
            <label className="block text-sm font-medium text-text mb-2">Commission Type</label>
            <select className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl" value={ruleForm.commissionType} onChange={(e) => setRuleForm({ ...ruleForm, commissionType: e.target.value as any })}>
              <option value="Percentage">Percentage</option>
              <option value="Fixed">Fixed</option>
            </select>
          </div>
          <FormField label="Commission Value" type="number" value={ruleForm.commissionValue} onChange={(e) => setRuleForm({ ...ruleForm, commissionValue: parseFloat(e.target.value) || 0 })} />
          <div>
            <label className="block text-sm font-medium text-text mb-2">Season (optional)</label>
            <select className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl" value={ruleForm.seasonId} onChange={(e) => setRuleForm({ ...ruleForm, seasonId: e.target.value })}>
              <option value="">None</option>
              {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <FormField label="Promo Code (optional)" value={ruleForm.promoCode} onChange={(e) => setRuleForm({ ...ruleForm, promoCode: e.target.value })} />
          <FormField label="Valid From" type="date" value={ruleForm.validFrom} onChange={(e) => setRuleForm({ ...ruleForm, validFrom: e.target.value })} />
          <FormField label="Valid To" type="date" value={ruleForm.validTo} onChange={(e) => setRuleForm({ ...ruleForm, validTo: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <Button variant="outline" onClick={() => setIsRuleModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={saveRule}>{editRule ? 'Save' : 'Create'}</Button>
        </div>
      </Modal>
    </div>
  )
}

export default PricingPage


