import React, { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  Layers3,
  Loader2,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react'
import Card from '../components/atoms/Card'
import Button from '../components/atoms/Button'
import Input from '../components/atoms/Input'
import Modal from '../components/molecules/Modal'
import FormField from '../components/molecules/FormField'
import Table from '../components/molecules/Table'
import Badge from '../components/atoms/Badge'
import {
  EventFinancials,
  EventPaymentStatus,
  EventType,
  Hall,
  HotelEvent,
  EventPackage,
} from '../types'
import { useHallsStore } from '../store/hallsStore'
import { useEventsStore } from '../store/eventsStore'
import { useEventPackagesStore } from '../store/eventPackagesStore'
import { MOCK_GUESTS } from '../constants'

type EventsSection =
  | 'dashboard'
  | 'events'
  | 'halls'
  | 'packages'
  | 'reports'
  | 'notifications'

type EventFormState = {
  name: string
  type: EventType
  date: string
  endDate: string
  hallIds: string[]
  guestId: string
  clientName: string
  expectedAttendees: number
  actualAttendees?: number
  packageId?: string
  decorationType?: string
  cateringRequirements?: string
  equipmentNeeds: string
  notes?: string
}

type HallFormState = {
  name: string
  capacity: number
  location: string
  hallType: Hall['hallType']
  basePrice: number
  pricingUnit: Hall['pricingUnit']
  facilities: string
  status: Hall['status']
}

type PackageFormState = {
  name: string
  description: string
  basePrice: number
  taxRate: number
  duration: EventPackage['duration']
  includedServices: string
  recommendedFor: EventType[]
  addons: string
  active: boolean
}

type HallWithAnalytics = Hall & {
  occupancyRate?: number
  maintenanceCount?: number
  revenueGenerated?: number
  upcomingEvents?: number
}

type EventNotification = {
  id: string
  title: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  icon: React.ElementType
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const eventStatusVariant: Record<HotelEvent['status'], 'secondary' | 'primary' | 'success' | 'outline' | 'error'> =
  {
    Scheduled: 'secondary',
    'In Progress': 'primary',
    Completed: 'success',
    Cancelled: 'outline',
  }

const paymentStatusVariant: Record<EventPaymentStatus, 'secondary' | 'primary' | 'success' | 'outline' | 'error'> = {
  Pending: 'secondary',
  Partial: 'primary',
  Paid: 'success',
  Cancelled: 'outline',
}

const chartPalette = ['#6366F1', '#F97316', '#22C55E', '#38BDF8', '#EAB308', '#BE185D']

const defaultEventFinancials = (): EventFinancials => ({
  baseAmount: 0,
  addonsAmount: 0,
  discountAmount: 0,
  taxRate: 0,
  taxAmount: 0,
  totalAmount: 0,
  currency: 'USD',
  paymentStatus: 'Pending',
})

const EventsPage: React.FC = () => {
  const eventsStore = useEventsStore()
  const hallsStore = useHallsStore()
  const packagesStore = useEventPackagesStore()

  const setHallStatus = hallsStore.setStatus

  const [activeSection, setActiveSection] = useState<EventsSection>('dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<EventType | 'All'>('All')
  const [statusFilter, setStatusFilter] = useState<HotelEvent['status'] | 'All'>('All')
  const [stageFilter, setStageFilter] = useState<'All' | NonNullable<HotelEvent['bookingStage']>>('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [eventModalMode, setEventModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [eventModalStep, setEventModalStep] = useState(0)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)

  const [eventForm, setEventForm] = useState<EventFormState>({
    name: '',
    type: EventType.Conference,
    date: '',
    endDate: '',
    hallIds: [],
    guestId: '',
    clientName: '',
    expectedAttendees: 0,
    equipmentNeeds: '',
  })
  const [eventFinancials, setEventFinancials] = useState<EventFinancials>(defaultEventFinancials)

  const [isHallModalOpen, setIsHallModalOpen] = useState(false)
  const [editingHallId, setEditingHallId] = useState<string | null>(null)
  const [hallForm, setHallForm] = useState<HallFormState>({
    name: '',
    capacity: 0,
    location: '',
    hallType: 'Conference',
    basePrice: 0,
    pricingUnit: 'PerDay',
    facilities: '',
    status: 'Available',
  })

  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false)
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null)
  const [packageForm, setPackageForm] = useState<PackageFormState>({
    name: '',
    description: '',
    basePrice: 0,
    taxRate: 0,
    duration: 'Full-Day',
    includedServices: '',
    recommendedFor: [EventType.Conference],
    addons: '',
    active: true,
  })

  const guests = MOCK_GUESTS
  const halls = hallsStore.list()
  const packages = packagesStore.list()

  const events = useMemo(() => {
    return eventsStore.list({
      search: searchTerm,
      type: typeFilter,
      status: statusFilter,
      dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
    }).filter(event => {
      if (stageFilter === 'All') return true
      return event.bookingStage === stageFilter
    })
  }, [eventsStore, searchTerm, typeFilter, statusFilter, dateFrom, dateTo, stageFilter])

  useEffect(() => {
    const now = new Date()
    halls.forEach(hall => {
      if (hall.status === 'Under Maintenance') {
        return
      }
      const isBooked = events.some(
        event =>
          event.hallIds.includes(hall.id) &&
          event.status !== 'Cancelled' &&
          new Date(event.endDate) >= now
      )
      const desiredStatus = isBooked ? 'Booked' : 'Available'
      if (hall.status !== desiredStatus) {
        setHallStatus(hall.id, desiredStatus)
      }
    })
  }, [events, halls, setHallStatus])

  const dashboardMetrics = useMemo(() => {
    const totalEvents = events.length
    const upcoming = events.filter(event => new Date(event.date) > new Date() && event.status !== 'Cancelled')
      .length
    const ongoing = events.filter(event => event.status === 'In Progress').length
    const completed = events.filter(event => event.status === 'Completed').length
    const totalExpectedAttendees = events.reduce(
      (sum, event) => sum + (event.expectedAttendees || 0),
      0
    )
    const totalActualAttendees = events.reduce(
      (sum, event) => sum + (event.actualAttendees || 0),
      0
    )
    const totalRevenue = events.reduce(
      (sum, event) => sum + (event.financials?.totalAmount || 0),
      0
    )
    const cancelled = events.filter(event => event.status === 'Cancelled').length
    const pendingPayments = events.filter(
      event => event.financials?.paymentStatus && event.financials.paymentStatus !== 'Paid'
    ).length

    return {
      totalEvents,
      upcoming,
      ongoing,
      completed,
      cancelled,
      totalExpectedAttendees,
      totalActualAttendees,
      totalRevenue,
      pendingPayments,
    }
  }, [events])

  const eventsByType = useMemo(() => {
    const counts = Object.values(EventType).map(type => ({
      type,
      value: events.filter(event => event.type === type).length,
    }))
    return counts
  }, [events])

  const revenueTrendData = useMemo(() => {
    const buckets = new Map<string, { name: string; revenue: number; attendees: number }>()
    events.forEach(event => {
      const key = new Date(event.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      const bucket = buckets.get(key) || { name: key, revenue: 0, attendees: 0 }
      bucket.revenue += event.financials?.totalAmount || 0
      bucket.attendees += event.actualAttendees || event.expectedAttendees || 0
      buckets.set(key, bucket)
    })
    return Array.from(buckets.values())
  }, [events])

  const hallUtilization = useMemo<HallWithAnalytics[]>(() => {
    return halls.map<HallWithAnalytics>(hall => {
      const relatedEvents = events.filter(event => event.hallIds.includes(hall.id))
      const totalHoursBooked = relatedEvents.reduce((sum, event) => {
        const start = new Date(event.date).getTime()
        const end = new Date(event.endDate).getTime()
        return sum + Math.max(0, (end - start) / (1000 * 60 * 60))
      }, 0)
      const rangeHours = 30 * 24 // next 30 days snapshot
      const occupancyRate = rangeHours === 0 ? 0 : Math.min(100, (totalHoursBooked / rangeHours) * 100)
      const revenue = relatedEvents.reduce(
        (sum, event) => sum + (event.financials?.totalAmount || 0),
        0
      )
      return {
        ...hall,
        occupancyRate,
        maintenanceCount: hall.maintenanceCount ?? 0,
        revenueGenerated: revenue,
        upcomingEvents: relatedEvents.filter(event => new Date(event.date) > new Date()).length,
      }
    })
  }, [halls, events])

  const notifications = useMemo<EventNotification[]>(() => {
    const now = new Date().getTime()
    const twentyFourHours = 24 * 60 * 60 * 1000
    const upcomingSoon: EventNotification[] = events
      .filter(event => {
        const start = new Date(event.date).getTime()
        return start > now && start - now <= twentyFourHours && event.status !== 'Cancelled'
      })
      .map<EventNotification>(event => ({
        id: `upcoming-${event.id}`,
        title: `Upcoming ${event.type}`,
        message: `${event.name} starts at ${new Date(event.date).toLocaleString()}`,
        severity: 'info',
        icon: Clock3,
      }))

    const pendingPayments: EventNotification[] = events
      .filter(event => event.financials?.paymentStatus === 'Pending')
      .map<EventNotification>(event => ({
        id: `payment-${event.id}`,
        title: 'Payment Pending',
        message: `${event.name} has a pending payment of ${
          currencyFormatter.format(event.financials?.totalAmount || 0)
        }`,
        severity: 'warning',
        icon: AlertTriangle,
      }))

    const maintenanceAlerts: EventNotification[] = halls
      .filter(hall => hall.status === 'Under Maintenance')
      .map<EventNotification>(hall => ({
        id: `maintenance-${hall.id}`,
        title: 'Hall Under Maintenance',
        message: `${hall.name} requires attention before the next event.`,
        severity: 'critical',
        icon: Building2,
      }))

    return [...upcomingSoon, ...pendingPayments, ...maintenanceAlerts]
  }, [events, halls])

  const resetEventForm = () => {
    setEventForm({
      name: '',
      type: EventType.Conference,
      date: '',
      endDate: '',
      hallIds: [],
      guestId: '',
      clientName: '',
      expectedAttendees: 0,
      equipmentNeeds: '',
    })
    setEventFinancials(defaultEventFinancials())
    setEventModalStep(0)
    setEditingEventId(null)
    setEventModalMode('create')
  }

  const openCreateEventModal = () => {
    resetEventForm()
    setIsEventModalOpen(true)
  }

  const openEditEventModal = (event: HotelEvent) => {
    setEventForm({
      name: event.name,
      type: event.type,
      date: event.date ? event.date.slice(0, 16) : '',
      endDate: event.endDate ? event.endDate.slice(0, 16) : '',
      hallIds: event.hallIds,
      guestId: event.guestId || '',
      clientName: event.clientName || '',
      expectedAttendees: event.expectedAttendees || 0,
      actualAttendees: event.actualAttendees,
      packageId: event.packageId,
      decorationType: event.decorationType,
      cateringRequirements: event.cateringRequirements,
      equipmentNeeds: event.equipmentNeeds?.join(', ') || '',
      notes: event.notes,
    })
    setEventFinancials({
      ...defaultEventFinancials(),
      ...event.financials,
    })
    setEventModalMode('edit')
    setEditingEventId(event.id)
    setIsEventModalOpen(true)
    setEventModalStep(0)
  }

  const openViewEventModal = (event: HotelEvent) => {
    openEditEventModal(event)
    setEventModalMode('view')
  }

  const handlePackageSelection = (packageId: string) => {
    setEventForm(prev => ({ ...prev, packageId }))
    if (!packageId) {
      setEventFinancials(defaultEventFinancials())
      return
    }
    const selectedPackage = packagesStore.getById(packageId)
    if (selectedPackage) {
      const recalculated = recalculateFinancials({
        ...eventFinancials,
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        baseAmount: selectedPackage.basePrice,
        taxRate: selectedPackage.taxRate,
      })
      setEventFinancials(recalculated)
    }
  }

  const recalculateFinancials = (state: EventFinancials): EventFinancials => {
    const subtotal = Math.max(0, state.baseAmount + state.addonsAmount - state.discountAmount)
    const taxAmount = subtotal * (state.taxRate / 100)
    const totalAmount = subtotal + taxAmount
    return {
      ...state,
      taxAmount,
      totalAmount,
    }
  }

  const updateFinancialField = (field: keyof EventFinancials, value: number | EventPaymentStatus | string) => {
    setEventFinancials(prev => {
      const nextState = {
        ...prev,
        [field]: value,
      } as EventFinancials
      return recalculateFinancials(nextState)
    })
  }

  const validateHallAvailability = (
    hallIds: string[],
    startIso: string,
    endIso: string,
    excludeEventId?: string
  ) => {
    const newStart = new Date(startIso).getTime()
    const newEnd = new Date(endIso).getTime()

    if (newStart >= newEnd) {
      return { ok: false, reason: 'End time must be after start time.' }
    }

    const hasOverlap = eventsStore
      .list()
      .some(event => {
        if (event.id === excludeEventId || event.status === 'Cancelled') return false
        const overlap =
          event.hallIds.some(id => hallIds.includes(id)) &&
          new Date(event.date).getTime() < newEnd &&
          newStart < new Date(event.endDate).getTime()
        return overlap
      })

    if (hasOverlap) {
      return { ok: false, reason: 'Selected hall(s) overlap with existing bookings.' }
    }

    return { ok: true as const }
  }

  const handleEventSubmit = () => {
    const requiredFields = [eventForm.name, eventForm.date, eventForm.endDate, eventForm.hallIds.length]
    if (requiredFields.some(field => !field)) {
      alert('Please complete required fields in each step before saving the event.')
      return
    }

    const startIso = new Date(eventForm.date).toISOString()
    const endIso = new Date(eventForm.endDate).toISOString()
    const availability = validateHallAvailability(eventForm.hallIds, startIso, endIso, editingEventId || undefined)
    if (!availability.ok) {
      alert(availability.reason)
      return
    }

    const equipmentNeedsArray = eventForm.equipmentNeeds
      ? eventForm.equipmentNeeds.split(',').map(item => item.trim()).filter(Boolean)
      : undefined

    const bookingStage =
      eventFinancials.paymentStatus === 'Paid'
        ? 'Confirmed'
        : eventFinancials.paymentStatus === 'Pending'
        ? 'AwaitingPayment'
        : 'Quotation'

    const recalculatedFinancials = recalculateFinancials({
      ...eventFinancials,
      packageId: eventForm.packageId,
      packageName:
        eventForm.packageId
          ? eventFinancials.packageName ||
            packagesStore.getById(eventForm.packageId)?.name
          : undefined,
    })

    const payload: Omit<HotelEvent, 'id' | 'createdAt'> = {
      name: eventForm.name,
      type: eventForm.type,
      date: startIso,
      endDate: endIso,
      hallIds: eventForm.hallIds,
      services: [],
      guestId: eventForm.guestId || undefined,
      clientName: eventForm.clientName || undefined,
      expectedAttendees: eventForm.expectedAttendees || undefined,
      actualAttendees: eventForm.actualAttendees,
      status: editingEventId ? eventsStore.list().find(e => e.id === editingEventId)?.status || 'Scheduled' : 'Scheduled',
      bookingStage,
      packageId: eventForm.packageId,
      financials: {
        ...recalculatedFinancials,
        proformaInvoiceNumber:
          recalculatedFinancials.proformaInvoiceNumber || generateDocumentNumber('EV-PRO'),
        finalInvoiceNumber:
          recalculatedFinancials.paymentStatus === 'Paid'
            ? recalculatedFinancials.finalInvoiceNumber || generateDocumentNumber('EV-INV')
            : recalculatedFinancials.finalInvoiceNumber,
      },
      decorationType: eventForm.decorationType || undefined,
      cateringRequirements: eventForm.cateringRequirements || undefined,
      equipmentNeeds: equipmentNeedsArray,
      notes: eventForm.notes || undefined,
    }

    if (editingEventId) {
      eventsStore.update(editingEventId, payload)
    } else {
      eventsStore.create(payload)
    }

    resetEventForm()
    setIsEventModalOpen(false)
  }

  const handleCancelEvent = (event: HotelEvent) => {
    eventsStore.update(event.id, { status: 'Cancelled', bookingStage: 'Cancelled' })
    event.hallIds.forEach(hallId => {
      const stillBooked = eventsStore
        .list()
        .some(
          e =>
            e.id !== event.id &&
            e.hallIds.includes(hallId) &&
            e.status !== 'Cancelled' &&
            new Date(e.endDate) >= new Date()
        )
      if (!stillBooked) {
        setHallStatus(hallId, 'Available')
      }
    })
  }

  const generateDocumentNumber = (prefix: string) => {
    const random = Math.floor(Math.random() * 9000) + 1000
    return `${prefix}-${new Date().toISOString().slice(0, 10)}-${random}`
  }

  const openCreateHallModal = () => {
    setHallForm({
      name: '',
      capacity: 0,
      location: '',
      hallType: 'Conference',
      basePrice: 0,
      pricingUnit: 'PerDay',
      facilities: '',
      status: 'Available',
    })
    setEditingHallId(null)
    setIsHallModalOpen(true)
  }

  const openEditHallModal = (hall: Hall) => {
    setHallForm({
      name: hall.name,
      capacity: hall.capacity,
      location: hall.location,
      hallType: hall.hallType,
      basePrice: hall.basePrice,
      pricingUnit: hall.pricingUnit,
      facilities: hall.facilities.join(', '),
      status: hall.status,
    })
    setEditingHallId(hall.id)
    setIsHallModalOpen(true)
  }

  const handleHallSubmit = () => {
    if (!hallForm.name || !hallForm.location) {
      alert('Please provide hall name and location.')
      return
    }

    const hallPayload: Omit<Hall, 'id' | 'createdAt'> = {
      name: hallForm.name,
      capacity: hallForm.capacity,
      location: hallForm.location,
      hallType: hallForm.hallType,
      basePrice: hallForm.basePrice,
      pricingUnit: hallForm.pricingUnit,
      facilities: hallForm.facilities.split(',').map(item => item.trim()).filter(Boolean),
      status: hallForm.status,
    }

    if (editingHallId) {
      hallsStore.update(editingHallId, hallPayload)
    } else {
      hallsStore.create(hallPayload)
    }

    setIsHallModalOpen(false)
    setEditingHallId(null)
  }

  const openCreatePackageModal = () => {
    setPackageForm({
      name: '',
      description: '',
      basePrice: 0,
      taxRate: 0,
      duration: 'Full-Day',
      includedServices: '',
      recommendedFor: [EventType.Conference],
      addons: '',
      active: true,
    })
    setEditingPackageId(null)
    setIsPackageModalOpen(true)
  }

  const openEditPackageModal = (pkg: EventPackage) => {
    setPackageForm({
      name: pkg.name,
      description: pkg.description,
      basePrice: pkg.basePrice,
      taxRate: pkg.taxRate,
      duration: pkg.duration,
      includedServices: pkg.includedServices.join(', '),
      recommendedFor: pkg.recommendedFor,
      addons: (pkg.addons || []).map(addon => `${addon.name}:${addon.price}`).join(', '),
      active: pkg.active,
    })
    setEditingPackageId(pkg.id)
    setIsPackageModalOpen(true)
  }

  const parseAddonsInput = (input: string) => {
    return input
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
      .map(pair => {
        const [name, price] = pair.split(':').map(part => part.trim())
        return {
          name,
          price: Number(price || 0),
        }
      })
  }

  const handlePackageSubmit = () => {
    if (!packageForm.name) {
      alert('Package name is required.')
      return
    }
    const payload: Omit<EventPackage, 'id' | 'createdAt'> = {
      name: packageForm.name,
      description: packageForm.description,
      includedServices: packageForm.includedServices
        .split(',')
        .map(service => service.trim())
        .filter(Boolean),
      basePrice: packageForm.basePrice,
      taxRate: packageForm.taxRate,
      duration: packageForm.duration,
      recommendedFor: packageForm.recommendedFor,
      addons: parseAddonsInput(packageForm.addons),
      active: packageForm.active,
    }

    if (editingPackageId) {
      packagesStore.update(editingPackageId, payload)
    } else {
      packagesStore.create(payload)
    }

    setIsPackageModalOpen(false)
    setEditingPackageId(null)
  }

  const eventColumns = [
    {
      key: 'name',
      header: 'Event',
      render: (event: HotelEvent) => (
        <div>
          <p className="font-semibold text-text">{event.name}</p>
          <p className="text-xs text-textSecondary">
            {event.clientName || guests.find(guest => guest.id === event.guestId)?.fullName || 'Walk-in'}
          </p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (event: HotelEvent) => <Badge variant="outline">{event.type}</Badge>,
    },
    {
      key: 'schedule',
      header: 'Schedule',
      render: (event: HotelEvent) => (
        <div className="text-xs text-textSecondary">
          <div>{new Date(event.date).toLocaleString()}</div>
          <div>{new Date(event.endDate).toLocaleString()}</div>
        </div>
      ),
    },
    {
      key: 'halls',
      header: 'Hall Allocation',
      render: (event: HotelEvent) => (
        <div className="text-sm">
          {event.hallIds
            .map(id => halls.find(hall => hall.id === id)?.name || id)
            .join(', ')}
        </div>
      ),
    },
    {
      key: 'attendees',
      header: 'Attendees',
      render: (event: HotelEvent) => (
        <div className="text-sm">
          <span className="font-semibold text-text">{event.expectedAttendees || 0}</span>
          {event.actualAttendees !== undefined && (
            <span className="ml-2 text-xs text-success">
              Actual: {event.actualAttendees}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'revenue',
      header: 'Revenue',
      render: (event: HotelEvent) => (
        <div className="text-sm">
          <span className="font-semibold text-primary">
            {currencyFormatter.format(event.financials?.totalAmount || 0)}
          </span>
          <div className="text-xs text-textSecondary">
            {event.financials?.packageName || 'Custom pricing'}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (event: HotelEvent) => (
        <div className="flex flex-col gap-1">
          <Badge variant={eventStatusVariant[event.status]}>{event.status}</Badge>
          {event.financials?.paymentStatus && (
            <Badge variant={paymentStatusVariant[event.financials.paymentStatus]}>
              {event.financials.paymentStatus} Payment
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (event: HotelEvent) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => openViewEventModal(event)} aria-label="View">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openEditEventModal(event)} aria-label="Edit">
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCancelEvent(event)}
            aria-label="Cancel"
          >
            <Trash2 className="h-4 w-4 text-error" />
          </Button>
        </div>
      ),
    },
  ]

  const hallColumns = [
    {
      key: 'name',
      header: 'Hall',
      render: (hall: HallWithAnalytics) => (
        <div>
          <p className="font-semibold text-text">{hall.name}</p>
          <p className="text-xs text-textSecondary">
            {hall.location} • {hall.capacity} pax
          </p>
        </div>
      ),
    },
    {
      key: 'pricing',
      header: 'Pricing',
      render: (hall: HallWithAnalytics) => (
        <div className="text-sm">
          {currencyFormatter.format(hall.basePrice)} /{' '}
          {hall.pricingUnit === 'PerDay'
            ? 'day'
            : hall.pricingUnit === 'PerHour'
            ? 'hour'
            : 'event'}
        </div>
      ),
    },
    {
      key: 'occupancyRate',
      header: 'Occupancy (30d)',
      render: (hall: HallWithAnalytics) => (
        <div className="text-sm">
          <span className="font-semibold">{hall.occupancyRate?.toFixed(1)}%</span>
          <div className="text-xs text-textSecondary">
            {hall.upcomingEvents} upcoming events
          </div>
        </div>
      ),
    },
    {
      key: 'revenueGenerated',
      header: 'Revenue',
      render: (hall: HallWithAnalytics) => (
        <div className="text-sm text-primary font-semibold">
          {currencyFormatter.format(hall.revenueGenerated || 0)}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (hall: HallWithAnalytics) => (
        <Badge
          variant={
            hall.status === 'Available'
              ? 'success'
              : hall.status === 'Booked'
              ? 'primary'
              : 'outline'
          }
        >
          {hall.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (hall: HallWithAnalytics) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEditHallModal(hall)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => hallsStore.remove(hall.id)}>
            <Trash2 className="h-4 w-4 text-error" />
          </Button>
        </div>
      ),
    },
  ]

  const packageColumns = [
    {
      key: 'name',
      header: 'Package',
      render: (pkg: EventPackage) => (
        <div>
          <p className="font-semibold text-text">{pkg.name}</p>
          <p className="text-xs text-textSecondary">{pkg.description}</p>
        </div>
      ),
    },
    {
      key: 'pricing',
      header: 'Pricing',
      render: (pkg: EventPackage) => (
        <div className="text-sm">
          <div className="font-semibold text-primary">{currencyFormatter.format(pkg.basePrice)}</div>
          <div className="text-xs text-textSecondary">Tax: {pkg.taxRate}%</div>
        </div>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (pkg: EventPackage) => <span className="text-sm">{pkg.duration}</span>,
    },
    {
      key: 'recommendedFor',
      header: 'Recommended For',
      render: (pkg: EventPackage) => (
        <div className="flex flex-wrap gap-2">
          {pkg.recommendedFor.map(type => (
            <Badge key={type} variant="outline">
              {type}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      render: (pkg: EventPackage) => (
        <Badge variant={pkg.active ? 'success' : 'outline'}>{pkg.active ? 'Active' : 'Inactive'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (pkg: EventPackage) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEditPackageModal(pkg)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => packagesStore.remove(pkg.id)}>
            <Trash2 className="h-4 w-4 text-error" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 animate-fadeIn">
        <div>
          <h2 className="text-3xl font-bold text-text">Event & Hall Management</h2>
          <p className="text-textSecondary">
            Coordinate events end-to-end with real-time visibility into bookings, halls, packages, and
            financial performance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" icon={ClipboardList} onClick={() => setActiveSection('reports')}>
            Reports
          </Button>
          <Button variant="outline" icon={Building2} onClick={openCreateHallModal}>
            Add Hall
          </Button>
          <Button variant="outline" icon={Layers3} onClick={openCreatePackageModal}>
            Add Package
          </Button>
          <Button variant="primary" icon={Plus} onClick={openCreateEventModal}>
            Create Event
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 border-b border-border pb-2">
        {[
          { key: 'dashboard', label: 'Dashboard Overview', icon: BarChart3 },
          { key: 'events', label: 'Events', icon: CalendarDays },
          { key: 'halls', label: 'Halls', icon: Building2 },
          { key: 'packages', label: 'Packages', icon: Layers3 },
          { key: 'reports', label: 'Analytics & Reports', icon: TrendingUp },
          { key: 'notifications', label: 'Notifications', icon: AlertTriangle },
        ].map(tab => (
          <button
            key={tab.key}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeSection === tab.key
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-textSecondary hover:text-text hover:bg-surface'
            }`}
            onClick={() => setActiveSection(tab.key as EventsSection)}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeSection === 'dashboard' && (
        <section className="space-y-6">
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <DashboardMetricCard
                title="Total Events"
                value={dashboardMetrics.totalEvents}
                icon={CalendarDays}
                subtitle={`${dashboardMetrics.upcoming} upcoming`}
              />
              <DashboardMetricCard
                title="Total Revenue"
                value={currencyFormatter.format(dashboardMetrics.totalRevenue)}
                icon={TrendingUp}
                subtitle={`${dashboardMetrics.pendingPayments} pending payments`}
              />
              <DashboardMetricCard
                title="Expected Attendees"
                value={dashboardMetrics.totalExpectedAttendees}
                icon={Users}
                subtitle={`Actual: ${dashboardMetrics.totalActualAttendees}`}
              />
              <DashboardMetricCard
                title="Completed Events"
                value={dashboardMetrics.completed}
                icon={CheckCircle2}
                subtitle={`${dashboardMetrics.cancelled} cancellations`}
              />
              <DashboardMetricCard
                title="Active Halls"
                value={halls.filter(h => h.status !== 'Under Maintenance').length}
                icon={Building2}
                subtitle={`${halls.filter(h => h.status === 'Booked').length} booked today`}
              />
            </div>
          </Card>

          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <Input
                placeholder="Search by event, client or organizer..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                icon={Search}
              />
              <SelectField
                label="Event Type"
                value={typeFilter}
                options={[{ label: 'All Types', value: 'All' }, ...Object.values(EventType).map(type => ({ label: type, value: type }))]}
                onChange={value => setTypeFilter(value as EventType | 'All')}
              />
              <SelectField
                label="Status"
                value={statusFilter}
                options={[
                  { label: 'All Status', value: 'All' },
                  { label: 'Scheduled', value: 'Scheduled' },
                  { label: 'In Progress', value: 'In Progress' },
                  { label: 'Completed', value: 'Completed' },
                  { label: 'Cancelled', value: 'Cancelled' },
                ]}
                onChange={value => setStatusFilter(value as HotelEvent['status'] | 'All')}
              />
              <SelectField
                label="Booking Stage"
                value={stageFilter}
                options={[
                  { label: 'All Stages', value: 'All' },
                  { label: 'Inquiry', value: 'Inquiry' },
                  { label: 'Quotation', value: 'Quotation' },
                  { label: 'Awaiting Payment', value: 'AwaitingPayment' },
                  { label: 'Confirmed', value: 'Confirmed' },
                  { label: 'In Execution', value: 'InExecution' },
                  { label: 'Completed', value: 'Completed' },
                  { label: 'Cancelled', value: 'Cancelled' },
                ]}
                onChange={value => setStageFilter(value as typeof stageFilter)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="From"
                type="date"
                value={dateFrom}
                onChange={event => setDateFrom(event.target.value)}
              />
              <FormField
                label="To"
                type="date"
                value={dateTo}
                onChange={event => setDateTo(event.target.value)}
              />
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text">Revenue & Attendance Trend</h3>
                <Button variant="ghost" size="sm" icon={Download}>
                  Export
                </Button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2F2F2F" />
                  <XAxis dataKey="name" stroke="#A3A3A3" />
                  <YAxis yAxisId="left" stroke="#A3A3A3" />
                  <YAxis yAxisId="right" orientation="right" stroke="#A3A3A3" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f1f24', borderRadius: '12px', border: '1px solid #2F2F2F' }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#6366F1"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="attendees"
                    name="Attendees"
                    stroke="#22C55E"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text">Event Type Distribution</h3>
                <Button variant="ghost" size="sm" icon={Filter}>
                  Filter
                </Button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    dataKey="value"
                    data={eventsByType}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {eventsByType.map((entry, index) => (
                      <Cell key={entry.type} fill={chartPalette[index % chartPalette.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f1f24', borderRadius: '12px', border: '1px solid #2F2F2F' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {eventsByType.map((entry, index) => (
                  <div key={entry.type} className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: chartPalette[index % chartPalette.length] }}
                    />
                    <span>{entry.type}</span>
                    <span className="text-textSecondary ml-auto">{entry.value} events</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>
      )}

      {activeSection === 'events' && (
        <section className="space-y-6">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-text">Booking Workflow Assistant</h3>
                <p className="text-sm text-textSecondary">
                  Follow each step to convert inquiries into confirmed events with financial tracking.
                </p>
              </div>
              <Button variant="primary" size="sm" icon={Plus} onClick={openCreateEventModal}>
                New Booking
              </Button>
            </div>
            <WorkflowStep
              step={1}
              title="Initiate Booking"
              description="Capture event inquiry, select date/time, and preliminary hall preferences."
              completed={Boolean(eventForm.name && eventForm.date)}
            />
            <WorkflowStep
              step={2}
              title="Validate Availability"
              description="System checks hall occupancy against existing bookings and maintenance schedules."
              completed={
                Boolean(eventForm.hallIds.length) &&
                Boolean(eventForm.date && eventForm.endDate) &&
                validateHallAvailability(eventForm.hallIds, eventForm.date, eventForm.endDate, editingEventId || undefined).ok
              }
            />
            <WorkflowStep
              step={3}
              title="Select Guest & Package"
              description="Link guest profile, recommend packages by event type, auto-calculate pricing."
              completed={Boolean(eventForm.guestId || eventForm.clientName)}
            />
            <WorkflowStep
              step={4}
              title="Send Quotation"
              description="Generate proforma invoice for client approval with configurable taxes and discounts."
              completed={Boolean(eventFinancials.proformaInvoiceNumber)}
              onAction={() =>
                setEventFinancials(prev =>
                  recalculateFinancials({
                    ...prev,
                    proformaInvoiceNumber: prev.proformaInvoiceNumber || generateDocumentNumber('EV-PRO'),
                  })
                )
              }
              actionLabel="Generate Quotation"
            />
            <WorkflowStep
              step={5}
              title="Confirm Booking"
              description="Confirm payment, auto-update hall allocation, notify departments for setup."
              completed={eventFinancials.paymentStatus === 'Paid'}
            />
            <WorkflowStep
              step={6}
              title="Assign Tasks & Complete"
              description="Track housekeeping and services tasks, capture actual attendees, finalize revenue."
              completed={Boolean(eventForm.actualAttendees && eventFinancials.finalInvoiceNumber)}
            />
          </Card>

          <Table<HotelEvent> data={events} columns={eventColumns} emptyMessage="No events found." />
        </section>
      )}

      {activeSection === 'halls' && (
        <section className="space-y-6">
          <Card className="p-4 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-text">Hall Inventory & Utilization</h3>
                <p className="text-sm text-textSecondary">
                  Monitor hall availability, usage trends, and maintenance status at a glance.
                </p>
              </div>
              <Button variant="primary" icon={Plus} onClick={openCreateHallModal}>
                Add Hall
              </Button>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={hallUtilization}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2F2F2F" />
                <XAxis dataKey="name" stroke="#A3A3A3" />
                <YAxis stroke="#A3A3A3" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f1f24', borderRadius: '12px', border: '1px solid #2F2F2F' }}
                />
                <Bar dataKey="occupancyRate" name="Occupancy %" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="upcomingEvents" name="Upcoming Events" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Table<HallWithAnalytics>
            data={hallUtilization}
            columns={hallColumns}
            emptyMessage="No halls configured."
          />
        </section>
      )}

      {activeSection === 'packages' && (
        <section className="space-y-6">
          <Card className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-text">Event Packages</h3>
                <p className="text-sm text-textSecondary">
                  Configure curated experiences and ensure pricing consistency across event types.
                </p>
              </div>
              <Button variant="primary" icon={Plus} onClick={openCreatePackageModal}>
                Add Package
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages.map(pkg => (
                <div key={pkg.id} className="rounded-xl border border-border p-4 bg-surface shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-text">{pkg.name}</h4>
                    <Badge variant={pkg.active ? 'success' : 'outline'}>{pkg.duration}</Badge>
                  </div>
                  <p className="text-sm text-textSecondary mb-3">{pkg.description}</p>
                  <p className="text-sm text-text">
                    <span className="font-semibold text-primary">
                      {currencyFormatter.format(pkg.basePrice)}
                    </span>{' '}
                    • Tax {pkg.taxRate}%
                  </p>
                  <p className="text-xs text-textSecondary mt-2">
                    Includes: {pkg.includedServices.slice(0, 3).join(', ')}
                    {pkg.includedServices.length > 3 && '...'}
                  </p>
                  {pkg.addons && pkg.addons.length > 0 && (
                    <p className="text-xs text-textSecondary mt-1">
                      Add-ons: {pkg.addons.map(addon => `${addon.name} (${currencyFormatter.format(addon.price)})`).join(', ')}
                    </p>
                  )}
                  <div className="mt-4 flex justify-between">
                    <Button variant="ghost" size="sm" onClick={() => openEditPackageModal(pkg)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => packagesStore.remove(pkg.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Table<EventPackage>
            data={packages}
            columns={packageColumns}
            emptyMessage="No event packages configured."
          />
        </section>
      )}

      {activeSection === 'reports' && (
        <section className="space-y-6">
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-text">Event Revenue Summary</h3>
                <p className="text-sm text-textSecondary">
                  Analyze revenue, attendance, and cancellations by date range, hall, or package.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" icon={FileText}>
                  Export PDF
                </Button>
                <Button variant="outline" icon={Download}>
                  Export Excel
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead>
                  <tr className="bg-surface">
                    <th className="px-4 py-3 text-left text-textSecondary font-medium uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-4 py-3 text-left text-textSecondary font-medium uppercase tracking-wider">
                      Event Type
                    </th>
                    <th className="px-4 py-3 text-left text-textSecondary font-medium uppercase tracking-wider">
                      Hall
                    </th>
                    <th className="px-4 py-3 text-left text-textSecondary font-medium uppercase tracking-wider">
                      Package
                    </th>
                    <th className="px-4 py-3 text-left text-textSecondary font-medium uppercase tracking-wider">
                      Attendees
                    </th>
                    <th className="px-4 py-3 text-left text-textSecondary font-medium uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-4 py-3 text-left text-textSecondary font-medium uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {events.map(event => (
                    <tr key={event.id} className="hover:bg-primary/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{event.name}</div>
                        <div className="text-xs text-textSecondary">
                          {new Date(event.date).toLocaleDateString()} -{' '}
                          {new Date(event.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{event.type}</td>
                      <td className="px-4 py-3 text-sm">
                        {event.hallIds
                          .map(id => halls.find(h => h.id === id)?.name || id)
                          .join(', ')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {event.financials?.packageName ||
                          packages.find(pkg => pkg.id === event.packageId)?.name ||
                          'Custom'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {event.actualAttendees || event.expectedAttendees || 0}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-primary">
                        {currencyFormatter.format(event.financials?.totalAmount || 0)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant={eventStatusVariant[event.status]}>{event.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}

      {activeSection === 'notifications' && (
        <section className="space-y-6">
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-text">Notifications & Alerts</h3>
                <p className="text-sm text-textSecondary">
                  Stay ahead with proactive alerts for upcoming events, payments, and hall maintenance.
                </p>
              </div>
              <Badge variant="outline">{notifications.length} Active</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notifications.length === 0 && (
                <div className="col-span-full text-center py-8 text-textSecondary">
                  <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin text-primary" />
                  No notifications at the moment.
                </div>
              )}
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className="rounded-xl border border-border bg-surface p-4 flex items-start gap-3"
                >
                  <notification.icon
                    className={`h-5 w-5 ${
                      notification.severity === 'critical'
                        ? 'text-error'
                        : notification.severity === 'warning'
                        ? 'text-warning'
                        : 'text-primary'
                    }`}
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-text">{notification.title}</h4>
                    <p className="text-sm text-textSecondary">{notification.message}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    Acknowledge
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* Event Modal */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title={
          eventModalMode === 'view'
            ? 'View Event'
            : eventModalMode === 'edit'
            ? 'Edit Event'
            : 'Create Event'
        }
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 text-sm">
              {['Basic Info', 'Schedule', 'Pricing', 'Notes'].map((label, index) => (
                <button
                  key={label}
                  onClick={() => setEventModalStep(index)}
                  className={`rounded-full px-3 py-1 ${
                    eventModalStep === index ? 'bg-primary text-white' : 'bg-surface border border-border text-textSecondary'
                  }`}
                  disabled={eventModalMode === 'view'}
                >
                  {index + 1}. {label}
                </button>
              ))}
            </div>
            <Badge variant="outline">
              {eventFinancials.paymentStatus} •{' '}
              {eventFinancials.finalInvoiceNumber
                ? 'Final Invoice Issued'
                : eventFinancials.proformaInvoiceNumber
                ? 'Proforma Issued'
                : 'Draft'}
            </Badge>
          </div>

          {eventModalStep === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Event Name"
                value={eventForm.name}
                onChange={event => setEventForm(prev => ({ ...prev, name: event.target.value }))}
                required
                disabled={eventModalMode === 'view'}
              />
              <div>
                <label className="block text-sm font-medium text-text mb-2">Event Type</label>
                <select
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl"
                  value={eventForm.type}
                  onChange={event => setEventForm(prev => ({ ...prev, type: event.target.value as EventType }))}
                  disabled={eventModalMode === 'view'}
                >
                  {Object.values(EventType).map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Organizer / Guest</label>
                <select
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl"
                  value={eventForm.guestId}
                  onChange={event => {
                    const selected = event.target.value
                    const guest = guests.find(guest => guest.id === selected)
                    setEventForm(prev => ({
                      ...prev,
                      guestId: selected,
                      clientName: guest?.fullName || prev.clientName,
                    }))
                  }}
                  disabled={eventModalMode === 'view'}
                >
                  <option value="">Walk-in / New Guest</option>
                  {guests.map(guest => (
                    <option key={guest.id} value={guest.id}>
                      {guest.fullName} ({guest.email})
                    </option>
                  ))}
                </select>
              </div>
              <FormField
                label="Company / Contact Name"
                value={eventForm.clientName}
                onChange={event => setEventForm(prev => ({ ...prev, clientName: event.target.value }))}
                disabled={eventModalMode === 'view'}
              />
              <FormField
                label="Expected Attendees"
                type="number"
                value={eventForm.expectedAttendees}
                onChange={event =>
                  setEventForm(prev => ({
                    ...prev,
                    expectedAttendees: Number(event.target.value),
                  }))
                }
                disabled={eventModalMode === 'view'}
              />
              <FormField
                label="Actual Attendees"
                type="number"
                value={eventForm.actualAttendees || 0}
                onChange={event =>
                  setEventForm(prev => ({
                    ...prev,
                    actualAttendees: Number(event.target.value),
                  }))
                }
                disabled={eventModalMode === 'view'}
              />
            </div>
          )}

          {eventModalStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Start Date & Time"
                type="datetime-local"
                value={eventForm.date}
                onChange={event => setEventForm(prev => ({ ...prev, date: event.target.value }))}
                required
                disabled={eventModalMode === 'view'}
              />
              <FormField
                label="End Date & Time"
                type="datetime-local"
                value={eventForm.endDate}
                onChange={event => setEventForm(prev => ({ ...prev, endDate: event.target.value }))}
                required
                disabled={eventModalMode === 'view'}
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text mb-2">Assign Halls</label>
                <select
                  multiple
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl h-32"
                  value={eventForm.hallIds}
                  onChange={event =>
                    setEventForm(prev => ({
                      ...prev,
                      hallIds: Array.from(event.target.selectedOptions).map(option => option.value),
                    }))
                  }
                  disabled={eventModalMode === 'view'}
                >
                  {halls.map(hall => (
                    <option key={hall.id} value={hall.id}>
                      {hall.name} ({hall.capacity} pax) — {hall.status}
                    </option>
                  ))}
                </select>
                {eventForm.hallIds.length > 0 && (
                  <p className="text-xs text-textSecondary mt-2 flex items-center gap-1">
                    <Clock3 className="h-3 w-3" />
                    {validateHallAvailability(
                      eventForm.hallIds,
                      eventForm.date,
                      eventForm.endDate,
                      editingEventId || undefined
                    ).ok
                      ? 'Halls available for the selected schedule.'
                      : 'Hall conflict detected. Adjust timing or hall selection.'}
                  </p>
                )}
              </div>
              <FormField
                label="Decoration Theme"
                value={eventForm.decorationType || ''}
                onChange={event => setEventForm(prev => ({ ...prev, decorationType: event.target.value }))}
                disabled={eventModalMode === 'view'}
              />
              <FormField
                label="Catering Requirements"
                value={eventForm.cateringRequirements || ''}
                onChange={event =>
                  setEventForm(prev => ({ ...prev, cateringRequirements: event.target.value }))
                }
                disabled={eventModalMode === 'view'}
              />
              <FormField
                label="Equipment Needs (comma separated)"
                value={eventForm.equipmentNeeds}
                onChange={event => setEventForm(prev => ({ ...prev, equipmentNeeds: event.target.value }))}
                disabled={eventModalMode === 'view'}
              />
            </div>
          )}

          {eventModalStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Event Package</label>
                  <select
                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl"
                    value={eventForm.packageId || ''}
                    onChange={event => handlePackageSelection(event.target.value)}
                    disabled={eventModalMode === 'view'}
                  >
                    <option value="">Custom Pricing</option>
                    {packages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} ({currencyFormatter.format(pkg.basePrice)})
                      </option>
                    ))}
                  </select>
                  {eventForm.packageId && (
                    <p className="text-xs text-textSecondary mt-2">
                      Auto-suggested services: {packagesStore.getById(eventForm.packageId)?.includedServices.join(', ')}
                    </p>
                  )}
                </div>
                <FormField
                  label="Base Amount"
                  type="number"
                  value={eventFinancials.baseAmount}
                  onChange={event =>
                    updateFinancialField('baseAmount', Number(event.target.value))
                  }
                  disabled={eventModalMode === 'view'}
                />
                <FormField
                  label="Add-ons Amount"
                  type="number"
                  value={eventFinancials.addonsAmount}
                  onChange={event =>
                    updateFinancialField('addonsAmount', Number(event.target.value))
                  }
                  disabled={eventModalMode === 'view'}
                />
                <FormField
                  label="Discount Amount"
                  type="number"
                  value={eventFinancials.discountAmount}
                  onChange={event =>
                    updateFinancialField('discountAmount', Number(event.target.value))
                  }
                  disabled={eventModalMode === 'view'}
                />
                <FormField
                  label="Tax Rate (%)"
                  type="number"
                  value={eventFinancials.taxRate}
                  onChange={event => updateFinancialField('taxRate', Number(event.target.value))}
                  disabled={eventModalMode === 'view'}
                />
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Payment Status</label>
                  <select
                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl"
                    value={eventFinancials.paymentStatus}
                    onChange={event =>
                      updateFinancialField('paymentStatus', event.target.value as EventPaymentStatus)
                    }
                    disabled={eventModalMode === 'view'}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                    <option value="Paid">Paid</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-border rounded-xl p-4 bg-surface">
                <div>
                  <p className="text-xs text-textSecondary uppercase">Subtotal</p>
                  <p className="text-lg font-semibold text-text">
                    {currencyFormatter.format(
                      eventFinancials.baseAmount +
                        eventFinancials.addonsAmount -
                        eventFinancials.discountAmount
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-textSecondary uppercase">Tax</p>
                  <p className="text-lg font-semibold text-text">
                    {currencyFormatter.format(eventFinancials.taxAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-textSecondary uppercase">Total</p>
                  <p className="text-xl font-bold text-primary">
                    {currencyFormatter.format(eventFinancials.totalAmount)}
                  </p>
                </div>
                <div className="space-y-2 text-xs text-textSecondary">
                  <div>Proforma Invoice: {eventFinancials.proformaInvoiceNumber || 'Not generated'}</div>
                  <div>Final Invoice: {eventFinancials.finalInvoiceNumber || 'Pending'}</div>
                </div>
              </div>
            </div>
          )}

          {eventModalStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Additional Notes</label>
                <textarea
                  className="w-full min-h-[120px] rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  value={eventForm.notes || ''}
                  onChange={event => setEventForm(prev => ({ ...prev, notes: event.target.value }))}
                  disabled={eventModalMode === 'view'}
                />
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <h4 className="font-semibold text-text mb-2">Audit Log Preview</h4>
                <p className="text-xs text-textSecondary">
                  All event CRUD actions, pricing updates, and payment status changes are automatically logged with user ID, timestamp, and previous values for compliance and traceability.
                </p>
              </div>
            </div>
          )}
        </div>

        {eventModalMode !== 'view' && (
          <div className="flex justify-between pt-4 mt-6 border-t border-border">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setEventModalStep(step => Math.max(0, step - 1))}
                disabled={eventModalStep === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setEventModalStep(step => Math.min(3, step + 1))}
                disabled={eventModalStep === 3}
              >
                Next
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEventModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleEventSubmit}>
                {editingEventId ? 'Save Changes' : 'Create Event'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Hall Modal */}
      <Modal
        isOpen={isHallModalOpen}
        onClose={() => setIsHallModalOpen(false)}
        title={editingHallId ? 'Edit Hall' : 'Add Hall'}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Hall Name"
            value={hallForm.name}
            onChange={event => setHallForm(prev => ({ ...prev, name: event.target.value }))}
            required
          />
          <FormField
            label="Capacity"
            type="number"
            value={hallForm.capacity}
            onChange={event => setHallForm(prev => ({ ...prev, capacity: Number(event.target.value) }))}
            required
          />
          <FormField
            label="Location"
            value={hallForm.location}
            onChange={event => setHallForm(prev => ({ ...prev, location: event.target.value }))}
            required
          />
          <div>
            <label className="block text-sm font-medium text-text mb-2">Hall Type</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl"
              value={hallForm.hallType}
              onChange={event => setHallForm(prev => ({ ...prev, hallType: event.target.value as Hall['hallType'] }))}
            >
              <option value="Conference">Conference</option>
              <option value="Banquet">Banquet</option>
              <option value="Meeting">Meeting</option>
              <option value="Party">Party</option>
            </select>
          </div>
          <FormField
            label="Base Price"
            type="number"
            value={hallForm.basePrice}
            onChange={event => setHallForm(prev => ({ ...prev, basePrice: Number(event.target.value) }))}
            required
          />
          <div>
            <label className="block text-sm font-medium text-text mb-2">Pricing Unit</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl"
              value={hallForm.pricingUnit}
              onChange={event =>
                setHallForm(prev => ({
                  ...prev,
                  pricingUnit: event.target.value as Hall['pricingUnit'],
                }))
              }
            >
              <option value="PerHour">Per Hour</option>
              <option value="PerDay">Per Day</option>
              <option value="PerEvent">Per Event</option>
            </select>
          </div>
          <FormField
            label="Facilities (comma separated)"
            value={hallForm.facilities}
            onChange={event => setHallForm(prev => ({ ...prev, facilities: event.target.value }))}
          />
          <div>
            <label className="block text-sm font-medium text-text mb-2">Status</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl"
              value={hallForm.status}
              onChange={event => setHallForm(prev => ({ ...prev, status: event.target.value as Hall['status'] }))}
            >
              <option value="Available">Available</option>
              <option value="Booked">Booked</option>
              <option value="Under Maintenance">Under Maintenance</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 mt-6 border-t border-border">
          <Button variant="outline" onClick={() => setIsHallModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleHallSubmit}>
            {editingHallId ? 'Save Changes' : 'Create Hall'}
          </Button>
        </div>
      </Modal>

      {/* Package Modal */}
      <Modal
        isOpen={isPackageModalOpen}
        onClose={() => setIsPackageModalOpen(false)}
        title={editingPackageId ? 'Edit Event Package' : 'Add Event Package'}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Package Name"
            value={packageForm.name}
            onChange={event => setPackageForm(prev => ({ ...prev, name: event.target.value }))}
            required
          />
          <FormField
            label="Base Price"
            type="number"
            value={packageForm.basePrice}
            onChange={event => setPackageForm(prev => ({ ...prev, basePrice: Number(event.target.value) }))}
            required
          />
          <FormField
            label="Tax Rate (%)"
            type="number"
            value={packageForm.taxRate}
            onChange={event => setPackageForm(prev => ({ ...prev, taxRate: Number(event.target.value) }))}
            required
          />
          <div>
            <label className="block text-sm font-medium text-text mb-2">Duration</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl"
              value={packageForm.duration}
              onChange={event =>
                setPackageForm(prev => ({
                  ...prev,
                  duration: event.target.value as EventPackage['duration'],
                }))
              }
            >
              <option value="Half-Day">Half-Day</option>
              <option value="Full-Day">Full-Day</option>
              <option value="Multi-Day">Multi-Day</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <FormField
              label="Included Services (comma separated)"
              value={packageForm.includedServices}
              onChange={event => setPackageForm(prev => ({ ...prev, includedServices: event.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text mb-2">Recommended For</label>
            <div className="flex flex-wrap gap-2">
              {Object.values(EventType).map(type => (
                <button
                  key={type}
                  type="button"
                  className={`px-3 py-1 rounded-full border ${
                    packageForm.recommendedFor.includes(type)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-textSecondary'
                  }`}
                  onClick={() =>
                    setPackageForm(prev => ({
                      ...prev,
                      recommendedFor: prev.recommendedFor.includes(type)
                        ? prev.recommendedFor.filter(item => item !== type)
                        : [...prev.recommendedFor, type],
                    }))
                  }
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <FormField
              label="Add-ons (format: Name:Price, Name:Price)"
              value={packageForm.addons}
              onChange={event => setPackageForm(prev => ({ ...prev, addons: event.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Status</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl"
              value={packageForm.active ? 'Active' : 'Inactive'}
              onChange={event => setPackageForm(prev => ({ ...prev, active: event.target.value === 'Active' }))}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 mt-6 border-t border-border">
          <Button variant="outline" onClick={() => setIsPackageModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handlePackageSubmit}>
            {editingPackageId ? 'Save Changes' : 'Create Package'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

type DashboardMetricCardProps = {
  title: string
  value: string | number
  icon: React.ElementType
  subtitle?: string
}

const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({ title, value, icon: Icon, subtitle }) => (
  <div className="rounded-2xl bg-surface border border-border p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-textSecondary">{title}</p>
        <p className="text-2xl font-bold text-text">{value}</p>
      </div>
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
        <Icon className="h-5 w-5" />
      </div>
    </div>
    {subtitle && <p className="text-xs text-textSecondary mt-2">{subtitle}</p>}
  </div>
)

type WorkflowStepProps = {
  step: number
  title: string
  description: string
  completed: boolean
  actionLabel?: string
  onAction?: () => void
}

const WorkflowStep: React.FC<WorkflowStepProps> = ({
  step,
  title,
  description,
  completed,
  actionLabel,
  onAction,
}) => (
  <div className="rounded-xl border border-border bg-surface px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
    <div className="flex items-start gap-3">
      <div
        className={`mt-1 h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${
          completed ? 'bg-success/20 text-success' : 'bg-surface border border-border text-textSecondary'
        }`}
      >
        {completed ? <CheckCircle2 className="h-4 w-4" /> : step}
      </div>
      <div>
        <h4 className="font-semibold text-text">{title}</h4>
        <p className="text-sm text-textSecondary">{description}</p>
      </div>
    </div>
    {actionLabel && onAction && !completed && (
      <Button variant="outline" size="sm" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
)

type SelectFieldProps = {
  label: string
  value: string
  options: { label: string; value: string }[]
  onChange: (value: string) => void
}

const SelectField: React.FC<SelectFieldProps> = ({ label, value, options, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-text mb-2">{label}</label>
    <select
      className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl"
      value={value}
      onChange={event => onChange(event.target.value)}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
)

export default EventsPage

