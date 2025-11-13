import React, { useState, useMemo } from 'react'
import { useRoomsStore } from '../store/roomsStore'
import { useMealPlansStore } from '../store/mealPlansStore'
import { useChannelHierarchyStore } from '../store/channelHierarchyStore'
import { useSeasonalPricingStore } from '../store/seasonalPricingStore'
import { usePricingAuditStore } from '../store/pricingAuditStore'
import { useAuthStore } from '../store/authStore'
import { 
  MealPlanCode, MainChannelType, PriceAdjustmentType, SeasonStatus 
} from '../types'
import Button from '../components/atoms/Button'
import Input from '../components/atoms/Input'
import Card from '../components/atoms/Card'
import FormField from '../components/molecules/FormField'
import Modal from '../components/molecules/Modal'
import Badge from '../components/atoms/Badge'
import Table from '../components/molecules/Table'
import { 
  Calendar, Settings, DollarSign, TrendingUp, FileText, Receipt, 
  Users, XCircle, Percent, Plus, Minus, Edit, Trash2, Eye, Save, X
} from 'lucide-react'

type UpdateType = 'Percentage' | 'Amount'
type Currency = 'LKR' | 'USD'
type ActiveView = 'pricing' | 'channels' | 'seasons' | 'audit'

interface StayType {
  roomType: string
  mealPlan: MealPlanCode
  label: string
}

interface EditableRate {
  stayType: string
  day: number
  rate: number
}

