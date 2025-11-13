import React, { useState, useMemo } from 'react'
import { MOCK_HOTEL_POLICIES, MOCK_CANCELLATION_POLICIES, MOCK_OVERBOOKING_POLICIES, MOCK_CHANNELS, MOCK_SEASONS } from '../constants'
import { HotelPolicy, CancellationPolicy, OverbookingPolicy, PolicyType, PenaltyType } from '../types'
import Table from '../components/molecules/Table'
import Button from '../components/atoms/Button'
import Input from '../components/atoms/Input'
import Badge from '../components/atoms/Badge'
import Card from '../components/atoms/Card'
import Modal from '../components/molecules/Modal'
import FormField from '../components/molecules/FormField'
import DashboardWidget from '../components/organisms/DashboardWidget'
import { 
  Plus, Edit, Trash2, Search, ShieldCheck, FileText,
  AlertTriangle, Settings, Download
} from 'lucide-react'

const PoliciesPage: React.FC = () => {
  const [hotelPolicies, setHotelPolicies] = useState<HotelPolicy[]>(MOCK_HOTEL_POLICIES)
  const [cancellationPolicies, setCancellationPolicies] = useState<CancellationPolicy[]>(MOCK_CANCELLATION_POLICIES)
  const [overbookingPolicies, setOverbookingPolicies] = useState<OverbookingPolicy[]>(MOCK_OVERBOOKING_POLICIES)
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false)
  const [isCancellationModalOpen, setIsCancellationModalOpen] = useState(false)
  const [isOverbookingModalOpen, setIsOverbookingModalOpen] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<HotelPolicy | null>(null)
  const [selectedCancellation, setSelectedCancellation] = useState<CancellationPolicy | null>(null)
  const [selectedOverbooking, setSelectedOverbooking] = useState<OverbookingPolicy | null>(null)
  const [activeTab, setActiveTab] = useState<'hotel' | 'cancellation' | 'overbooking'>('hotel')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<PolicyType | 'All'>('All')

  const [policyForm, setPolicyForm] = useState({
    type: PolicyType.CheckInOut,
    title: '',
    description: '',
    rules: '',
    status: 'Active' as 'Active' | 'Inactive',
  })

  const [cancellationForm, setCancellationForm] = useState({
    name: '',
    channelId: '',
    seasonId: '',
    deadlineHours: '',
    penaltyType: PenaltyType.FixedFee,
    penaltyValue: '',
    autoRefund: true,
    status: 'Active' as 'Active' | 'Inactive',
  })

  const [overbookingForm, setOverbookingForm] = useState({
    name: '',
    maxOverbookingPercent: '',
    conditions: '',
    requiresGuarantee: true,
    guaranteeType: 'PreAuthorization' as 'PreAuthorization' | 'AdvancePayment',
    applicableSeasons: [] as string[],
    status: 'Active' as 'Active' | 'Inactive',
  })

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalPolicies = hotelPolicies.length
    const activePolicies = hotelPolicies.filter(p => p.status === 'Active').length
    const totalCancellationPolicies = cancellationPolicies.length
    const activeCancellationPolicies = cancellationPolicies.filter(p => p.status === 'Active').length

    return {
      totalPolicies,
      activePolicies,
      totalCancellationPolicies,
      activeCancellationPolicies,
    }
  }, [hotelPolicies, cancellationPolicies])

  // Filter policies
  const filteredPolicies = useMemo(() => {
    return hotelPolicies.filter(policy => {
      const matchesSearch = 
        policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = typeFilter === 'All' || policy.type === typeFilter
      return matchesSearch && matchesType
    })
  }, [hotelPolicies, searchTerm, typeFilter])

  const handleCreatePolicy = () => {
    const newPolicy: HotelPolicy = {
      id: `POL${hotelPolicies.length + 1}`,
      type: policyForm.type,
      title: policyForm.title,
      description: policyForm.description,
      rules: policyForm.rules.split('\n').filter(r => r.trim()),
      status: policyForm.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setHotelPolicies([...hotelPolicies, newPolicy])
    setIsPolicyModalOpen(false)
    setPolicyForm({
      type: PolicyType.CheckInOut,
      title: '',
      description: '',
      rules: '',
      status: 'Active',
    })
  }

  const handleCreateCancellationPolicy = () => {
    const newPolicy: CancellationPolicy = {
      id: `CAN${cancellationPolicies.length + 1}`,
      name: cancellationForm.name,
      channelId: cancellationForm.channelId || undefined,
      seasonId: cancellationForm.seasonId || undefined,
      deadlineHours: parseInt(cancellationForm.deadlineHours),
      penaltyType: cancellationForm.penaltyType,
      penaltyValue: parseFloat(cancellationForm.penaltyValue),
      autoRefund: cancellationForm.autoRefund,
      status: cancellationForm.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setCancellationPolicies([...cancellationPolicies, newPolicy])
    setIsCancellationModalOpen(false)
    setCancellationForm({
      name: '',
      channelId: '',
      seasonId: '',
      deadlineHours: '',
      penaltyType: PenaltyType.FixedFee,
      penaltyValue: '',
      autoRefund: true,
      status: 'Active',
    })
  }

  const handleCreateOverbookingPolicy = () => {
    const newPolicy: OverbookingPolicy = {
      id: `OVB${overbookingPolicies.length + 1}`,
      name: overbookingForm.name,
      maxOverbookingPercent: parseFloat(overbookingForm.maxOverbookingPercent),
      conditions: overbookingForm.conditions.split('\n').filter(c => c.trim()),
      requiresGuarantee: overbookingForm.requiresGuarantee,
      guaranteeType: overbookingForm.requiresGuarantee ? overbookingForm.guaranteeType : undefined,
      applicableSeasons: overbookingForm.applicableSeasons.length > 0 ? overbookingForm.applicableSeasons : undefined,
      status: overbookingForm.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setOverbookingPolicies([...overbookingPolicies, newPolicy])
    setIsOverbookingModalOpen(false)
    setOverbookingForm({
      name: '',
      maxOverbookingPercent: '',
      conditions: '',
      requiresGuarantee: true,
      guaranteeType: 'PreAuthorization',
      applicableSeasons: [],
      status: 'Active',
    })
  }

  const hotelPolicyColumns = [
    {
      key: 'title',
      header: 'Policy Title',
      render: (policy: HotelPolicy) => (
        <div>
          <div className="font-medium">{policy.title}</div>
          <Badge variant="outline" className="mt-1">{policy.type}</Badge>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (policy: HotelPolicy) => (
        <span className="text-sm text-textSecondary">{policy.description}</span>
      ),
    },
    {
      key: 'rules',
      header: 'Rules Count',
      render: (policy: HotelPolicy) => (
        <span className="text-sm">{policy.rules.length} rules</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (policy: HotelPolicy) => (
        <Badge variant={policy.status === 'Active' ? 'success' : 'outline'}>
          {policy.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (policy: HotelPolicy) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedPolicy(policy)
              setPolicyForm({
                type: policy.type,
                title: policy.title,
                description: policy.description,
                rules: policy.rules.join('\n'),
                status: policy.status,
              })
              setIsPolicyModalOpen(true)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const cancellationPolicyColumns = [
    {
      key: 'name',
      header: 'Policy Name',
      render: (policy: CancellationPolicy) => <span className="font-medium">{policy.name}</span>,
    },
    {
      key: 'deadline',
      header: 'Deadline',
      render: (policy: CancellationPolicy) => (
        <span className="text-sm">{policy.deadlineHours} hours before arrival</span>
      ),
    },
    {
      key: 'penalty',
      header: 'Penalty',
      render: (policy: CancellationPolicy) => (
        <div>
          {policy.penaltyType === PenaltyType.Percentage ? (
            <span className="text-sm">{policy.penaltyValue}% of booking</span>
          ) : policy.penaltyType === PenaltyType.FixedFee ? (
            <span className="text-sm">${policy.penaltyValue} fixed fee</span>
          ) : (
            <span className="text-sm">First night charge</span>
          )}
        </div>
      ),
    },
    {
      key: 'autoRefund',
      header: 'Auto Refund',
      render: (policy: CancellationPolicy) => (
        <Badge variant={policy.autoRefund ? 'success' : 'outline'}>
          {policy.autoRefund ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (policy: CancellationPolicy) => (
        <Badge variant={policy.status === 'Active' ? 'success' : 'outline'}>
          {policy.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (policy: CancellationPolicy) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCancellation(policy)
              setCancellationForm({
                name: policy.name,
                channelId: policy.channelId || '',
                seasonId: policy.seasonId || '',
                deadlineHours: policy.deadlineHours.toString(),
                penaltyType: policy.penaltyType,
                penaltyValue: policy.penaltyValue.toString(),
                autoRefund: policy.autoRefund,
                status: policy.status,
              })
              setIsCancellationModalOpen(true)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const overbookingPolicyColumns = [
    {
      key: 'name',
      header: 'Policy Name',
      render: (policy: OverbookingPolicy) => <span className="font-medium">{policy.name}</span>,
    },
    {
      key: 'maxOverbooking',
      header: 'Max Overbooking',
      render: (policy: OverbookingPolicy) => (
        <span className="text-sm">{policy.maxOverbookingPercent}%</span>
      ),
    },
    {
      key: 'guarantee',
      header: 'Guarantee Required',
      render: (policy: OverbookingPolicy) => (
        <div>
          {policy.requiresGuarantee ? (
            <Badge variant="outline">{policy.guaranteeType}</Badge>
          ) : (
            <span className="text-sm text-textSecondary">No</span>
          )}
        </div>
      ),
    },
    {
      key: 'conditions',
      header: 'Conditions',
      render: (policy: OverbookingPolicy) => (
        <span className="text-sm">{policy.conditions.length} conditions</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (policy: OverbookingPolicy) => (
        <Badge variant={policy.status === 'Active' ? 'success' : 'outline'}>
          {policy.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (policy: OverbookingPolicy) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedOverbooking(policy)
              setOverbookingForm({
                name: policy.name,
                maxOverbookingPercent: policy.maxOverbookingPercent.toString(),
                conditions: policy.conditions.join('\n'),
                requiresGuarantee: policy.requiresGuarantee,
                guaranteeType: policy.guaranteeType || 'PreAuthorization',
                applicableSeasons: policy.applicableSeasons || [],
                status: policy.status,
              })
              setIsOverbookingModalOpen(true)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 animate-fadeIn">
        <h2 className="text-3xl font-bold text-text">Policies & Regulations</h2>
        <div className="flex gap-3">
          <Button variant="outline" icon={Download}>
            Export
          </Button>
          {activeTab === 'hotel' && (
            <Button variant="primary" icon={Plus} onClick={() => {
              setSelectedPolicy(null)
              setPolicyForm({
                type: PolicyType.CheckInOut,
                title: '',
                description: '',
                rules: '',
                status: 'Active',
              })
              setIsPolicyModalOpen(true)
            }}>
              Add Policy
            </Button>
          )}
          {activeTab === 'cancellation' && (
            <Button variant="primary" icon={Plus} onClick={() => {
              setSelectedCancellation(null)
              setCancellationForm({
                name: '',
                channelId: '',
                seasonId: '',
                deadlineHours: '',
                penaltyType: PenaltyType.FixedFee,
                penaltyValue: '',
                autoRefund: true,
                status: 'Active',
              })
              setIsCancellationModalOpen(true)
            }}>
              Add Cancellation Policy
            </Button>
          )}
          {activeTab === 'overbooking' && (
            <Button variant="primary" icon={Plus} onClick={() => {
              setSelectedOverbooking(null)
              setOverbookingForm({
                name: '',
                maxOverbookingPercent: '',
                conditions: '',
                requiresGuarantee: true,
                guaranteeType: 'PreAuthorization',
                applicableSeasons: [],
                status: 'Active',
              })
              setIsOverbookingModalOpen(true)
            }}>
              Add Overbooking Policy
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardWidget 
          metric={{
            title: 'Total Policies',
            value: kpis.totalPolicies,
            icon: FileText,
            colorClass: 'text-primary',
          }}
        />
        <DashboardWidget 
          metric={{
            title: 'Active Policies',
            value: kpis.activePolicies,
            icon: ShieldCheck,
            colorClass: 'text-success',
          }}
        />
        <DashboardWidget 
          metric={{
            title: 'Cancellation Policies',
            value: kpis.totalCancellationPolicies,
            icon: AlertTriangle,
            colorClass: 'text-secondary',
          }}
        />
        <DashboardWidget 
          metric={{
            title: 'Active Cancellation',
            value: kpis.activeCancellationPolicies,
            icon: Settings,
            colorClass: 'text-blue-500',
          }}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab('hotel')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'hotel'
              ? 'text-primary border-b-2 border-primary'
              : 'text-textSecondary hover:text-text'
          }`}
        >
          Hotel Policies ({hotelPolicies.length})
        </button>
        <button
          onClick={() => setActiveTab('cancellation')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'cancellation'
              ? 'text-primary border-b-2 border-primary'
              : 'text-textSecondary hover:text-text'
          }`}
        >
          Cancellation Policies ({cancellationPolicies.length})
        </button>
        <button
          onClick={() => setActiveTab('overbooking')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'overbooking'
              ? 'text-primary border-b-2 border-primary'
              : 'text-textSecondary hover:text-text'
          }`}
        >
          Overbooking Policies ({overbookingPolicies.length})
        </button>
      </div>

      {/* Filters for Hotel Policies */}
      {activeTab === 'hotel' && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search policies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          <select
            className="px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as PolicyType | 'All')}
          >
            <option value="All">All Types</option>
            {Object.values(PolicyType).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      )}

      {/* Hotel Policies Table */}
      {activeTab === 'hotel' && (
        <Table<HotelPolicy>
          data={filteredPolicies}
          columns={hotelPolicyColumns}
          emptyMessage="No policies found."
        />
      )}

      {/* Cancellation Policies Table */}
      {activeTab === 'cancellation' && (
        <Table<CancellationPolicy>
          data={cancellationPolicies}
          columns={cancellationPolicyColumns}
          emptyMessage="No cancellation policies found."
        />
      )}

      {/* Overbooking Policies Table */}
      {activeTab === 'overbooking' && (
        <Table<OverbookingPolicy>
          data={overbookingPolicies}
          columns={overbookingPolicyColumns}
          emptyMessage="No overbooking policies found."
        />
      )}

      {/* Hotel Policy Modal */}
      <Modal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        title={selectedPolicy ? 'Edit Policy' : 'Add Policy'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">Policy Type</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={policyForm.type}
              onChange={(e) => setPolicyForm({ ...policyForm, type: e.target.value as PolicyType })}
            >
              {Object.values(PolicyType).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <FormField
            label="Policy Title"
            type="text"
            value={policyForm.title}
            onChange={(e) => setPolicyForm({ ...policyForm, title: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">Description</label>
            <textarea
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary"
              value={policyForm.description}
              onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">Rules (one per line)</label>
            <textarea
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary"
              value={policyForm.rules}
              onChange={(e) => setPolicyForm({ ...policyForm, rules: e.target.value })}
              rows={5}
              placeholder="Enter each rule on a new line"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">Status</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={policyForm.status}
              onChange={(e) => setPolicyForm({ ...policyForm, status: e.target.value as 'Active' | 'Inactive' })}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsPolicyModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreatePolicy}
              disabled={!policyForm.title || !policyForm.description || !policyForm.rules}
            >
              {selectedPolicy ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancellation Policy Modal */}
      <Modal
        isOpen={isCancellationModalOpen}
        onClose={() => setIsCancellationModalOpen(false)}
        title={selectedCancellation ? 'Edit Cancellation Policy' : 'Add Cancellation Policy'}
      >
        <div className="space-y-4">
          <FormField
            label="Policy Name"
            type="text"
            value={cancellationForm.name}
            onChange={(e) => setCancellationForm({ ...cancellationForm, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-2">Channel (Optional)</label>
              <select
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
                value={cancellationForm.channelId}
                onChange={(e) => setCancellationForm({ ...cancellationForm, channelId: e.target.value })}
              >
                <option value="">None</option>
                {MOCK_CHANNELS.map(channel => (
                  <option key={channel.id} value={channel.id}>{channel.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-2">Season (Optional)</label>
              <select
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
                value={cancellationForm.seasonId}
                onChange={(e) => setCancellationForm({ ...cancellationForm, seasonId: e.target.value })}
              >
                <option value="">None</option>
                {MOCK_SEASONS.map(season => (
                  <option key={season.id} value={season.id}>{season.name}</option>
                ))}
              </select>
            </div>
          </div>
          <FormField
            label="Deadline (hours before arrival)"
            type="number"
            value={cancellationForm.deadlineHours}
            onChange={(e) => setCancellationForm({ ...cancellationForm, deadlineHours: e.target.value })}
            required
            min="0"
          />
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">Penalty Type</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={cancellationForm.penaltyType}
              onChange={(e) => setCancellationForm({ ...cancellationForm, penaltyType: e.target.value as PenaltyType })}
            >
              {Object.values(PenaltyType).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <FormField
            label={cancellationForm.penaltyType === PenaltyType.Percentage ? 'Penalty Value (%)' : 'Penalty Value ($)'}
            type="number"
            value={cancellationForm.penaltyValue}
            onChange={(e) => setCancellationForm({ ...cancellationForm, penaltyValue: e.target.value })}
            required
            min="0"
            step={cancellationForm.penaltyType === PenaltyType.Percentage ? '0.1' : '0.01'}
          />
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="autoRefund"
              checked={cancellationForm.autoRefund}
              onChange={(e) => setCancellationForm({ ...cancellationForm, autoRefund: e.target.checked })}
              className="w-4 h-4 rounded border-border"
            />
            <label htmlFor="autoRefund" className="text-sm font-medium text-text">
              Auto Refund
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">Status</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={cancellationForm.status}
              onChange={(e) => setCancellationForm({ ...cancellationForm, status: e.target.value as 'Active' | 'Inactive' })}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsCancellationModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateCancellationPolicy}
              disabled={!cancellationForm.name || !cancellationForm.deadlineHours || !cancellationForm.penaltyValue}
            >
              {selectedCancellation ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Overbooking Policy Modal */}
      <Modal
        isOpen={isOverbookingModalOpen}
        onClose={() => setIsOverbookingModalOpen(false)}
        title={selectedOverbooking ? 'Edit Overbooking Policy' : 'Add Overbooking Policy'}
      >
        <div className="space-y-4">
          <FormField
            label="Policy Name"
            type="text"
            value={overbookingForm.name}
            onChange={(e) => setOverbookingForm({ ...overbookingForm, name: e.target.value })}
            required
          />
          <FormField
            label="Max Overbooking Percentage"
            type="number"
            value={overbookingForm.maxOverbookingPercent}
            onChange={(e) => setOverbookingForm({ ...overbookingForm, maxOverbookingPercent: e.target.value })}
            required
            min="0"
            max="100"
            step="0.1"
          />
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">Conditions (one per line)</label>
            <textarea
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary"
              value={overbookingForm.conditions}
              onChange={(e) => setOverbookingForm({ ...overbookingForm, conditions: e.target.value })}
              rows={4}
              placeholder="Enter each condition on a new line"
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="requiresGuarantee"
              checked={overbookingForm.requiresGuarantee}
              onChange={(e) => setOverbookingForm({ ...overbookingForm, requiresGuarantee: e.target.checked })}
              className="w-4 h-4 rounded border-border"
            />
            <label htmlFor="requiresGuarantee" className="text-sm font-medium text-text">
              Requires Guarantee
            </label>
          </div>
          {overbookingForm.requiresGuarantee && (
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-2">Guarantee Type</label>
              <select
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
                value={overbookingForm.guaranteeType}
                onChange={(e) => setOverbookingForm({ ...overbookingForm, guaranteeType: e.target.value as 'PreAuthorization' | 'AdvancePayment' })}
              >
                <option value="PreAuthorization">Pre-Authorization</option>
                <option value="AdvancePayment">Advance Payment</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">Applicable Seasons (Optional)</label>
            <div className="space-y-2">
              {MOCK_SEASONS.map(season => (
                <div key={season.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`season-${season.id}`}
                    checked={overbookingForm.applicableSeasons.includes(season.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setOverbookingForm({
                          ...overbookingForm,
                          applicableSeasons: [...overbookingForm.applicableSeasons, season.id]
                        })
                      } else {
                        setOverbookingForm({
                          ...overbookingForm,
                          applicableSeasons: overbookingForm.applicableSeasons.filter(id => id !== season.id)
                        })
                      }
                    }}
                    className="w-4 h-4 rounded border-border"
                  />
                  <label htmlFor={`season-${season.id}`} className="text-sm text-text">
                    {season.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">Status</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={overbookingForm.status}
              onChange={(e) => setOverbookingForm({ ...overbookingForm, status: e.target.value as 'Active' | 'Inactive' })}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsOverbookingModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateOverbookingPolicy}
              disabled={!overbookingForm.name || !overbookingForm.maxOverbookingPercent || !overbookingForm.conditions}
            >
              {selectedOverbooking ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default PoliciesPage


