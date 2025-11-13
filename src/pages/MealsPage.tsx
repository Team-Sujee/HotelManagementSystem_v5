import React, { useMemo, useState } from 'react'
import { MealPlan, MealPlanCode, RateAdjustmentType, Room, Reservation } from '../types'
import { useMealPlansStore } from '../store/mealPlansStore'
import { useRoomsStore } from '../store/roomsStore'
import Table from '../components/molecules/Table'
import Button from '../components/atoms/Button'
import Input from '../components/atoms/Input'
import Badge from '../components/atoms/Badge'
import Card from '../components/atoms/Card'
import Modal from '../components/molecules/Modal'
import FormField from '../components/molecules/FormField'
import DashboardWidget from '../components/organisms/DashboardWidget'
import { Plus, Search, Filter, TrendingUp, PieChart, CheckCircle, Ban, Pencil, Trash2, RefreshCcw, UtensilsCrossed, ClipboardList, BarChart3 } from 'lucide-react'
import { MOCK_RESERVATIONS } from '../constants'

type StatusFilter = 'All' | 'Active' | 'Inactive'

interface MealPlanFormState {
  code: string
  name: string
  description: string
  markupType: RateAdjustmentType
  markupValue: string
  defaultForRoomTypes: string[]
  notes: string
  active: boolean
}

const defaultFormState: MealPlanFormState = {
  code: MealPlanCode.RO,
  name: 'Room Only',
  description: '',
  markupType: 'Flat',
  markupValue: '0',
  defaultForRoomTypes: [],
  notes: '',
  active: true,
}