const PricingPage: React.FC = () => {
  const roomsStore = useRoomsStore()
  const mealPlansStore = useMealPlansStore()
  const channelStore = useChannelHierarchyStore()
  const seasonalStore = useSeasonalPricingStore()
  const auditStore = usePricingAuditStore()
  const { user } = useAuthStore()
  
  const mealPlans = mealPlansStore.mealPlans.filter(mp => mp.active)
  
  // Get unique room types
  const roomTypes = useMemo(() => {
    const types = new Set(roomsStore.rooms.map(r => r.type))
    return Array.from(types)
  }, [roomsStore.rooms])
  
  // Generate stay types (room type + meal plan combinations)
  const stayTypes = useMemo(() => {
    const combinations: StayType[] = []
    roomTypes.forEach(roomType => {
      mealPlans.forEach(plan => {
        combinations.push({
          roomType,
          mealPlan: plan.code,
          label: `${roomType} – ${plan.code}`,
        })
      })
    })
    return combinations
  }, [roomTypes, mealPlans])
  
  // State management
  const [activeView, setActiveView] = useState<ActiveView>('pricing')
  const [selectedDates, setSelectedDates] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })
  const [selectedStayType, setSelectedStayType] = useState<string>('')
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('LKR')
  const [updateType, setUpdateType] = useState<UpdateType>('Percentage')
  const [updateValue, setUpdateValue] = useState<string>('')
  const [selectedMainChannel, setSelectedMainChannel] = useState<string>('')
  const [selectedSubChannel, setSelectedSubChannel] = useState<string>('')
  const [editableRates, setEditableRates] = useState<Record<string, number[]>>({})
  const [previewRates, setPreviewRates] = useState<Record<string, number[]>>({})
  const [showPreview, setShowPreview] = useState(false)
  const [bulkUpdateMode, setBulkUpdateMode] = useState(false)
  
  // Channel Management Modals
  const [isMainChannelModalOpen, setIsMainChannelModalOpen] = useState(false)
  const [isSubChannelModalOpen, setIsSubChannelModalOpen] = useState(false)
  const [selectedMainChannelForEdit, setSelectedMainChannelForEdit] = useState<string | null>(null)
  const [selectedSubChannelForEdit, setSelectedSubChannelForEdit] = useState<string | null>(null)
  const [mainChannelForm, setMainChannelForm] = useState({
    name: 'OTA' as MainChannelType,
    adjustmentPercentage: 0,
    status: 'Active' as 'Active' | 'Inactive',
  })
  const [subChannelForm, setSubChannelForm] = useState({
    name: '',
    mainChannelId: '',
    additionalAdjustmentPercentage: 0,
    commissionType: 'Percentage' as 'Fixed' | 'Percentage',
    commissionValue: 0,
    status: 'Active' as 'Active' | 'Inactive',
  })
  
  // Seasonal Pricing Modals
  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false)
  const [selectedSeasonForEdit, setSelectedSeasonForEdit] = useState<string | null>(null)
  const [seasonForm, setSeasonForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    adjustmentType: PriceAdjustmentType.Percentage,
    adjustmentValue: 0,
    status: SeasonStatus.Active,
    roomTypeAdjustments: {} as Record<string, number>,
    mealPlanAdjustments: {} as Record<string, number>,
    stayTypeAdjustments: {} as Record<string, number>,
  })
  
  // Get days in selected month
  const selectedMonth = useMemo(() => {
    const date = new Date(selectedDates.startDate)
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { year, month, daysInMonth }
  }, [selectedDates.startDate])
  
  // Calculate base rate for a stay type
  const getBaseRate = (stayType: StayType): number => {
    const room = roomsStore.rooms.find(r => r.type === stayType.roomType)
    const mealPlan = mealPlans.find(mp => mp.code === stayType.mealPlan)
    
    if (!room || !mealPlan) return 0
    
    let baseRate = room.price
    
    // Apply meal plan markup
    if (mealPlan.markupType === 'Percentage') {
      baseRate = baseRate * (1 + mealPlan.markupValue / 100)
    } else {
      baseRate = baseRate + mealPlan.markupValue
    }
    
    return baseRate
  }
  
  // Calculate final rate with all adjustments
  const calculateFinalRate = (
    baseRate: number,
    date: string,
    stayType: StayType,
    mainChannelId?: string,
    subChannelId?: string
  ): number => {
    let finalRate = baseRate
    
    // Apply seasonal adjustment
    const seasonalAdjustment = seasonalStore.getSeasonalAdjustment(
      date,
      stayType.roomType,
      stayType.mealPlan,
      stayType.label
    )
    if (seasonalAdjustment !== 0) {
      finalRate = finalRate * (1 + seasonalAdjustment / 100)
    }
    
    // Apply channel adjustment
    if (mainChannelId) {
      const channelAdjustment = channelStore.getEffectiveAdjustment(mainChannelId, subChannelId)
      if (channelAdjustment !== 0) {
        finalRate = finalRate * (1 + channelAdjustment / 100)
      }
    }
    
    // Apply manual update if set
    if (updateValue && selectedStayType === stayType.label) {
      if (updateType === 'Percentage') {
        finalRate = finalRate * (1 + parseFloat(updateValue) / 100)
      } else {
        finalRate = finalRate + parseFloat(updateValue)
      }
    }
    
    // Convert currency (simplified - should use actual exchange rates)
    if (selectedCurrency === 'USD') {
      finalRate = finalRate / 300 // Approximate LKR to USD conversion
    }
    
    return finalRate
  }
  
  // Calculate daily rates for each stay type
  const dailyRates = useMemo(() => {
    const rates: Record<string, number[]> = {}
    const mainChannel = channelStore.getMainChannelByName(selectedMainChannel as MainChannelType)
    const mainChannelId = mainChannel?.id || ''
    
    stayTypes.forEach(stayType => {
      const baseRate = getBaseRate(stayType)
      const dayRates: number[] = []
      
      for (let day = 1; day <= selectedMonth.daysInMonth; day++) {
        const date = new Date(selectedMonth.year, selectedMonth.month, day)
        const dateStr = date.toISOString().split('T')[0]
        
        // Check if we have an editable rate
        const editableKey = `${stayType.label}-${day}`
        if (editableRates[editableKey] !== undefined) {
          dayRates.push(editableRates[editableKey])
        } else {
          const finalRate = calculateFinalRate(
            baseRate,
            dateStr,
            stayType,
            mainChannelId,
            selectedSubChannel || undefined
          )
          dayRates.push(finalRate)
        }
      }
      
      rates[stayType.label] = dayRates
    })
    
    return rates
  }, [
    stayTypes,
    selectedMonth,
    selectedMainChannel,
    selectedSubChannel,
    seasonalStore,
    channelStore,
    updateType,
    updateValue,
    selectedStayType,
    selectedCurrency,
    editableRates,
  ])
  
  // Handle rate cell edit
  const handleRateEdit = (stayType: string, day: number, newRate: number) => {
    const key = `${stayType}-${day}`
    setEditableRates(prev => ({
      ...prev,
      [key]: newRate,
    }))
  }
  
  // Handle bulk update preview
  const handleBulkUpdatePreview = () => {
    if (!updateValue || !selectedStayType) {
      alert('Please select a stay type and enter an update value')
      return
    }
    
    const preview: Record<string, number[]> = {}
    const baseRate = getBaseRate(stayTypes.find(st => st.label === selectedStayType)!)
    
    stayTypes.forEach(stayType => {
      if (selectedStayType && stayType.label !== selectedStayType) {
        preview[stayType.label] = dailyRates[stayType.label]
        return
      }
      
      const dayRates: number[] = []
      for (let day = 1; day <= selectedMonth.daysInMonth; day++) {
        const date = new Date(selectedMonth.year, selectedMonth.month, day)
        const dateStr = date.toISOString().split('T')[0]
        
        let rate = calculateFinalRate(
          baseRate,
          dateStr,
          stayType,
          channelStore.getMainChannelByName(selectedMainChannel as MainChannelType)?.id,
          selectedSubChannel || undefined
        )
        
        // Apply bulk update
        if (updateType === 'Percentage') {
          rate = rate * (1 + parseFloat(updateValue) / 100)
        } else {
          rate = rate + parseFloat(updateValue)
        }
        
        dayRates.push(rate)
      }
      
      preview[stayType.label] = dayRates
    })
    
    setPreviewRates(preview)
    setShowPreview(true)
  }
  
  // Apply bulk update
  const handleApplyBulkUpdate = () => {
    // Log audit
    auditStore.addLog({
      action: 'BulkUpdate',
      entityType: 'BulkUpdate',
      entityId: crypto.randomUUID(),
      entityName: `Bulk Update - ${selectedStayType}`,
      changes: {
        stayType: { old: '', new: selectedStayType },
        updateType: { old: '', new: updateType },
        updateValue: { old: '', new: updateValue },
      },
      userId: user?.id || 'system',
      userName: user?.name || 'System',
      notes: `Bulk update applied to ${selectedStayType} for ${selectedMonth.year}-${selectedMonth.month + 1}`,
    })
    
    setEditableRates(prev => {
      const updated = { ...prev }
      Object.keys(previewRates).forEach(stayType => {
        previewRates[stayType].forEach((rate, idx) => {
          const key = `${stayType}-${idx + 1}`
          updated[key] = rate
        })
      })
      return updated
    })
    
    setShowPreview(false)
    setPreviewRates({})
    setUpdateValue('')
    setSelectedStayType('')
    alert('Bulk update applied successfully!')
  }
  
  // Channel Management Handlers
  const handleCreateMainChannel = () => {
    const channel = channelStore.createMainChannel(mainChannelForm)
    auditStore.addLog({
      action: 'Create',
      entityType: 'Channel',
      entityId: channel.id,
      entityName: channel.name,
      changes: {},
      userId: user?.id || 'system',
      userName: user?.name || 'System',
    })
    setIsMainChannelModalOpen(false)
    setMainChannelForm({ name: 'OTA', adjustmentPercentage: 0, status: 'Active' })
  }
  
  const handleUpdateMainChannel = () => {
    if (!selectedMainChannelForEdit) return
    const oldChannel = channelStore.getMainChannel(selectedMainChannelForEdit)
    if (!oldChannel) return
    
    channelStore.updateMainChannel(selectedMainChannelForEdit, mainChannelForm)
    auditStore.addLog({
      action: 'Update',
      entityType: 'Channel',
      entityId: selectedMainChannelForEdit,
      entityName: mainChannelForm.name,
      changes: {
        adjustmentPercentage: { old: oldChannel.adjustmentPercentage, new: mainChannelForm.adjustmentPercentage },
        status: { old: oldChannel.status, new: mainChannelForm.status },
      },
      userId: user?.id || 'system',
      userName: user?.name || 'System',
    })
    setIsMainChannelModalOpen(false)
    setSelectedMainChannelForEdit(null)
  }
  
  const handleCreateSubChannel = () => {
    if (!subChannelForm.name || !subChannelForm.mainChannelId) {
      alert('Please fill in all required fields')
      return
    }
    
    const channel = channelStore.createSubChannel(subChannelForm)
    auditStore.addLog({
      action: 'Create',
      entityType: 'Channel',
      entityId: channel.id,
      entityName: channel.name,
      changes: {},
      userId: user?.id || 'system',
      userName: user?.name || 'System',
    })
    setIsSubChannelModalOpen(false)
    setSubChannelForm({
      name: '',
      mainChannelId: '',
      additionalAdjustmentPercentage: 0,
      commissionType: 'Percentage',
      commissionValue: 0,
      status: 'Active',
    })
  }
  
  const handleUpdateSubChannel = () => {
    if (!selectedSubChannelForEdit || !subChannelForm.name || !subChannelForm.mainChannelId) {
      alert('Please fill in all required fields')
      return
    }
    
    const oldChannel = channelStore.getSubChannel(selectedSubChannelForEdit)
    if (!oldChannel) return
    
    channelStore.updateSubChannel(selectedSubChannelForEdit, subChannelForm)
    auditStore.addLog({
      action: 'Update',
      entityType: 'Channel',
      entityId: selectedSubChannelForEdit,
      entityName: subChannelForm.name,
      changes: {
        additionalAdjustmentPercentage: { old: oldChannel.additionalAdjustmentPercentage, new: subChannelForm.additionalAdjustmentPercentage },
        status: { old: oldChannel.status, new: subChannelForm.status },
      },
      userId: user?.id || 'system',
      userName: user?.name || 'System',
    })
    setIsSubChannelModalOpen(false)
    setSelectedSubChannelForEdit(null)
  }
  
  // Seasonal Pricing Handlers
  const handleCreateSeason = () => {
    if (!seasonForm.name || !seasonForm.startDate || !seasonForm.endDate) {
      alert('Please fill in all required fields')
      return
    }
    
    if (new Date(seasonForm.endDate) < new Date(seasonForm.startDate)) {
      alert('End date must be after start date')
      return
    }
    
    const season = seasonalStore.createSeason(seasonForm)
    auditStore.addLog({
      action: 'Create',
      entityType: 'Season',
      entityId: season.id,
      entityName: season.name,
      changes: {},
      userId: user?.id || 'system',
      userName: user?.name || 'System',
    })
    setIsSeasonModalOpen(false)
    setSeasonForm({
      name: '',
      startDate: '',
      endDate: '',
      adjustmentType: PriceAdjustmentType.Percentage,
      adjustmentValue: 0,
      status: SeasonStatus.Active,
      roomTypeAdjustments: {},
      mealPlanAdjustments: {},
      stayTypeAdjustments: {},
    })
  }
  
  const handleUpdateSeason = () => {
    if (!selectedSeasonForEdit || !seasonForm.name || !seasonForm.startDate || !seasonForm.endDate) {
      alert('Please fill in all required fields')
      return
    }
    
    if (new Date(seasonForm.endDate) < new Date(seasonForm.startDate)) {
      alert('End date must be after start date')
      return
    }
    
    const oldSeason = seasonalStore.getSeason(selectedSeasonForEdit)
    if (!oldSeason) return
    
    seasonalStore.updateSeason(selectedSeasonForEdit, seasonForm)
    auditStore.addLog({
      action: 'Update',
      entityType: 'Season',
      entityId: selectedSeasonForEdit,
      entityName: seasonForm.name,
      changes: {
        adjustmentValue: { old: oldSeason.adjustmentValue, new: seasonForm.adjustmentValue },
        status: { old: oldSeason.status, new: seasonForm.status },
      },
      userId: user?.id || 'system',
      userName: user?.name || 'System',
    })
    setIsSeasonModalOpen(false)
    setSelectedSeasonForEdit(null)
  }
  
  // Get active main channel for display
  const activeMainChannel = channelStore.getMainChannelByName(selectedMainChannel as MainChannelType)
  const activeSubChannels = activeMainChannel 
    ? channelStore.getSubChannelsByMain(activeMainChannel.id)
    : []
  
  return (
    <div className="space-y-6">
      {/* Header with Functional Buttons */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-text">Hotel Pricing Management</h2>
        <div className="flex gap-2">
          <Button
            variant={activeView === 'pricing' ? 'primary' : 'outline'}
            onClick={() => setActiveView('pricing')}
            icon={DollarSign}
          >
            Pricing Management
          </Button>
          <Button
            variant={activeView === 'channels' ? 'primary' : 'outline'}
            onClick={() => setActiveView('channels')}
            icon={TrendingUp}
          >
            Channel Management
          </Button>
          <Button
            variant={activeView === 'seasons' ? 'primary' : 'outline'}
            onClick={() => setActiveView('seasons')}
            icon={Calendar}
          >
            Seasonal Pricing
          </Button>
          <Button
            variant={activeView === 'audit' ? 'primary' : 'outline'}
            onClick={() => setActiveView('audit')}
            icon={Eye}
          >
            Audit Logs
          </Button>
        </div>
      </div>
        
        {/* Pricing Management View */}
        {activeView === 'pricing' && (
          <>
            {/* Pricing Configuration Section */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-text mb-4">Pricing Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Select Dates</label>
                  <Input
                    type="date"
                    value={selectedDates.startDate}
                    onChange={(e) => setSelectedDates({ ...selectedDates, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Stay Type</label>
                  <select
                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
                    value={selectedStayType}
                    onChange={(e) => setSelectedStayType(e.target.value)}
                  >
                    <option value="">All Stay Types</option>
                    {stayTypes.map(st => (
                      <option key={st.label} value={st.label}>{st.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Currency</label>
                  <select
                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value as Currency)}
                  >
                    <option value="LKR">LKR – Sri Lankan Rupees</option>
                    <option value="USD">USD – US Dollars</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Type of Update</label>
                  <select
                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
                    value={updateType}
                    onChange={(e) => setUpdateType(e.target.value as UpdateType)}
                  >
                    <option value="Percentage">Percentage</option>
                    <option value="Amount">Amount</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    {updateType === 'Percentage' ? 'Percentage (%)' : 'Amount'}
                  </label>
                  <Input
                    type="number"
                    value={updateValue}
                    onChange={(e) => setUpdateValue(e.target.value)}
                    placeholder={updateType === 'Percentage' ? 'e.g., 10' : 'e.g., 1000'}
                    step={updateType === 'Percentage' ? '0.1' : '0.01'}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button variant="primary" onClick={handleBulkUpdatePreview}>
                    Preview
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setUpdateValue('')
                    setSelectedStayType('')
                    setShowPreview(false)
                  }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
            
            {/* Channel Selection */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-text mb-4">Channel Selection</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Main Channel</label>
                  <select
                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
                    value={selectedMainChannel}
                    onChange={(e) => {
                      setSelectedMainChannel(e.target.value)
                      setSelectedSubChannel('')
                    }}
                  >
                    <option value="">Select Main Channel</option>
                    {channelStore.mainChannels.filter(c => c.status === 'Active').map(channel => (
                      <option key={channel.id} value={channel.name}>
                        {channel.name} ({channel.adjustmentPercentage > 0 ? '+' : ''}{channel.adjustmentPercentage}%)
                      </option>
                    ))}
                  </select>
                </div>
                {activeSubChannels.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">Sub Channel (Optional)</label>
                    <select
                      className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
                      value={selectedSubChannel}
                      onChange={(e) => setSelectedSubChannel(e.target.value)}
                    >
                      <option value="">None (Use Main Channel Only)</option>
                      {activeSubChannels.map(channel => (
                        <option key={channel.id} value={channel.id}>
                          {channel.name} ({channel.additionalAdjustmentPercentage > 0 ? '+' : ''}{channel.additionalAdjustmentPercentage}%)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              {activeMainChannel && (
                <div className="mt-4 p-3 bg-background rounded-lg">
                  <p className="text-sm text-textSecondary">
                    Effective Channel Adjustment: <span className="font-semibold text-text">
                      {channelStore.getEffectiveAdjustment(
                        activeMainChannel.id,
                        selectedSubChannel || undefined
                      ) > 0 ? '+' : ''}
                      {channelStore.getEffectiveAdjustment(
                        activeMainChannel.id,
                        selectedSubChannel || undefined
                      )}%
                    </span>
                  </p>
                </div>
              )}
            </Card>
            
            {/* Channel Price Table */}
            <Card className="p-6 overflow-x-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-text">
                  Channel Price Table
                  {activeMainChannel && ` – ${activeMainChannel.name}${selectedSubChannel ? ` / ${channelStore.getSubChannel(selectedSubChannel)?.name}` : ''}`}
                  {' '}({new Date(selectedDates.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
                </h3>
                {showPreview && (
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" onClick={handleApplyBulkUpdate}>
                      <Save className="h-4 w-4 mr-2" />
                      Apply Changes
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel Preview
                    </Button>
                  </div>
                )}
              </div>
              
              {stayTypes.length === 0 ? (
                <p className="text-textSecondary">No stay types available. Please configure room types and meal plans.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-semibold text-text sticky left-0 bg-surface z-10">Stay Type Name</th>
                        {Array.from({ length: selectedMonth.daysInMonth }, (_, i) => i + 1).map(day => (
                          <th key={day} className="text-center p-3 font-semibold text-text min-w-[120px]">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stayTypes.map(stayType => {
                        const rates = showPreview ? previewRates[stayType.label] || dailyRates[stayType.label] : dailyRates[stayType.label]
                        return (
                          <tr key={stayType.label} className={`border-b border-border hover:bg-background ${showPreview ? 'bg-primary/5' : ''}`}>
                            <td className="p-3 font-medium text-text sticky left-0 bg-surface z-10">
                              {stayType.label}
                            </td>
                            {rates?.map((rate, idx) => {
                              const day = idx + 1
                              const key = `${stayType.label}-${day}`
                              const isEditable = editableRates[key] !== undefined
                              return (
                                <td key={idx} className="text-center p-2">
                                  {bulkUpdateMode ? (
                                    <Input
                                      type="number"
                                      value={rate.toFixed(2)}
                                      onChange={(e) => {
                                        const newRate = parseFloat(e.target.value) || 0
                                        handleRateEdit(stayType.label, day, newRate)
                                      }}
                                      className="w-full text-center text-sm"
                                      step="0.01"
                                    />
                                  ) : (
                                    <span className="text-textSecondary text-sm">
                                      {selectedCurrency === 'LKR' 
                                        ? `LKR ${rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        : `USD ${rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                      }
                                    </span>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
        
        {/* Channel Management View */}
        {activeView === 'channels' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-semibold text-text">Channel Management</h3>
              <div className="flex gap-2">
                <Button variant="primary" icon={Plus} onClick={() => {
                  setSelectedMainChannelForEdit(null)
                  setMainChannelForm({ name: 'OTA', adjustmentPercentage: 0, status: 'Active' })
                  setIsMainChannelModalOpen(true)
                }}>
                  Add Main Channel
                </Button>
                <Button variant="outline" icon={Plus} onClick={() => {
                  setSelectedSubChannelForEdit(null)
                  setSubChannelForm({
                    name: '',
                    mainChannelId: channelStore.mainChannels[0]?.id || '',
                    additionalAdjustmentPercentage: 0,
                    commissionType: 'Percentage',
                    commissionValue: 0,
                    status: 'Active',
                  })
                  setIsSubChannelModalOpen(true)
                }}>
                  Add Sub Channel
                </Button>
              </div>
            </div>
            
            {/* Main Channels */}
            <Card className="p-6">
              <h4 className="text-lg font-semibold text-text mb-4">Main Channels</h4>
              <Table
                data={channelStore.mainChannels}
                columns={[
                  {
                    key: 'name',
                    header: 'Channel Name',
                    render: (channel) => <span className="font-medium">{channel.name}</span>,
                  },
                  {
                    key: 'adjustmentPercentage',
                    header: 'Adjustment %',
                    render: (channel) => (
                      <span className={channel.adjustmentPercentage >= 0 ? 'text-success' : 'text-error'}>
                        {channel.adjustmentPercentage > 0 ? '+' : ''}{channel.adjustmentPercentage}%
                      </span>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (channel) => (
                      <Badge variant={channel.status === 'Active' ? 'success' : 'outline'}>
                        {channel.status}
                      </Badge>
                    ),
                  },
                  {
                    key: 'subChannels',
                    header: 'Sub Channels',
                    render: (channel) => {
                      const subChannels = channelStore.getSubChannelsByMain(channel.id)
                      return <span>{subChannels.length}</span>
                    },
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    render: (channel) => (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMainChannelForEdit(channel.id)
                            setMainChannelForm({
                              name: channel.name,
                              adjustmentPercentage: channel.adjustmentPercentage,
                              status: channel.status,
                            })
                            setIsMainChannelModalOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Delete ${channel.name}? This will also delete all sub-channels.`)) {
                              channelStore.removeMainChannel(channel.id)
                              auditStore.addLog({
                                action: 'Delete',
                                entityType: 'Channel',
                                entityId: channel.id,
                                entityName: channel.name,
                                changes: {},
                                userId: user?.id || 'system',
                                userName: user?.name || 'System',
                              })
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-error" />
                        </Button>
                      </div>
                    ),
                  },
                ]}
                emptyMessage="No main channels configured."
              />
            </Card>
            
            {/* Sub Channels */}
            <Card className="p-6">
              <h4 className="text-lg font-semibold text-text mb-4">Sub Channels</h4>
              <Table
                data={channelStore.subChannels}
                columns={[
                  {
                    key: 'name',
                    header: 'Sub Channel Name',
                    render: (channel) => <span className="font-medium">{channel.name}</span>,
                  },
                  {
                    key: 'mainChannel',
                    header: 'Main Channel',
                    render: (channel) => {
                      const main = channelStore.getMainChannel(channel.mainChannelId)
                      return <span>{main?.name || 'N/A'}</span>
                    },
                  },
                  {
                    key: 'additionalAdjustmentPercentage',
                    header: 'Additional Adjustment %',
                    render: (channel) => (
                      <span className={channel.additionalAdjustmentPercentage >= 0 ? 'text-success' : 'text-error'}>
                        {channel.additionalAdjustmentPercentage > 0 ? '+' : ''}{channel.additionalAdjustmentPercentage}%
                      </span>
                    ),
                  },
                  {
                    key: 'effectiveAdjustment',
                    header: 'Effective Adjustment %',
                    render: (channel) => {
                      const effective = channelStore.getEffectiveAdjustment(channel.mainChannelId, channel.id)
                      return (
                        <span className="font-semibold text-primary">
                          {effective > 0 ? '+' : ''}{effective}%
                        </span>
                      )
                    },
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (channel) => (
                      <Badge variant={channel.status === 'Active' ? 'success' : 'outline'}>
                        {channel.status}
                      </Badge>
                    ),
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    render: (channel) => (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSubChannelForEdit(channel.id)
                            setSubChannelForm({
                              name: channel.name,
                              mainChannelId: channel.mainChannelId,
                              additionalAdjustmentPercentage: channel.additionalAdjustmentPercentage,
                              commissionType: channel.commissionType || 'Percentage',
                              commissionValue: channel.commissionValue || 0,
                              status: channel.status,
                            })
                            setIsSubChannelModalOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Delete ${channel.name}?`)) {
                              channelStore.removeSubChannel(channel.id)
                              auditStore.addLog({
                                action: 'Delete',
                                entityType: 'Channel',
                                entityId: channel.id,
                                entityName: channel.name,
                                changes: {},
                                userId: user?.id || 'system',
                                userName: user?.name || 'System',
                              })
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-error" />
                        </Button>
                      </div>
                    ),
                  },
                ]}
                emptyMessage="No sub channels configured."
              />
            </Card>
          </div>
        )}
        
        {/* Seasonal Pricing View */}
        {activeView === 'seasons' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-semibold text-text">Seasonal Pricing Management</h3>
              <Button variant="primary" icon={Plus} onClick={() => {
                setSelectedSeasonForEdit(null)
                setSeasonForm({
                  name: '',
                  startDate: '',
                  endDate: '',
                  adjustmentType: PriceAdjustmentType.Percentage,
                  adjustmentValue: 0,
                  status: SeasonStatus.Active,
                  roomTypeAdjustments: {},
                  mealPlanAdjustments: {},
                  stayTypeAdjustments: {},
                })
                setIsSeasonModalOpen(true)
              }}>
                Add Season
              </Button>
            </div>
            
            <Card className="p-6">
              <Table
                data={seasonalStore.seasons}
                columns={[
                  {
                    key: 'name',
                    header: 'Season Name',
                    render: (season) => <span className="font-medium">{season.name}</span>,
                  },
                  {
                    key: 'dates',
                    header: 'Date Range',
                    render: (season) => (
                      <div className="text-sm">
                        <div>{new Date(season.startDate).toLocaleDateString()}</div>
                        <div className="text-textSecondary">to {new Date(season.endDate).toLocaleDateString()}</div>
                      </div>
                    ),
                  },
                  {
                    key: 'adjustment',
                    header: 'Global Adjustment',
                    render: (season) => (
                      <span className={season.adjustmentValue >= 0 ? 'text-success' : 'text-error'}>
                        {season.adjustmentType === PriceAdjustmentType.Percentage 
                          ? `${season.adjustmentValue >= 0 ? '+' : ''}${season.adjustmentValue}%`
                          : `${season.adjustmentValue >= 0 ? '+' : ''}$${season.adjustmentValue}`
                        }
                      </span>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (season) => (
                      <Badge variant={season.status === SeasonStatus.Active ? 'success' : 'outline'}>
                        {season.status}
                      </Badge>
                    ),
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    render: (season) => (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSeasonForEdit(season.id)
                            setSeasonForm({
                              name: season.name,
                              startDate: season.startDate.split('T')[0],
                              endDate: season.endDate.split('T')[0],
                              adjustmentType: season.adjustmentType,
                              adjustmentValue: season.adjustmentValue,
                              status: season.status,
                              roomTypeAdjustments: season.roomTypeAdjustments || {},
                              mealPlanAdjustments: season.mealPlanAdjustments || {},
                              stayTypeAdjustments: season.stayTypeAdjustments || {},
                            })
                            setIsSeasonModalOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Delete ${season.name}?`)) {
                              seasonalStore.removeSeason(season.id)
                              auditStore.addLog({
                                action: 'Delete',
                                entityType: 'Season',
                                entityId: season.id,
                                entityName: season.name,
                                changes: {},
                                userId: user?.id || 'system',
                                userName: user?.name || 'System',
                              })
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-error" />
                        </Button>
                      </div>
                    ),
                  },
                ]}
                emptyMessage="No seasons configured."
              />
            </Card>
          </div>
        )}
        
        {/* Audit Logs View */}
        {activeView === 'audit' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-text">Pricing Audit Logs</h3>
            <Card className="p-6">
              <Table
                data={auditStore.logs.slice(0, 100)}
                columns={[
                  {
                    key: 'timestamp',
                    header: 'Timestamp',
                    render: (log) => (
                      <span className="text-sm">{new Date(log.timestamp).toLocaleString()}</span>
                    ),
                  },
                  {
                    key: 'action',
                    header: 'Action',
                    render: (log) => <Badge variant="outline">{log.action}</Badge>,
                  },
                  {
                    key: 'entityType',
                    header: 'Entity Type',
                    render: (log) => <span>{log.entityType}</span>,
                  },
                  {
                    key: 'entityName',
                    header: 'Entity Name',
                    render: (log) => <span className="font-medium">{log.entityName}</span>,
                  },
                  {
                    key: 'userName',
                    header: 'User',
                    render: (log) => <span>{log.userName}</span>,
                  },
                  {
                    key: 'notes',
                    header: 'Notes',
                    render: (log) => <span className="text-sm text-textSecondary">{log.notes || '—'}</span>,
                  },
                ]}
                emptyMessage="No audit logs available."
              />
            </Card>
          </div>
        )}
      </div>
      
      {/* Main Channel Modal */}
      <Modal
        isOpen={isMainChannelModalOpen}
        onClose={() => {
          setIsMainChannelModalOpen(false)
          setSelectedMainChannelForEdit(null)
        }}
        title={selectedMainChannelForEdit ? 'Edit Main Channel' : 'Add Main Channel'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Channel Name</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text"
              value={mainChannelForm.name}
              onChange={(e) => setMainChannelForm({ ...mainChannelForm, name: e.target.value as MainChannelType })}
              disabled={!!selectedMainChannelForEdit}
            >
              <option value="OTA">OTA</option>
              <option value="Website">Website</option>
              <option value="Travel Agent">Travel Agent</option>
              <option value="Direct">Direct</option>
            </select>
          </div>
          <FormField
            label="Adjustment Percentage (%)"
            type="number"
            value={mainChannelForm.adjustmentPercentage.toString()}
            onChange={(e) => setMainChannelForm({ ...mainChannelForm, adjustmentPercentage: parseFloat(e.target.value) || 0 })}
            step="0.1"
          />
          <div>
            <label className="block text-sm font-medium text-text mb-2">Status</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text"
              value={mainChannelForm.status}
              onChange={(e) => setMainChannelForm({ ...mainChannelForm, status: e.target.value as 'Active' | 'Inactive' })}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => {
              setIsMainChannelModalOpen(false)
              setSelectedMainChannelForEdit(null)
            }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={selectedMainChannelForEdit ? handleUpdateMainChannel : handleCreateMainChannel}>
              {selectedMainChannelForEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Sub Channel Modal */}
      <Modal
        isOpen={isSubChannelModalOpen}
        onClose={() => {
          setIsSubChannelModalOpen(false)
          setSelectedSubChannelForEdit(null)
        }}
        title={selectedSubChannelForEdit ? 'Edit Sub Channel' : 'Add Sub Channel'}
      >
        <div className="space-y-4">
          <FormField
            label="Sub Channel Name"
            value={subChannelForm.name}
            onChange={(e) => setSubChannelForm({ ...subChannelForm, name: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-text mb-2">Main Channel</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text"
              value={subChannelForm.mainChannelId}
              onChange={(e) => setSubChannelForm({ ...subChannelForm, mainChannelId: e.target.value })}
              required
            >
              <option value="">Select Main Channel</option>
              {channelStore.mainChannels.map(channel => (
                <option key={channel.id} value={channel.id}>{channel.name}</option>
              ))}
            </select>
          </div>
          <FormField
            label="Additional Adjustment Percentage (%)"
            type="number"
            value={subChannelForm.additionalAdjustmentPercentage.toString()}
            onChange={(e) => setSubChannelForm({ ...subChannelForm, additionalAdjustmentPercentage: parseFloat(e.target.value) || 0 })}
            step="0.1"
          />
          <div>
            <label className="block text-sm font-medium text-text mb-2">Status</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text"
              value={subChannelForm.status}
              onChange={(e) => setSubChannelForm({ ...subChannelForm, status: e.target.value as 'Active' | 'Inactive' })}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => {
              setIsSubChannelModalOpen(false)
              setSelectedSubChannelForEdit(null)
            }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={selectedSubChannelForEdit ? handleUpdateSubChannel : handleCreateSubChannel}>
              {selectedSubChannelForEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Season Modal */}
      <Modal
        isOpen={isSeasonModalOpen}
        onClose={() => {
          setIsSeasonModalOpen(false)
          setSelectedSeasonForEdit(null)
        }}
        title={selectedSeasonForEdit ? 'Edit Season' : 'Add Season'}
      >
        <div className="space-y-4">
          <FormField
            label="Season Name"
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
            <label className="block text-sm font-medium text-text mb-2">Adjustment Type</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text"
              value={seasonForm.adjustmentType}
              onChange={(e) => setSeasonForm({ ...seasonForm, adjustmentType: e.target.value as PriceAdjustmentType })}
            >
              <option value={PriceAdjustmentType.Percentage}>Percentage</option>
              <option value={PriceAdjustmentType.Amount}>Amount</option>
            </select>
          </div>
          <FormField
            label={seasonForm.adjustmentType === PriceAdjustmentType.Percentage ? 'Adjustment Value (%)' : 'Adjustment Value ($)'}
            type="number"
            value={seasonForm.adjustmentValue.toString()}
            onChange={(e) => setSeasonForm({ ...seasonForm, adjustmentValue: parseFloat(e.target.value) || 0 })}
            step={seasonForm.adjustmentType === PriceAdjustmentType.Percentage ? '0.1' : '0.01'}
            required
          />
          <div>
            <label className="block text-sm font-medium text-text mb-2">Status</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text"
              value={seasonForm.status}
              onChange={(e) => setSeasonForm({ ...seasonForm, status: e.target.value as SeasonStatus })}
            >
              <option value={SeasonStatus.Active}>Active</option>
              <option value={SeasonStatus.Inactive}>Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => {
              setIsSeasonModalOpen(false)
              setSelectedSeasonForEdit(null)
            }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={selectedSeasonForEdit ? handleUpdateSeason : handleCreateSeason}>
              {selectedSeasonForEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default PricingPage
