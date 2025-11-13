import React, { useEffect, useMemo, useState } from 'react'
import { MOCK_RESERVATIONS, MOCK_RESERVATION_INQUIRIES, MOCK_GUESTS } from '../constants'
import { Reservation, ReservationInquiry, ReservationStatus, PaymentMethod, BookingChannel, Room, RoomStatus, Guest, MealPlanCode } from '../types'
import { useRoomsStore } from '../store/roomsStore'
import { useMealPlansStore } from '../store/mealPlansStore'
import Table from '../components/molecules/Table'
import Button from '../components/atoms/Button'
import Input from '../components/atoms/Input'
import Badge from '../components/atoms/Badge'
import Card from '../components/atoms/Card'
import Modal from '../components/molecules/Modal'
import FormField from '../components/molecules/FormField'
import Dropdown, { DropdownItem } from '../components/molecules/Dropdown'
import DashboardWidget from '../components/organisms/DashboardWidget'
import { 
  Plus, Search, Eye, Edit, Trash2, Calendar, 
  CheckCircle, XCircle, Clock, DollarSign, 
  Users, Filter, Download, LogIn, LogOut
} from 'lucide-react'

const ReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>(MOCK_RESERVATIONS)
  const [inquiries, setInquiries] = useState<ReservationInquiry[]>(MOCK_RESERVATION_INQUIRIES)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'All'>('All')
  const [channelFilter, setChannelFilter] = useState<BookingChannel | 'All'>('All')
  const [mealPlanFilter, setMealPlanFilter] = useState<MealPlanCode | 'All'>('All')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [activeTab, setActiveTab] = useState<'reservations' | 'inquiries'>('reservations')
  const [detailsMealPlanCode, setDetailsMealPlanCode] = useState<MealPlanCode>(MealPlanCode.RO)
  
  // Form state for new reservation
  const [formData, setFormData] = useState({
    guestId: '',
    checkInDate: '',
    checkOutDate: '',
    adults: 1,
    children: 0,
    channel: BookingChannel.Website,
    paymentMethod: PaymentMethod.Card,
    roomId: '',
    notes: '',
    mealPlanCode: MealPlanCode.RO,
  })
  const [availableRooms, setAvailableRooms] = useState<Room[]>([])
  const roomsStore = useRoomsStore()
  const mealPlans = useMealPlansStore((state) => state.mealPlans)
  const [showRoomSearch, setShowRoomSearch] = useState(false)
  useEffect(() => {
    if (selectedReservation) {
      setDetailsMealPlanCode(selectedReservation.mealPlanCode || MealPlanCode.RO)
    }
  }, [selectedReservation])

  // Calculate KPIs
  const kpis = useMemo(() => {
    const total = reservations.length
    const confirmed = reservations.filter(r => r.status === ReservationStatus.Confirmed).length
    const checkedIn = reservations.filter(r => r.status === ReservationStatus.CheckedIn).length
    const checkedOut = reservations.filter(r => r.status === ReservationStatus.CheckedOut).length
    const cancelled = reservations.filter(r => r.status === ReservationStatus.Cancelled).length
    const totalRevenue = reservations
      .filter(r => r.status !== ReservationStatus.Cancelled)
      .reduce((sum, r) => sum + r.totalAmount, 0)
    
    return {
      total,
      confirmed,
      checkedIn,
      checkedOut,
      cancelled,
      totalRevenue,
    }
  }, [reservations])

  // Filter reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter(reservation => {
      const matchesSearch = 
        reservation.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.reservationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.guestEmail.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'All' || reservation.status === statusFilter
      const matchesChannel = channelFilter === 'All' || reservation.channel === channelFilter
      const matchesMealPlan = mealPlanFilter === 'All' || (reservation.mealPlanCode || MealPlanCode.RO) === mealPlanFilter
      
      return matchesSearch && matchesStatus && matchesChannel && matchesMealPlan
    })
  }, [reservations, searchTerm, statusFilter, channelFilter, mealPlanFilter])

  // Search available rooms
  const searchAvailableRooms = () => {
    if (!formData.checkInDate || !formData.checkOutDate) {
      alert('Please select check-in and check-out dates')
      return
    }

    const totalGuests = formData.adults + formData.children
    const available = roomsStore.rooms.filter(room => {
      // Only show Available rooms
      if (room.status !== RoomStatus.Available) return false
      
      // Check capacity
      if (room.capacity < totalGuests) return false
      
      // Check if room is reserved during the dates (simplified - in real app, check against reservations)
      const isReserved = reservations.some(res => 
        res.roomId === room.id &&
        res.status !== ReservationStatus.Cancelled &&
        res.status !== ReservationStatus.CheckedOut &&
        ((formData.checkInDate >= res.checkInDate && formData.checkInDate < res.checkOutDate) ||
         (formData.checkOutDate > res.checkInDate && formData.checkOutDate <= res.checkOutDate) ||
         (formData.checkInDate <= res.checkInDate && formData.checkOutDate >= res.checkOutDate))
      )
      
      return !isReserved
    })
    
    setAvailableRooms(available)
    setShowRoomSearch(true)
  }

  // Calculate pricing for a room
  const calculatePricing = (room: Room) => {
    const checkIn = new Date(formData.checkInDate)
    const checkOut = new Date(formData.checkOutDate)
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    
    const baseRate = room.price * nights
    const seasonalPricing = baseRate * 0.1 // 10% seasonal
    const channelAdjustment = formData.channel === BookingChannel.BookingCom ? baseRate * -0.05 : 
                           formData.channel === BookingChannel.Expedia ? baseRate * -0.05 : 0
    const planCode = formData.mealPlanCode || room.mealPlanCode || MealPlanCode.RO
    const selectedPlan = mealPlans.find(plan => plan.code === planCode)
    const mealPlanMarkup = selectedPlan
      ? selectedPlan.markupType === 'Percentage'
        ? (baseRate * selectedPlan.markupValue) / 100
        : selectedPlan.markupValue * nights
      : 0
    const taxableAmount = baseRate + seasonalPricing + channelAdjustment + mealPlanMarkup
    const tax = taxableAmount * 0.1 // 10% tax
    const totalAmount = taxableAmount + tax
    
    return {
      baseRate,
      seasonalPricing,
      channelPricing: channelAdjustment,
      mealPlanMarkup,
      tax,
      totalAmount,
      nights,
      mealPlanCode: planCode,
    }
  }

  // Create new reservation
  const handleCreateReservation = (room: Room) => {
    const guest = MOCK_GUESTS.find(g => g.id === formData.guestId)
    if (!guest) {
      alert('Please select a guest')
      return
    }

    const pricing = calculatePricing(room)
    const reservationNumber = `RES-2024-${String(reservations.length + 1).padStart(3, '0')}`
    const invoiceNumber = `INV-2024-${String(reservations.length + 1).padStart(3, '0')}`

    const newReservation: Reservation = {
      id: `RES${reservations.length + 1}`,
      reservationNumber,
      guestId: formData.guestId,
      guestName: guest.fullName,
      guestEmail: guest.email,
      guestPhone: guest.phone,
      roomId: room.id,
      roomNumber: room.number,
      roomType: room.type,
      mealPlanCode: formData.mealPlanCode,
      checkInDate: formData.checkInDate,
      checkOutDate: formData.checkOutDate,
      adults: formData.adults,
      children: formData.children,
      channel: formData.channel,
      status: ReservationStatus.Confirmed,
      baseRate: pricing.baseRate,
      seasonalPricing: pricing.seasonalPricing,
      channelPricing: pricing.channelPricing,
      tax: pricing.tax,
      totalAmount: pricing.totalAmount,
      paidAmount: 0,
      pendingAmount: pricing.totalAmount,
      paymentMethod: formData.paymentMethod,
      invoiceNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: formData.notes,
    }

    setReservations([...reservations, newReservation])
    
    // Update room status to Reserved
    roomsStore.markReserved(room.id)
    roomsStore.update(room.id, { mealPlanCode: formData.mealPlanCode })
    
    setIsCreateModalOpen(false)
    setShowRoomSearch(false)
    setFormData({
      guestId: '',
      checkInDate: '',
      checkOutDate: '',
      adults: 1,
      children: 0,
      channel: BookingChannel.Website,
      paymentMethod: PaymentMethod.Card,
      roomId: '',
      notes: '',
      mealPlanCode: MealPlanCode.RO,
    })
    setAvailableRooms([])
  }

  // Handle check-in
  const handleCheckIn = (reservation: Reservation) => {
    if (reservation.status !== ReservationStatus.Confirmed) {
      alert('Only confirmed reservations can be checked in')
      return
    }

    setReservations(reservations.map(r => 
      r.id === reservation.id 
        ? { ...r, status: ReservationStatus.CheckedIn, updatedAt: new Date().toISOString() }
        : r
    ))
    // Room becomes Occupied
    roomsStore.markOccupied(reservation.roomId)
    alert('Guest checked in successfully! Room status updated to Occupied.')
  }

  // Handle check-out
  const handleCheckOut = (reservation: Reservation) => {
    if (reservation.status !== ReservationStatus.CheckedIn) {
      alert('Only checked-in reservations can be checked out')
      return
    }

    if (reservation.pendingAmount > 0) {
      if (!window.confirm(`Pending amount: $${reservation.pendingAmount.toFixed(2)}. Proceed with check-out?`)) {
        return
      }
    }

    setReservations(reservations.map(r => 
      r.id === reservation.id 
        ? { ...r, status: ReservationStatus.CheckedOut, updatedAt: new Date().toISOString() }
        : r
    ))
    // Room becomes Dirty and housekeeping notified (conceptual)
    roomsStore.markDirty(reservation.roomId)
    alert('Guest checked out successfully! Room status updated to Dirty. Housekeeping notified.')
  }

  // Handle cancellation
  const handleCancel = (reservation: Reservation) => {
    if (reservation.status === ReservationStatus.CheckedIn || reservation.status === ReservationStatus.CheckedOut) {
      alert('Cannot cancel checked-in or checked-out reservations')
      return
    }

    if (!window.confirm(`Cancel reservation ${reservation.reservationNumber}?`)) {
      return
    }

    setReservations(reservations.map(r => 
      r.id === reservation.id 
        ? { 
            ...r, 
            status: ReservationStatus.Cancelled, 
            updatedAt: new Date().toISOString(),
            notes: r.notes ? `${r.notes}\nCancelled on ${new Date().toLocaleDateString()}` : `Cancelled on ${new Date().toLocaleDateString()}`
          }
        : r
    ))
    // If cancelled before check-in, release the room
    roomsStore.markAvailable(reservation.roomId)
    alert('Reservation cancelled. Room status updated to Available.')
  }

  const handleUpdateReservationMealPlan = () => {
    if (!selectedReservation) return
    if (selectedReservation.mealPlanCode === detailsMealPlanCode) {
      alert('Meal plan is already set to this option.')
      return
    }
    const plan = mealPlans.find(p => p.code === detailsMealPlanCode)
    if (!plan) {
      alert('Unable to locate meal plan configuration.')
      return
    }
    const nights = Math.max(
      1,
      Math.ceil(
        (new Date(selectedReservation.checkOutDate).getTime() - new Date(selectedReservation.checkInDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    )
    const mealPlanMarkup =
      plan.markupType === 'Percentage'
        ? (selectedReservation.baseRate * plan.markupValue) / 100
        : plan.markupValue * nights
    const taxableAmount =
      selectedReservation.baseRate +
      selectedReservation.seasonalPricing +
      selectedReservation.channelPricing +
      mealPlanMarkup
    const tax = taxableAmount * 0.1
    const totalAmount = taxableAmount + tax
    const updatedReservation: Reservation = {
      ...selectedReservation,
      mealPlanCode: detailsMealPlanCode,
      tax,
      totalAmount,
      pendingAmount: totalAmount - selectedReservation.paidAmount,
      updatedAt: new Date().toISOString(),
    }
    setReservations(reservations.map(r => (r.id === selectedReservation.id ? updatedReservation : r)))
    setSelectedReservation(updatedReservation)
    roomsStore.update(selectedReservation.roomId, { mealPlanCode: detailsMealPlanCode })
    alert('Meal plan updated for this reservation and invoice totals refreshed.')
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.Confirmed: return 'secondary'
      case ReservationStatus.CheckedIn: return 'primary'
      case ReservationStatus.CheckedOut: return 'info'
      case ReservationStatus.Cancelled: return 'danger'
      default: return 'outline'
    }
  }

  const getMealPlanLabel = (code?: MealPlanCode) => {
    const resolvedCode = code || MealPlanCode.RO
    const plan = mealPlans.find(p => p.code === resolvedCode)
    return plan ? `${plan.code} – ${plan.name}` : resolvedCode
  }

  const calculateMealPlanAdjustment = (reservation: Reservation) => {
    const taxableAmount = reservation.totalAmount - reservation.tax
    return taxableAmount - (reservation.baseRate + reservation.seasonalPricing + reservation.channelPricing)
  }

  // Table columns
  const reservationColumns = [
    {
      key: 'reservationNumber',
      header: 'Reservation #',
      render: (reservation: Reservation) => (
        <span className="font-medium text-primary">{reservation.reservationNumber}</span>
      ),
    },
    {
      key: 'guestName',
      header: 'Guest',
      render: (reservation: Reservation) => (
        <div>
          <div className="font-medium">{reservation.guestName}</div>
          <div className="text-sm text-textSecondary">{reservation.guestEmail}</div>
        </div>
      ),
    },
    {
      key: 'roomNumber',
      header: 'Room',
      render: (reservation: Reservation) => (
        <div>
          <div className="font-medium">{reservation.roomNumber}</div>
          <div className="text-sm text-textSecondary">{reservation.roomType}</div>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Check-In / Check-Out',
      render: (reservation: Reservation) => (
        <div>
          <div className="text-sm">{new Date(reservation.checkInDate).toLocaleDateString()}</div>
          <div className="text-sm text-textSecondary">{new Date(reservation.checkOutDate).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      key: 'mealPlanCode',
      header: 'Meal Plan',
      render: (reservation: Reservation) => (
        <Badge variant="outline">{getMealPlanLabel(reservation.mealPlanCode)}</Badge>
      ),
    },
    {
      key: 'channel',
      header: 'Channel',
      render: (reservation: Reservation) => (
        <Badge variant="outline">{reservation.channel}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (reservation: Reservation) => (
        <Badge variant={getStatusBadgeVariant(reservation.status)}>{reservation.status}</Badge>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      render: (reservation: Reservation) => (
        <div>
          <div className="font-medium">${reservation.totalAmount.toFixed(2)}</div>
          {reservation.pendingAmount > 0 && (
            <div className="text-sm text-error">Pending: ${reservation.pendingAmount.toFixed(2)}</div>
          )}
        </div>
      ),
      className: 'text-right',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (reservation: Reservation) => (
        <div className="flex items-center justify-end gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setSelectedReservation(reservation)
              setIsDetailsModalOpen(true)
            }}
            aria-label="View details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {reservation.status === ReservationStatus.Confirmed && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleCheckIn(reservation)}
              aria-label="Check-in"
            >
              <LogIn className="h-4 w-4 text-green-500" />
            </Button>
          )}
          {reservation.status === ReservationStatus.CheckedIn && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleCheckOut(reservation)}
              aria-label="Check-out"
            >
              <LogOut className="h-4 w-4 text-blue-500" />
            </Button>
          )}
          {(reservation.status === ReservationStatus.Confirmed || reservation.status === ReservationStatus.CheckedIn) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleCancel(reservation)}
              aria-label="Cancel"
            >
              <XCircle className="h-4 w-4 text-error" />
            </Button>
          )}
        </div>
      ),
      className: 'text-right',
    },
  ]

  // Inquiry columns
  const inquiryColumns = [
    {
      key: 'guestName',
      header: 'Guest',
      render: (inquiry: ReservationInquiry) => (
        <div>
          <div className="font-medium">{inquiry.guestName}</div>
          <div className="text-sm text-textSecondary">{inquiry.guestEmail}</div>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Requested Dates',
      render: (inquiry: ReservationInquiry) => (
        <div>
          <div className="text-sm">{new Date(inquiry.checkInDate).toLocaleDateString()}</div>
          <div className="text-sm text-textSecondary">{new Date(inquiry.checkOutDate).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      key: 'guests',
      header: 'Guests',
      render: (inquiry: ReservationInquiry) => (
        <div>
          <div className="text-sm">{inquiry.adults} Adults</div>
          {inquiry.children > 0 && (
            <div className="text-sm text-textSecondary">{inquiry.children} Children</div>
          )}
        </div>
      ),
    },
    {
      key: 'preferredRoomType',
      header: 'Room Type',
      render: (inquiry: ReservationInquiry) => (
        <span className="text-sm">{inquiry.preferredRoomType || 'Any'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (inquiry: ReservationInquiry) => {
        const variant = inquiry.status === 'Converted' ? 'primary' : 
                       inquiry.status === 'Rejected' ? 'danger' : 'secondary'
        return <Badge variant={variant}>{inquiry.status}</Badge>
      },
    },
    {
      key: 'createdAt',
      header: 'Received',
      render: (inquiry: ReservationInquiry) => (
        <span className="text-sm">{new Date(inquiry.createdAt).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (inquiry: ReservationInquiry) => (
        <div className="flex items-center justify-end gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setSelectedReservation(null)
              setIsInquiryModalOpen(true)
            }}
            aria-label="View inquiry"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {inquiry.status === 'Pending' && (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  // Convert to reservation
                  alert('Convert to reservation functionality')
                }}
                aria-label="Convert"
              >
                <CheckCircle className="h-4 w-4 text-green-500" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setInquiries(inquiries.map(i => 
                    i.id === inquiry.id ? { ...i, status: 'Rejected' } : i
                  ))
                }}
                aria-label="Reject"
              >
                <XCircle className="h-4 w-4 text-error" />
              </Button>
            </>
          )}
        </div>
      ),
      className: 'text-right',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 animate-fadeIn">
        <h2 className="text-3xl font-bold text-text">Reservations Management</h2>
        <div className="flex gap-3">
          <Button variant="outline" icon={Download}>
            Export
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => setIsCreateModalOpen(true)}>
            Add Reservation
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <DashboardWidget 
          metric={{
            title: 'Total Reservations',
            value: kpis.total,
            icon: Calendar,
            colorClass: 'text-primary',
          }}
        />
        <DashboardWidget 
          metric={{
            title: 'Confirmed',
            value: kpis.confirmed,
            icon: Clock,
            colorClass: 'text-secondary',
          }}
        />
        <DashboardWidget 
          metric={{
            title: 'Checked-In',
            value: kpis.checkedIn,
            icon: CheckCircle,
            colorClass: 'text-green-500',
          }}
        />
        <DashboardWidget 
          metric={{
            title: 'Checked-Out',
            value: kpis.checkedOut,
            icon: LogOut,
            colorClass: 'text-blue-500',
          }}
        />
        <DashboardWidget 
          metric={{
            title: 'Cancelled',
            value: kpis.cancelled,
            icon: XCircle,
            colorClass: 'text-error',
          }}
        />
        <DashboardWidget 
          metric={{
            title: 'Total Revenue',
            value: `$${kpis.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            colorClass: 'text-success',
          }}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab('reservations')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'reservations'
              ? 'text-primary border-b-2 border-primary'
              : 'text-textSecondary hover:text-text'
          }`}
        >
          Reservations ({reservations.length})
        </button>
        <button
          onClick={() => setActiveTab('inquiries')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'inquiries'
              ? 'text-primary border-b-2 border-primary'
              : 'text-textSecondary hover:text-text'
          }`}
        >
          Inquiries ({inquiries.length})
        </button>
      </div>

      {/* Filters and Search */}
      {activeTab === 'reservations' && (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by guest name, reservation #, room number, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          <Dropdown
            trigger={
              <Button variant="outline" icon={Filter}>
                Status: {statusFilter}
              </Button>
            }
          >
            <DropdownItem onClick={() => setStatusFilter('All')}>All</DropdownItem>
            {Object.values(ReservationStatus).map(status => (
              <DropdownItem key={status} onClick={() => setStatusFilter(status)}>
                {status}
              </DropdownItem>
            ))}
          </Dropdown>
          <Dropdown
            trigger={
              <Button variant="outline" icon={Filter}>
                Channel: {channelFilter}
              </Button>
            }
          >
            <DropdownItem onClick={() => setChannelFilter('All')}>All</DropdownItem>
            {Object.values(BookingChannel).map(channel => (
              <DropdownItem key={channel} onClick={() => setChannelFilter(channel)}>
                {channel}
              </DropdownItem>
            ))}
          </Dropdown>
        <Dropdown
          trigger={
            <Button variant="outline" icon={Filter}>
              Meal Plan: {mealPlanFilter}
            </Button>
          }
        >
          <DropdownItem onClick={() => setMealPlanFilter('All')}>All</DropdownItem>
          {mealPlans.map(plan => (
            <DropdownItem key={plan.code} onClick={() => setMealPlanFilter(plan.code)}>
              {plan.code} – {plan.name}
            </DropdownItem>
          ))}
        </Dropdown>
        </div>
      )}

      {/* Reservations Table */}
      {activeTab === 'reservations' && (
        <Table<Reservation>
          data={filteredReservations}
          columns={reservationColumns}
          emptyMessage="No reservations found matching your criteria."
        />
      )}

      {/* Inquiries Table */}
      {activeTab === 'inquiries' && (
        <Table<ReservationInquiry>
          data={inquiries}
          columns={inquiryColumns}
          emptyMessage="No inquiries found."
        />
      )}

      {/* Create Reservation Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setShowRoomSearch(false)
          setAvailableRooms([])
        }}
        title="Create New Reservation"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">Guest *</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              value={formData.guestId}
              onChange={(e) => setFormData({ ...formData, guestId: e.target.value })}
              required
            >
              <option value="">Select a guest</option>
              {MOCK_GUESTS.map(guest => (
                <option key={guest.id} value={guest.id}>
                  {guest.fullName} ({guest.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Check-In Date"
              type="date"
              value={formData.checkInDate}
              onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              required
            />
            <FormField
              label="Check-Out Date"
              type="date"
              value={formData.checkOutDate}
              onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
              min={formData.checkInDate || new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Adults"
              type="number"
              value={formData.adults}
              onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value) || 1 })}
              min={1}
              required
            />
            <FormField
              label="Children"
              type="number"
              value={formData.children}
              onChange={(e) => setFormData({ ...formData, children: parseInt(e.target.value) || 0 })}
              min={0}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Booking Channel</label>
              <select
                className="w-full px-4 py-2 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value as BookingChannel })}
              >
                {Object.values(BookingChannel).map(channel => (
                  <option key={channel} value={channel}>{channel}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Payment Method</label>
              <select
                className="w-full px-4 py-2 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
              >
                {Object.values(PaymentMethod).map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Meal Plan</label>
            <select
              className="w-full px-4 py-2 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={formData.mealPlanCode}
              onChange={(e) => setFormData({ ...formData, mealPlanCode: e.target.value as MealPlanCode })}
            >
              {mealPlans.map(plan => (
                <option key={plan.code} value={plan.code}>
                  {plan.code} – {plan.name} {plan.markupType === 'Percentage' ? `(+${plan.markupValue}% per stay)` : `(+${plan.markupValue} per night)`}
                </option>
              ))}
            </select>
            <p className="text-xs text-textSecondary mt-1">
              Applied to pricing preview and invoices automatically.
            </p>
          </div>

          {!showRoomSearch ? (
            <Button 
              variant="primary" 
              className="w-full" 
              onClick={searchAvailableRooms}
              disabled={!formData.checkInDate || !formData.checkOutDate || !formData.guestId}
            >
              Search Available Rooms
            </Button>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text">Available Rooms</h3>
              {availableRooms.length === 0 ? (
                <p className="text-textSecondary">No rooms available for the selected dates.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableRooms.map(room => {
                    const pricing = calculatePricing(room)
                    return (
                      <Card key={room.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-text">Room {room.number}</h4>
                              <Badge variant="outline">{room.type}</Badge>
                            </div>
                            <p className="text-sm text-textSecondary mb-2">{room.area} • Capacity: {room.capacity}</p>
                            <p className="text-sm text-textSecondary mb-3">Amenities: {room.amenities.join(', ')}</p>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-textSecondary">Base Rate ({pricing.nights} nights):</span>
                                <span className="text-text">${pricing.baseRate.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-textSecondary">Seasonal Pricing:</span>
                                <span className="text-text">${pricing.seasonalPricing.toFixed(2)}</span>
                              </div>
                              {pricing.channelPricing !== 0 && (
                                <div className="flex justify-between">
                                  <span className="text-textSecondary">Channel Discount:</span>
                                  <span className="text-success">${pricing.channelPricing.toFixed(2)}</span>
                                </div>
                              )}
                              {pricing.mealPlanMarkup > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-textSecondary">
                                    Meal Plan ({getMealPlanLabel(pricing.mealPlanCode)}):
                                  </span>
                                  <span className="text-text">${pricing.mealPlanMarkup.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-textSecondary">Tax (10%):</span>
                                <span className="text-text">${pricing.tax.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t border-border">
                                <span className="font-semibold text-text">Total Amount:</span>
                                <span className="font-bold text-primary text-lg">${pricing.totalAmount.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="primary"
                            onClick={() => handleCreateReservation(room)}
                            className="ml-4"
                          >
                            Reserve
                          </Button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">Notes (Optional)</label>
            <textarea
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Add any special requests or notes..."
            />
          </div>
        </div>
      </Modal>

      {/* Reservation Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={selectedReservation ? `Reservation ${selectedReservation.reservationNumber}` : 'Reservation Details'}
      >
        {selectedReservation && (() => {
          const mealPlanAdjustment = calculateMealPlanAdjustment(selectedReservation)
          return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-textSecondary">Guest Name</p>
                <p className="font-medium text-text">{selectedReservation.guestName}</p>
              </div>
              <div>
                <p className="text-sm text-textSecondary">Email</p>
                <p className="font-medium text-text">{selectedReservation.guestEmail}</p>
              </div>
              <div>
                <p className="text-sm text-textSecondary">Phone</p>
                <p className="font-medium text-text">{selectedReservation.guestPhone}</p>
              </div>
              <div>
                <p className="text-sm text-textSecondary">Room</p>
                <p className="font-medium text-text">{selectedReservation.roomNumber} - {selectedReservation.roomType}</p>
              </div>
              <div>
                <p className="text-sm text-textSecondary">Check-In</p>
                <p className="font-medium text-text">{new Date(selectedReservation.checkInDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-textSecondary">Check-Out</p>
                <p className="font-medium text-text">{new Date(selectedReservation.checkOutDate).toLocaleDateString()}</p>
              </div>
              <div className="col-span-2 space-y-2">
                <p className="text-sm text-textSecondary">Meal Plan</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{getMealPlanLabel(selectedReservation.mealPlanCode)}</Badge>
                  <span className="text-xs text-textSecondary">
                    Displayed on invoices and booking confirmations.
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    className="w-full sm:w-auto flex-1 px-4 py-2 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
                    value={detailsMealPlanCode}
                    onChange={(e) => setDetailsMealPlanCode(e.target.value as MealPlanCode)}
                  >
                    {mealPlans.map(plan => (
                      <option key={plan.code} value={plan.code}>
                        {plan.code} – {plan.name} ({plan.markupType === 'Percentage' ? `+${plan.markupValue}%` : `+$${plan.markupValue}`})
                      </option>
                    ))}
                  </select>
                  <Button variant="primary" onClick={handleUpdateReservationMealPlan} size="sm">
                    Update Meal Plan
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm text-textSecondary">Guests</p>
                <p className="font-medium text-text">{selectedReservation.adults} Adults, {selectedReservation.children} Children</p>
              </div>
              <div>
                <p className="text-sm text-textSecondary">Channel</p>
                <Badge variant="outline">{selectedReservation.channel}</Badge>
              </div>
              <div>
                <p className="text-sm text-textSecondary">Status</p>
                <Badge variant={getStatusBadgeVariant(selectedReservation.status)}>{selectedReservation.status}</Badge>
              </div>
              <div>
                <p className="text-sm text-textSecondary">Payment Method</p>
                <p className="font-medium text-text">{selectedReservation.paymentMethod}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="font-semibold text-text mb-3">Pricing Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-textSecondary">Base Rate:</span>
                  <span className="text-text">${selectedReservation.baseRate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textSecondary">Seasonal Pricing:</span>
                  <span className="text-text">${selectedReservation.seasonalPricing.toFixed(2)}</span>
                </div>
                {selectedReservation.channelPricing !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-textSecondary">Channel Pricing:</span>
                    <span className={selectedReservation.channelPricing < 0 ? 'text-success' : 'text-text'}>
                      ${selectedReservation.channelPricing.toFixed(2)}
                    </span>
                  </div>
                )}
                {Math.abs(mealPlanAdjustment) > 0.01 && (
                  <div className="flex justify-between">
                    <span className="text-textSecondary">
                      Meal Plan ({getMealPlanLabel(selectedReservation.mealPlanCode)}):
                    </span>
                    <span className="text-text">${mealPlanAdjustment.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-textSecondary">Tax:</span>
                  <span className="text-text">${selectedReservation.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-semibold text-text">Total Amount:</span>
                  <span className="font-bold text-primary">${selectedReservation.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textSecondary">Paid:</span>
                  <span className="text-success">${selectedReservation.paidAmount.toFixed(2)}</span>
                </div>
                {selectedReservation.pendingAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-textSecondary">Pending:</span>
                    <span className="text-error">${selectedReservation.pendingAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {selectedReservation.notes && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-textSecondary">Notes</p>
                <p className="text-text">{selectedReservation.notes}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
              <Button variant="outline" icon={Download}>Download PDF</Button>
              {selectedReservation.status === ReservationStatus.Confirmed && (
                <Button variant="primary" icon={LogIn} onClick={() => {
                  handleCheckIn(selectedReservation)
                  setIsDetailsModalOpen(false)
                }}>
                  Check-In
                </Button>
              )}
              {selectedReservation.status === ReservationStatus.CheckedIn && (
                <Button variant="primary" icon={LogOut} onClick={() => {
                  handleCheckOut(selectedReservation)
                  setIsDetailsModalOpen(false)
                }}>
                  Check-Out
                </Button>
              )}
            </div>
          </div>
          )
        })()}
      </Modal>
    </div>
  )
}

export default ReservationsPage