const MealsPage: React.FC = () => {
  const mealPlans = useMealPlansStore((state) => state.mealPlans)
  const listMealPlans = useMealPlansStore((state) => state.list)
  const createMealPlan = useMealPlansStore((state) => state.create)
  const updateMealPlan = useMealPlansStore((state) => state.update)
  const removeMealPlan = useMealPlansStore((state) => state.remove)
  const toggleMealPlanActive = useMealPlansStore((state) => state.toggleActive)
  const rooms = useRoomsStore((state) => state.rooms.filter((room) => room.active !== false))
  const updateRoom = useRoomsStore((state) => state.update)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [markupFilter, setMarkupFilter] = useState<RateAdjustmentType | 'All'>('All')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [editingOriginalCode, setEditingOriginalCode] = useState<MealPlanCode | null>(null)
  const [form, setForm] = useState<MealPlanFormState>(defaultFormState)

  const availableRoomTypes = useMemo(
    () => Array.from(new Set(rooms.map((room) => room.type))).sort(),
    [rooms]
  )

  const reservations: Reservation[] = MOCK_RESERVATIONS

  const filteredPlans = useMemo(() => {
    const base = listMealPlans({
      search: searchTerm || undefined,
      active: statusFilter === 'All' ? undefined : statusFilter === 'Active',
    })
    return markupFilter === 'All' ? base : base.filter((plan) => plan.markupType === markupFilter)
  }, [listMealPlans, searchTerm, statusFilter, markupFilter, mealPlans])

  const mealPlanUsage = useMemo(() => {
    const usage = new Map<string, { rooms: Room[]; uplift: number }>()
    rooms.forEach((room) => {
      if (!room.mealPlanCode) return
      const plan = mealPlans.find((p) => p.code === room.mealPlanCode)
      const uplift = plan
        ? plan.markupType === 'Percentage'
          ? (room.price * plan.markupValue) / 100
          : plan.markupValue
        : 0
      const entry = usage.get(room.mealPlanCode) ?? { rooms: [], uplift: 0 }
      entry.rooms.push(room)
      entry.uplift += uplift
      usage.set(room.mealPlanCode, entry)
    })
    return usage
  }, [rooms, mealPlans])

  const reservationMealStats = useMemo(() => {
    const stats = new Map<string, { bookings: number; revenue: number; uplift: number }>()
    reservations.forEach((reservation) => {
      const code = reservation.mealPlanCode || MealPlanCode.RO
      const plan = mealPlans.find((p) => p.code === code)
      const uplift =
        plan?.markupType === 'Percentage'
          ? (reservation.baseRate * plan.markupValue) / 100
          : plan?.markupValue ?? 0
      const entry = stats.get(code) ?? { bookings: 0, revenue: 0, uplift: 0 }
      entry.bookings += 1
      entry.revenue += reservation.totalAmount
      entry.uplift += uplift
      stats.set(code, entry)
    })

    return mealPlans.map((plan) => {
      const entry = stats.get(plan.code) ?? { bookings: 0, revenue: 0, uplift: 0 }
      return {
        code: plan.code,
        name: plan.name,
        bookings: entry.bookings,
        revenue: entry.revenue,
        uplift: entry.uplift,
      }
    })
  }, [reservations, mealPlans])

  const totalProjectedUplift = useMemo(() => {
    return Array.from(mealPlanUsage.values()).reduce((sum, entry) => sum + entry.uplift, 0)
  }, [mealPlanUsage])

  const assignedRoomsCount = useMemo(
    () => Array.from(mealPlanUsage.values()).reduce((sum, entry) => sum + entry.rooms.length, 0),
    [mealPlanUsage]
  )

  const activePlansCount = useMemo(
    () => mealPlans.filter((plan) => plan.active).length,
    [mealPlans]
  )

  const averageMarkup = useMemo(() => {
    if (mealPlans.length === 0) return 0
    const normalized = mealPlans.map((plan) =>
      plan.markupType === 'Percentage' ? plan.markupValue : (plan.markupValue / 200) * 100
    )
    return normalized.reduce((sum, value) => sum + value, 0) / normalized.length
  }, [mealPlans])

  const handleResetFilters = () => {
    setSearchTerm('')
    setStatusFilter('All')
    setMarkupFilter('All')
  }

  const handleOpenCreate = () => {
    setModalMode('create')
    setEditingPlanId(null)
    setEditingOriginalCode(null)
    setForm({
      ...defaultFormState,
      code: Object.values(MealPlanCode).find(
        (code) => !mealPlans.some((plan) => plan.code === code)
      ) || MealPlanCode.RO,
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (plan: MealPlan) => {
    setModalMode('edit')
    setEditingPlanId(plan.id)
    setEditingOriginalCode(plan.code)
    setForm({
      code: plan.code,
      name: plan.name,
      description: plan.description,
      markupType: plan.markupType,
      markupValue: plan.markupValue.toString(),
      defaultForRoomTypes: plan.defaultForRoomTypes ?? [],
      notes: plan.notes ?? '',
      active: plan.active,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = () => {
    if (!form.name.trim()) {
      alert('Meal plan name is required')
      return
    }
    if (!form.code.trim()) {
      alert('Meal plan code is required')
      return
    }
    const normalizedCode = form.code.trim().toUpperCase() as MealPlanCode
    const markupValueNumber = Number(form.markupValue)
    if (Number.isNaN(markupValueNumber) || markupValueNumber < 0) {
      alert('Markup value must be a positive number')
      return
    }
    if (
      modalMode === 'create' &&
      mealPlans.some((plan) => plan.code === normalizedCode)
    ) {
      alert('A meal plan with this code already exists')
      return
    }
    const payload: Omit<MealPlan, 'id' | 'createdAt' | 'updatedAt'> = {
      code: normalizedCode,
      name: form.name.trim(),
      description: form.description.trim(),
      markupType: form.markupType,
      markupValue: markupValueNumber,
      active: form.active,
      defaultForRoomTypes: form.defaultForRoomTypes,
      notes: form.notes.trim(),
    }
    if (modalMode === 'create') {
      createMealPlan(payload)
    } else if (modalMode === 'edit' && editingPlanId) {
      const originalCode = editingOriginalCode
      updateMealPlan(editingPlanId, payload)
      if (originalCode && originalCode !== normalizedCode) {
        rooms
          .filter((room) => room.mealPlanCode === originalCode)
          .forEach((room) => updateRoom(room.id, { mealPlanCode: normalizedCode }))
      }
    }
    setIsModalOpen(false)
  }

  const handleDelete = (plan: MealPlan) => {
    const usage = mealPlanUsage.get(plan.code)
    const message = usage?.rooms.length
      ? `This meal plan is assigned to ${usage.rooms.length} rooms. Removing it will clear their meal plan. Continue?`
      : 'Are you sure you want to delete this meal plan?'
    if (!window.confirm(message)) return
    removeMealPlan(plan.id)
    usage?.rooms.forEach((room) => updateRoom(room.id, { mealPlanCode: undefined }))
  }

  const handleApplyDefaults = (plan: MealPlan) => {
    if (!plan.defaultForRoomTypes || plan.defaultForRoomTypes.length === 0) {
      alert('Set default room types before applying.')
      return
    }
    const affectedRooms = rooms.filter((room) => plan.defaultForRoomTypes?.includes(room.type))
    if (affectedRooms.length === 0) {
      alert('No rooms match the configured default room types.')
      return
    }
    if (
      !window.confirm(
        `Assign meal plan ${plan.name} to ${affectedRooms.length} rooms matching the default room types?`
      )
    ) {
      return
    }
    affectedRooms.forEach((room) => updateRoom(room.id, { mealPlanCode: plan.code }))
  }

  const renderDefaultRoomTypeCheckboxes = () => (
    <div>
      <label className="block text-sm font-medium text-text mb-2">Default Room Types</label>
      <div className="flex flex-wrap gap-2">
        {availableRoomTypes.length === 0 && (
          <span className="text-sm text-textSecondary">No room types available</span>
        )}
        {availableRoomTypes.map((roomType) => {
          const checked = form.defaultForRoomTypes.includes(roomType)
          return (
            <label
              key={roomType}
              className={`flex items-center gap-2 px-3 py-2 border rounded-xl cursor-pointer ${
                checked ? 'border-primary bg-primary/5' : 'border-border bg-surface'
              }`}
            >
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={checked}
                onChange={() => {
                  setForm((prev) => ({
                    ...prev,
                    defaultForRoomTypes: checked
                      ? prev.defaultForRoomTypes.filter((value) => value !== roomType)
                      : [...prev.defaultForRoomTypes, roomType],
                  }))
                }}
              />
              <span className="text-sm text-text">{roomType}</span>
            </label>
          )
        })}
      </div>
    </div>
  )

  const mealPlanColumns = [
    {
      key: 'code',
      header: 'Code',
      render: (plan: MealPlan) => (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{plan.code}</Badge>
          {!plan.active && <Badge variant="outline">Inactive</Badge>}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Meal Plan',
      render: (plan: MealPlan) => (
        <div>
          <div className="font-semibold text-text">{plan.name}</div>
          <div className="text-sm text-textSecondary">{plan.description}</div>
        </div>
      ),
    },
    {
      key: 'markup',
      header: 'Markup',
      render: (plan: MealPlan) => (
        <div className="text-sm font-medium text-text">
          {plan.markupType === 'Percentage'
            ? `${plan.markupValue}%`
            : `$${plan.markupValue.toFixed(2)}`}
        </div>
      ),
    },
    {
      key: 'defaults',
      header: 'Default Room Types',
      render: (plan: MealPlan) => (
        <div className="flex flex-wrap gap-2">
          {(plan.defaultForRoomTypes ?? []).length === 0 && (
            <span className="text-sm text-textSecondary">Not assigned</span>
          )}
          {(plan.defaultForRoomTypes ?? []).map((roomType) => (
            <Badge key={roomType} variant="outline">
              {roomType}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'usage',
      header: 'Rooms Assigned',
      render: (plan: MealPlan) => {
        const usage = mealPlanUsage.get(plan.code)
        return (
          <div className="text-sm">
            <span className="font-semibold text-text">{usage?.rooms.length ?? 0}</span>{' '}
            <span className="text-textSecondary">rooms</span>
            {usage && usage.uplift > 0 && (
              <div className="text-xs text-success">
                +${usage.uplift.toFixed(2)} nightly uplift
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      render: (plan: MealPlan) => (
        <span className="text-sm text-textSecondary">
          {new Date(plan.updatedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (plan: MealPlan) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => handleOpenEdit(plan)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleMealPlanActive(plan.id)}
          >
            {plan.active ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleApplyDefaults(plan)}
            disabled={!plan.defaultForRoomTypes || plan.defaultForRoomTypes.length === 0}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(plan)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const reservationColumns = [
    {
      key: 'code',
      header: 'Meal Plan',
      render: (row: { code: MealPlanCode; name: string }) => (
        <div className="flex items-center gap-2">
          <Badge variant="outline">{row.code}</Badge>
          <span className="font-medium text-text">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'bookings',
      header: 'Bookings',
      render: (row: { bookings: number }) => <span className="text-sm">{row.bookings}</span>,
    },
    {
      key: 'revenue',
      header: 'Recorded Revenue',
      render: (row: { revenue: number }) => (
        <span className="text-sm font-medium text-text">${row.revenue.toFixed(2)}</span>
      ),
    },
    {
      key: 'uplift',
      header: 'Estimated Uplift',
      render: (row: { uplift: number }) => (
        <span className="text-sm text-success">+${row.uplift.toFixed(2)}</span>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6 animate-fadeIn">
        <h2 className="text-3xl font-bold text-text">Meal Plan Configuration</h2>
        <div className="flex gap-2">
          <Button variant="outline" icon={RefreshCcw} onClick={handleResetFilters}>
            Reset Filters
          </Button>
          <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
            New Meal Plan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <DashboardWidget
          metric={{
            title: 'Total Meal Plans',
            value: mealPlans.length,
            icon: UtensilsCrossed,
            colorClass: 'text-primary',
          }}
        />
        <DashboardWidget
          metric={{
            title: 'Active Plans',
            value: activePlansCount,
            icon: CheckCircle,
            colorClass: 'text-success',
          }}
        />
        <DashboardWidget
          metric={{
            title: 'Rooms Assigned',
            value: assignedRoomsCount,
            icon: ClipboardList,
            colorClass: 'text-secondary',
          }}
        />
        <DashboardWidget
          metric={{
            title: 'Projected Nightly Uplift',
            value: `$${totalProjectedUplift.toFixed(2)}`,
            icon: TrendingUp,
            colorClass: 'text-success',
          }}
        />
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Search meal plans"
            placeholder="Search by code or name"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            icon={Search}
          />
          <div>
            <label className="block text-sm font-medium text-text mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Markup Type</label>
            <select
              value={markupFilter}
              onChange={(event) =>
                setMarkupFilter(event.target.value === 'All' ? 'All' : (event.target.value as RateAdjustmentType))
              }
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
            >
              <option value="All">All Types</option>
              <option value="Flat">Flat Amount</option>
              <option value="Percentage">Percentage</option>
            </select>
          </div>
          <Card className="bg-background border-dashed border-border/60 p-3 flex items-center gap-3">
            <PieChart className="h-6 w-6 text-primary" />
            <div>
              <div className="text-xs uppercase tracking-wide text-textSecondary">Average Markup</div>
              <div className="text-lg font-semibold text-text">{averageMarkup.toFixed(1)}%</div>
            </div>
          </Card>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text flex items-center gap-2">
            <Filter className="h-5 w-5" /> Meal Plan Catalogue
          </h3>
          <span className="text-sm text-textSecondary">{filteredPlans.length} plans</span>
        </div>
        <Table<MealPlan> data={filteredPlans} columns={mealPlanColumns} />
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Booking & Revenue by Meal Type
          </h3>
          <span className="text-sm text-textSecondary">Derived from current reservations</span>
        </div>
        <Table data={reservationMealStats} columns={reservationColumns} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${modalMode === 'create' ? 'Create' : 'Update'} Meal Plan`}
      >
        <div className="space-y-4">
          <FormField
            label="Meal Plan Code"
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
            maxLength={4}
            placeholder="e.g., RO, BB, HB"
          />
          <FormField
            label="Meal Plan Name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-text mb-2">Description</label>
            <textarea
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              rows={3}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Describe what is included in this meal plan"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Markup Type</label>
              <select
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                value={form.markupType}
                onChange={(event) =>
                  setForm({ ...form, markupType: event.target.value as RateAdjustmentType })
                }
              >
                <option value="Flat">Flat Amount</option>
                <option value="Percentage">Percentage</option>
              </select>
            </div>
            <FormField
              label={form.markupType === 'Percentage' ? 'Markup Percentage' : 'Markup Amount'}
              type="number"
              min={0}
              step={form.markupType === 'Percentage' ? '1' : '0.01'}
              value={form.markupValue}
              onChange={(event) => setForm({ ...form, markupValue: event.target.value })}
            />
          </div>
          {renderDefaultRoomTypeCheckboxes()}
          <div>
            <label className="block text-sm font-medium text-text mb-2">Internal Notes</label>
            <textarea
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              rows={3}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="Notes shown to staff during reservation or invoicing"
            />
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => setForm({ ...form, active: event.target.checked })}
              className="h-4 w-4"
            />
            <span className="text-sm text-text">Mark as active</span>
          </label>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" icon={CheckCircle} onClick={handleSubmit}>
            {modalMode === 'create' ? 'Create Plan' : 'Save Changes'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default MealsPage


