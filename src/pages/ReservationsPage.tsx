import React, { useEffect, useMemo, useState } from 'react'
import { MOCK_RESERVATIONS, MOCK_RESERVATION_INQUIRIES, MOCK_ROOM_VIEW_TYPES } from '../constants'
import { Reservation, ReservationInquiry, ReservationStatus, PaymentMethod, BookingChannel, Room, RoomStatus, Guest, MealPlanCode, RoomViewType, InquiryStatus } from '../types'
import { useRoomsStore } from '../store/roomsStore'
import { useMealPlansStore } from '../store/mealPlansStore'
import { useGuestsStore } from '../store/guestsStore'
import { useAuthStore } from '../store/authStore'
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
  Plus, Search, Eye, Calendar, 
  CheckCircle, XCircle, Clock, DollarSign, 
  Filter, Download, LogOut
} from 'lucide-react'

const ReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>(MOCK_RESERVATIONS)
  const [inquiries, setInquiries] = useState<ReservationInquiry[]>(MOCK_RESERVATION_INQUIRIES)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'All'>('All')
  const [channelFilter, setChannelFilter] = useState<BookingChannel | 'All'>('All')
  const [mealPlanFilter, setMealPlanFilter] = useState<MealPlanCode | 'All'>('All')
  const [dashboardFilter, setDashboardFilter] = useState<'All' | 'Checked-In' | 'Checked-Out' | 'Reserved' | 'Available'>('All')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [activeTab, setActiveTab] = useState<'reservations' | 'inquiries'>('reservations')
  const [detailsMealPlanCode, setDetailsMealPlanCode] = useState<MealPlanCode>(MealPlanCode.RO)
  const { user } = useAuthStore()
  
  // Check-In form state
  const [checkInForm, setCheckInForm] = useState({
    roomId: '',
    roomNumber: '',
    mealPlanCode: MealPlanCode.RO,
    adults: 1,
    children: 0,
    notes: '',
  })
  
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
  const guestsStore = useGuestsStore()
  const [showRoomSearch, setShowRoomSearch] = useState(false)
  
  // Step-by-step workflow state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [isGuestRegisterOpen, setIsGuestRegisterOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false)
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false)
  const [guestSearchTerm, setGuestSearchTerm] = useState('')
  const [viewTypeFilter, setViewTypeFilter] = useState<string>('All')
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>('All')
  const [viewTypes] = useState<RoomViewType[]>(MOCK_ROOM_VIEW_TYPES)
  
  // Guest registration form
  const [guestForm, setGuestForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    gender: '',
    documentType: '',
    documentNumber: '',
  })
  
  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentMethod: PaymentMethod.Card,
    notes: '',
  })
  
  // Extension form
  const [extensionForm, setExtensionForm] = useState({
    extraDays: 1,
    adults: 1,
    children: 0,
  })
  useEffect(() => {
    if (selectedReservation) {
      setDetailsMealPlanCode(selectedReservation.mealPlanCode || MealPlanCode.RO)
    }
  }, [selectedReservation])

  // Get today's date for filtering
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  
  // Calculate KPIs with today's focus
  const kpis = useMemo(() => {
    const todayReservations = reservations.filter(r => {
      const checkInDate = r.checkInDate.split('T')[0]
      const checkOutDate = r.checkOutDate.split('T')[0]
      return checkInDate === today || checkOutDate === today
    })
    
    const total = reservations.length
    const confirmed = reservations.filter(r => r.status === ReservationStatus.Confirmed).length
    const checkedIn = reservations.filter(r => r.status === ReservationStatus.CheckedIn).length
    const checkedOut = reservations.filter(r => r.status === ReservationStatus.CheckedOut).length
    const cancelled = reservations.filter(r => r.status === ReservationStatus.Cancelled).length
    const checkedInToday = todayReservations.filter(r => r.status === ReservationStatus.CheckedIn).length
    const checkedOutToday = todayReservations.filter(r => r.status === ReservationStatus.CheckedOut && r.checkOutDate.split('T')[0] === today).length
    const reservedToday = todayReservations.filter(r => r.status === ReservationStatus.Confirmed && r.checkInDate.split('T')[0] === today).length
    const availableRoomsToday = roomsStore.rooms.filter(r => r.status === RoomStatus.Available).length
    const totalRevenue = reservations
      .filter(r => r.status !== ReservationStatus.Cancelled)
      .reduce((sum, r) => sum + r.totalAmount, 0)
    
    return {
      total,
      confirmed,
      checkedIn,
      checkedOut,
      cancelled,
      checkedInToday,
      checkedOutToday,
      reservedToday,
      availableRoomsToday,
      totalRevenue,
    }
  }, [reservations, today, roomsStore.rooms])

  // Filter reservations with dashboard filter and today's focus
  const filteredReservations = useMemo(() => {
    let filtered = reservations
    
    // Apply dashboard filter (today's data by default)
    if (dashboardFilter === 'Checked-In') {
      filtered = filtered.filter(r => r.status === ReservationStatus.CheckedIn && r.checkInDate.split('T')[0] === today)
    } else if (dashboardFilter === 'Checked-Out') {
      filtered = filtered.filter(r => r.status === ReservationStatus.CheckedOut && r.checkOutDate.split('T')[0] === today)
    } else if (dashboardFilter === 'Reserved') {
      filtered = filtered.filter(r => r.status === ReservationStatus.Confirmed && r.checkInDate.split('T')[0] === today)
    } else if (dashboardFilter === 'Available') {
      // Show available rooms (not reservations)
      return []
    } else {
      // All - show today's reservations
      filtered = filtered.filter(r => {
        const checkInDate = r.checkInDate.split('T')[0]
        const checkOutDate = r.checkOutDate.split('T')[0]
        return checkInDate === today || checkOutDate === today
      })
    }
    
    // Apply other filters
    return filtered.filter(reservation => {
      const matchesSearch = 
        reservation.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.reservationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.guestEmail.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'All' || reservation.status === statusFilter
      const matchesChannel = channelFilter === 'All' || reservation.channel === channelFilter
      const matchesMealPlan = mealPlanFilter === 'All' || (reservation.mealPlanCode || MealPlanCode.RO) === mealPlanFilter
      
      return matchesSearch && matchesStatus && matchesChannel && matchesMealPlan
    }).sort((a, b) => {
      // Display order: Check-Out first, then Check-In, then by room number
      if (a.status === ReservationStatus.CheckedOut && b.status !== ReservationStatus.CheckedOut) return -1
      if (a.status !== ReservationStatus.CheckedOut && b.status === ReservationStatus.CheckedOut) return 1
      if (a.status === ReservationStatus.CheckedIn && b.status !== ReservationStatus.CheckedIn) return -1
      if (a.status !== ReservationStatus.CheckedIn && b.status === ReservationStatus.CheckedIn) return 1
      return a.roomNumber.localeCompare(b.roomNumber)
    })
  }, [reservations, searchTerm, statusFilter, channelFilter, mealPlanFilter, dashboardFilter, today])
  
  // Get available rooms for display when filter is 'Available'
  const availableRoomsForDisplay = useMemo(() => {
    if (dashboardFilter !== 'Available') return []
    return roomsStore.rooms
      .filter(r => r.status === RoomStatus.Available)
      .sort((a, b) => a.number.localeCompare(b.number))
  }, [dashboardFilter, roomsStore.rooms])

  // Step 1: Guest Search/Registration
  const handleGuestSearch = (searchValue: string) => {
    setGuestSearchTerm(searchValue)
    if (!searchValue.trim()) return
    
    // Search by email, phone, or document number
    const foundByEmail = guestsStore.findByEmail(searchValue)
    const foundByPhone = guestsStore.findByPhone(searchValue)
    const foundByDocument = guestsStore.findByDocument(searchValue)
    
    const found = foundByEmail || foundByPhone || foundByDocument
    if (found) {
      setSelectedGuest(found)
      setFormData({ ...formData, guestId: found.id })
      // Guest search completed
      setCurrentStep(2)
    }
  }
  
  const handleRegisterGuest = () => {
    try {
      if (!guestForm.fullName || !guestForm.email || !guestForm.phone || !guestForm.documentNumber) {
        alert('Please fill all required fields')
        return
      }
      
      const newGuest = guestsStore.create({
        ...guestForm,
        avatarUrl: '',
      })
      setSelectedGuest(newGuest)
      setFormData({ ...formData, guestId: newGuest.id })
      setIsGuestRegisterOpen(false)
      setGuestForm({
        fullName: '',
        email: '',
        phone: '',
        country: '',
        gender: '',
        documentType: '',
        documentNumber: '',
      })
      setCurrentStep(2)
    } catch (error: any) {
      alert(error.message || 'Error registering guest')
    }
  }
  
  // Step 2: Validate Stay Details
  const validateStayDetails = () => {
    if (!formData.checkInDate || !formData.checkOutDate) {
      alert('Please select check-in and check-out dates')
      return false
    }
    
    if (new Date(formData.checkOutDate) <= new Date(formData.checkInDate)) {
      alert('Check-out date must be after check-in date')
      return false
    }
    
    const totalGuests = formData.adults + formData.children
    if (totalGuests > 5) {
      alert('Maximum 5 people per room')
      return false
    }
    
    return true
  }
  
  // Step 3: Search available rooms with filters
  const searchAvailableRooms = () => {
    if (!validateStayDetails()) return

    const totalGuests = formData.adults + formData.children
    const available = roomsStore.rooms.filter(room => {
      // Only show Available rooms
      if (room.status !== RoomStatus.Available) return false
      
      // Check capacity
      if (room.capacity < totalGuests) return false
      
      // Filter by room type
      if (roomTypeFilter !== 'All' && room.type !== roomTypeFilter) return false
      
      // Filter by view type
      if (viewTypeFilter !== 'All' && room.viewTypeId !== viewTypeFilter) return false
      
      // Check if room is reserved during the dates
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
    setCurrentStep(3)
  }

  // Step 4: Calculate pricing for a room (with view type surcharge)
  const calculatePricing = (room: Room) => {
    const checkIn = new Date(formData.checkInDate)
    const checkOut = new Date(formData.checkOutDate)
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    
    const baseRate = room.price * nights
    const seasonalPricing = baseRate * 0.1 // 10% seasonal
    
    // Channel pricing adjustments
    const channelAdjustment = formData.channel === BookingChannel.BookingCom ? baseRate * -0.05 : 
                           formData.channel === BookingChannel.Expedia ? baseRate * -0.05 : 0
    
    // Meal plan markup
    const planCode = formData.mealPlanCode || room.mealPlanCode || MealPlanCode.RO
    const selectedPlan = mealPlans.find(plan => plan.code === planCode)
    const mealPlanMarkup = selectedPlan
      ? selectedPlan.markupType === 'Percentage'
        ? (baseRate * selectedPlan.markupValue) / 100
        : selectedPlan.markupValue * nights
      : 0
    
    // View type surcharge
    let viewTypeSurcharge = 0
    if (room.viewTypeId) {
      const viewType = viewTypes.find(vt => vt.id === room.viewTypeId)
      if (viewType && viewType.surchargeValue) {
        if (viewType.surchargeType === 'Percentage') {
          viewTypeSurcharge = (baseRate * viewType.surchargeValue) / 100
        } else {
          viewTypeSurcharge = viewType.surchargeValue * nights
        }
      }
    }
    
    const taxableAmount = baseRate + seasonalPricing + channelAdjustment + mealPlanMarkup + viewTypeSurcharge
    const tax = taxableAmount * 0.1 // 10% tax
    const totalAmount = taxableAmount + tax
    
    return {
      baseRate,
      seasonalPricing,
      channelPricing: channelAdjustment,
      mealPlanMarkup,
      viewTypeSurcharge,
      tax,
      totalAmount,
      nights,
      mealPlanCode: planCode,
    }
  }

  // Step 5: Guest Information Confirmation
  const handleGuestConfirmation = () => {
    if (!selectedGuest) {
      alert('Please select a guest')
      return
    }
    setCurrentStep(6)
  }
  
  // Step 6: Booking Confirmation
  const handleRoomSelection = (room: Room) => {
    setSelectedRoom(room)
    setCurrentStep(4) // Show price calculation
  }
  
  const handleConfirmBooking = () => {
    if (!selectedRoom || !selectedGuest) {
      alert('Please select a room and guest')
      return
    }

    const pricing = calculatePricing(selectedRoom)
    const reservationNumber = `RES-${new Date().getFullYear()}-${String(reservations.length + 1).padStart(3, '0')}`
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(reservations.length + 1).padStart(3, '0')}`

    const newReservation: Reservation = {
      id: `RES${reservations.length + 1}`,
      reservationNumber,
      guestId: selectedGuest.id,
      guestName: selectedGuest.fullName,
      guestEmail: selectedGuest.email,
      guestPhone: selectedGuest.phone,
      roomId: selectedRoom.id,
      roomNumber: selectedRoom.number,
      roomType: selectedRoom.type,
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
    roomsStore.markReserved(selectedRoom.id)
    roomsStore.update(selectedRoom.id, { mealPlanCode: formData.mealPlanCode })
    
    // Reset form
    setIsCreateModalOpen(false)
    setShowRoomSearch(false)
    setCurrentStep(1)
    setSelectedRoom(null)
    setSelectedGuest(null)
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
    setViewTypeFilter('All')
    setRoomTypeFilter('All')
    
    alert(`Reservation ${reservationNumber} created successfully! Room status updated to Reserved.`)
  }
  

  // Step 9: Check-In and Stay Management with Enhanced Modal
  const handleCheckIn = (reservation: Reservation) => {
    // Preconditions validation
    if (reservation.status !== ReservationStatus.Confirmed) {
      alert('Only confirmed reservations can be checked in')
      return
    }
    
    const checkInDate = new Date(reservation.checkInDate)
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    checkInDate.setHours(0, 0, 0, 0)
    
    if (checkInDate > todayDate) {
      alert('Check-in date must be today or earlier. Cannot check in for future dates.')
      return
    }
    
    // Open check-in confirmation modal
    setSelectedReservation(reservation)
    setCheckInForm({
      roomId: reservation.roomId,
      roomNumber: reservation.roomNumber,
      mealPlanCode: reservation.mealPlanCode || MealPlanCode.RO,
      adults: reservation.adults,
      children: reservation.children,
      notes: reservation.notes || '',
    })
    setIsCheckInModalOpen(true)
  }
  
  const processCheckIn = () => {
    if (!selectedReservation) return
    
    const oldRoomId = selectedReservation.roomId
    const newRoomId = checkInForm.roomId
    
    // Update reservation
    const updatedReservation = {
      ...selectedReservation,
      roomId: newRoomId,
      roomNumber: checkInForm.roomNumber,
      mealPlanCode: checkInForm.mealPlanCode,
      adults: checkInForm.adults,
      children: checkInForm.children,
      status: ReservationStatus.CheckedIn,
      updatedAt: new Date().toISOString(),
      notes: checkInForm.notes,
    }
    
    setReservations(reservations.map(r => 
      r.id === selectedReservation.id ? updatedReservation : r
    ))
    
    // Update room statuses
    if (oldRoomId !== newRoomId) {
      // Release old room
      roomsStore.markAvailable(oldRoomId)
      // Mark new room as occupied
      roomsStore.markOccupied(newRoomId)
    } else {
      // Same room, just mark as occupied
      roomsStore.markOccupied(newRoomId)
    }
    
    // Log audit event
    const room = roomsStore.getById(newRoomId)
    if (room) {
      roomsStore.update(newRoomId, {
        mealPlanCode: checkInForm.mealPlanCode,
        updatedBy: user?.name || 'Receptionist',
      })
    }
    
    setIsCheckInModalOpen(false)
    alert('Guest checked in successfully! Room status updated to Occupied. Dashboards updated automatically.')
  }

  // Step 7: Payment Handling
  const handlePayment = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setPaymentForm({
      amount: reservation.pendingAmount,
      paymentMethod: reservation.paymentMethod,
      notes: '',
    })
    setIsPaymentModalOpen(true)
  }
  
  const processPayment = () => {
    if (!selectedReservation) return
    
    const newPaidAmount = selectedReservation.paidAmount + paymentForm.amount
    const newPendingAmount = Math.max(0, selectedReservation.totalAmount - newPaidAmount)
    
    setReservations(reservations.map(r => 
      r.id === selectedReservation.id 
        ? { 
            ...r, 
            paidAmount: newPaidAmount,
            pendingAmount: newPendingAmount,
            paymentMethod: paymentForm.paymentMethod,
            updatedAt: new Date().toISOString(),
            notes: r.notes ? `${r.notes}\nPayment: $${paymentForm.amount.toFixed(2)} via ${paymentForm.paymentMethod} - ${new Date().toLocaleString()}` : `Payment: $${paymentForm.amount.toFixed(2)} via ${paymentForm.paymentMethod} - ${new Date().toLocaleString()}`,
          }
        : r
    ))
    
    setIsPaymentModalOpen(false)
    alert(`Payment of $${paymentForm.amount.toFixed(2)} recorded successfully!`)
  }
  
  // Step 10: Check-Out with Extension Option
  const handleCheckOut = (reservation: Reservation) => {
    // Preconditions validation
    if (reservation.status !== ReservationStatus.CheckedIn) {
      alert('Only checked-in reservations can be checked out')
      return
    }
    
    const checkOutDate = new Date(reservation.checkOutDate)
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    checkOutDate.setHours(0, 0, 0, 0)
    
    if (checkOutDate > todayDate) {
      alert('Check-out date must be today or earlier. Cannot check out for future dates.')
      return
    }

    setSelectedReservation(reservation)
    setIsCheckoutModalOpen(true)
  }
  
  const processCheckout = (extendStay: boolean) => {
    if (!selectedReservation) return
    
    if (extendStay) {
      setIsExtensionModalOpen(true)
      setIsCheckoutModalOpen(false)
      return
    }
    
    // Process check-out
    if (selectedReservation.pendingAmount > 0) {
      if (!window.confirm(`Pending amount: $${selectedReservation.pendingAmount.toFixed(2)}. Proceed with check-out?`)) {
        return
      }
    }

    setReservations(reservations.map(r => 
      r.id === selectedReservation.id 
        ? { ...r, status: ReservationStatus.CheckedOut, updatedAt: new Date().toISOString() }
        : r
    ))
    
    // Room becomes Dirty and housekeeping notified
    roomsStore.markDirty(selectedReservation.roomId)
    
    // Log audit event
    const room = roomsStore.getById(selectedReservation.roomId)
    if (room) {
      roomsStore.update(selectedReservation.roomId, {
        updatedBy: user?.name || 'Receptionist',
      })
    }
    
    // Update guest visit count and spending
    guestsStore.incrementVisitCount(selectedReservation.guestId)
    guestsStore.updateLifetimeSpending(selectedReservation.guestId, selectedReservation.totalAmount)
    
    setIsCheckoutModalOpen(false)
    alert('Guest checked out successfully! Room status updated to Dirty. Housekeeping notified. Invoice generated.')
  }
  
  // Available Button Functionality
  const handleMarkAvailable = (roomId: string) => {
    const room = roomsStore.getById(roomId)
    if (!room) return
    
    if (room.status !== RoomStatus.Dirty && room.status !== RoomStatus.UnderMaintenance) {
      alert('Only Dirty or Under Maintenance rooms can be marked as Available')
      return
    }
    
    if (!window.confirm(`Mark Room ${room.number} as Available?`)) {
      return
    }
    
    // Update room status
    roomsStore.markAvailable(roomId)
    
    // Log audit event
    roomsStore.update(roomId, {
      updatedBy: user?.name || 'Staff',
    })
    
    alert(`Room ${room.number} marked as Available. Dashboard and calendar views updated.`)
  }
  
  const processExtension = () => {
    if (!selectedReservation) return
    
    const newCheckOutDate = new Date(selectedReservation.checkOutDate)
    newCheckOutDate.setDate(newCheckOutDate.getDate() + extensionForm.extraDays)
    
    // Check if same room is available for extension
    const isRoomAvailable = !reservations.some(res => 
      res.roomId === selectedReservation.roomId &&
      res.id !== selectedReservation.id &&
      res.status !== ReservationStatus.Cancelled &&
      res.status !== ReservationStatus.CheckedOut &&
      ((newCheckOutDate.toISOString().split('T')[0] >= res.checkInDate && newCheckOutDate.toISOString().split('T')[0] < res.checkOutDate) ||
       (selectedReservation.checkOutDate > res.checkInDate && selectedReservation.checkOutDate <= res.checkOutDate))
    )
    
    if (!isRoomAvailable) {
      // Suggest alternative rooms
      const alternativeRooms = roomsStore.rooms.filter(room => 
        room.id !== selectedReservation.roomId &&
        room.status === RoomStatus.Available &&
        room.capacity >= (extensionForm.adults + extensionForm.children)
      )
      
      if (alternativeRooms.length > 0) {
        alert(`Same room not available. Alternative rooms: ${alternativeRooms.map(r => r.number).join(', ')}`)
        setIsExtensionModalOpen(false)
        return
      } else {
        alert('No alternative rooms available for extension')
        setIsExtensionModalOpen(false)
        return
      }
    }
    
    // Extend stay
    const room = roomsStore.getById(selectedReservation.roomId)
    if (!room) return
    
    const newFormData = {
      ...formData,
      checkInDate: selectedReservation.checkOutDate,
      checkOutDate: newCheckOutDate.toISOString().split('T')[0],
      adults: extensionForm.adults,
      children: extensionForm.children,
    }
    
    const extendedNights = extensionForm.extraDays
    const extendedBaseRate = room.price * extendedNights
    const extendedTotal = extendedBaseRate * 1.1 // Include tax
    
    setReservations(reservations.map(r => 
      r.id === selectedReservation.id 
        ? { 
            ...r, 
            checkOutDate: newCheckOutDate.toISOString().split('T')[0],
            adults: extensionForm.adults,
            children: extensionForm.children,
            totalAmount: r.totalAmount + extendedTotal,
            pendingAmount: r.pendingAmount + extendedTotal,
            updatedAt: new Date().toISOString(),
          }
        : r
    ))
    
    setIsExtensionModalOpen(false)
    alert(`Stay extended by ${extensionForm.extraDays} day(s). New check-out date: ${newCheckOutDate.toLocaleDateString()}`)
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
      case ReservationStatus.Cancelled: return 'error'
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
              <CheckCircle className="h-4 w-4 text-green-500" />
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
        const variant = inquiry.status === InquiryStatus.Converted ? 'primary' : 
                       inquiry.status === InquiryStatus.Rejected ? 'error' : 'secondary'
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
              // View inquiry details
              alert(`Viewing inquiry for ${inquiry.guestName}`)
            }}
            aria-label="View inquiry"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {inquiry.status === InquiryStatus.Pending && (
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
                    i.id === inquiry.id ? { ...i, status: InquiryStatus.Rejected } : i
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
            title: 'Checked-In Today',
            value: kpis.checkedInToday,
            icon: CheckCircle,
            colorClass: 'text-green-500',
          }}
        />
        <DashboardWidget 
          metric={{
            title: 'Checked-Out Today',
            value: kpis.checkedOutToday,
            icon: LogOut,
            colorClass: 'text-blue-500',
          }}
        />
        <DashboardWidget 
          metric={{
            title: 'Reserved Today',
            value: kpis.reservedToday,
            icon: Clock,
            colorClass: 'text-secondary',
          }}
        />
        <DashboardWidget 
          metric={{
            title: 'Available Rooms',
            value: kpis.availableRoomsToday,
            icon: CheckCircle,
            colorClass: 'text-success',
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
      
      {/* Dashboard Filter Tabs */}
      {activeTab === 'reservations' && (
        <div className="flex gap-2 border-b border-border pb-2">
          <button
            onClick={() => setDashboardFilter('All')}
            className={`px-4 py-2 font-medium transition-colors ${
              dashboardFilter === 'All'
                ? 'text-primary border-b-2 border-primary'
                : 'text-textSecondary hover:text-text'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setDashboardFilter('Checked-In')}
            className={`px-4 py-2 font-medium transition-colors ${
              dashboardFilter === 'Checked-In'
                ? 'text-primary border-b-2 border-primary'
                : 'text-textSecondary hover:text-text'
            }`}
          >
            Checked-In ({kpis.checkedInToday})
          </button>
          <button
            onClick={() => setDashboardFilter('Checked-Out')}
            className={`px-4 py-2 font-medium transition-colors ${
              dashboardFilter === 'Checked-Out'
                ? 'text-primary border-b-2 border-primary'
                : 'text-textSecondary hover:text-text'
            }`}
          >
            Checked-Out ({kpis.checkedOutToday})
          </button>
          <button
            onClick={() => setDashboardFilter('Reserved')}
            className={`px-4 py-2 font-medium transition-colors ${
              dashboardFilter === 'Reserved'
                ? 'text-primary border-b-2 border-primary'
                : 'text-textSecondary hover:text-text'
            }`}
          >
            Reserved ({kpis.reservedToday})
          </button>
          <button
            onClick={() => setDashboardFilter('Available')}
            className={`px-4 py-2 font-medium transition-colors ${
              dashboardFilter === 'Available'
                ? 'text-primary border-b-2 border-primary'
                : 'text-textSecondary hover:text-text'
            }`}
          >
            Available ({kpis.availableRoomsToday})
          </button>
        </div>
      )}

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

      {/* Reservations Table or Available Rooms Table */}
      {activeTab === 'reservations' && dashboardFilter === 'Available' ? (
        <Table<Room>
          data={availableRoomsForDisplay}
          columns={[
            {
              key: 'number',
              header: 'Room Number',
              render: (room: Room) => <span className="font-medium">{room.number}</span>,
            },
            {
              key: 'type',
              header: 'Room Type',
              render: (room: Room) => <span>{room.type}</span>,
            },
            {
              key: 'capacity',
              header: 'Capacity',
              render: (room: Room) => <span>{room.capacity} guests</span>,
            },
            {
              key: 'price',
              header: 'Price',
              render: (room: Room) => <span className="font-semibold text-primary">${room.price.toFixed(2)}/night</span>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (room: Room) => <Badge variant="success">{room.status}</Badge>,
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (room: Room) => (
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleMarkAvailable(room.id)}
                  >
                    Mark Available
                  </Button>
                </div>
              ),
              className: 'text-right',
            },
          ]}
          emptyMessage="No available rooms found."
        />
      ) : activeTab === 'reservations' ? (
        <Table<Reservation>
          data={filteredReservations}
          columns={reservationColumns}
          emptyMessage="No reservations found matching your criteria."
        />
      ) : null}

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
          setCurrentStep(1)
          setSelectedRoom(null)
          setSelectedGuest(null)
          setGuestSearchTerm('')
          setViewTypeFilter('All')
          setRoomTypeFilter('All')
        }}
        title="Create New Reservation"
      >
        <div className="space-y-4">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5, 6].map(step => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === step ? 'bg-primary text-white' :
                    currentStep > step ? 'bg-success text-white' :
                    'bg-surface border border-border text-textSecondary'
                  }`}>
                    {currentStep > step ? '✓' : step}
                  </div>
                  {step < 6 && <div className={`w-8 h-0.5 ${currentStep > step ? 'bg-success' : 'bg-border'}`} />}
                </div>
              ))}
            </div>
          </div>
          
          {/* Step 1: Guest Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text">Step 1: Guest Selection or Registration</h3>
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-2">Search Guest (Email, Phone, or ID Number)</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter email, phone, or document number..."
                    value={guestSearchTerm}
                    onChange={(e) => {
                      setGuestSearchTerm(e.target.value)
                      if (e.target.value.trim()) {
                        handleGuestSearch(e.target.value)
                      }
                    }}
                    icon={Search}
                  />
                  <Button variant="outline" onClick={() => setIsGuestRegisterOpen(true)}>
                    Register New Guest
                  </Button>
                </div>
                {selectedGuest && (
                  <div className="mt-2 p-3 bg-success/10 border border-success rounded-lg">
                    <p className="text-sm text-text"><strong>Guest Found:</strong> {selectedGuest.fullName}</p>
                    <p className="text-xs text-textSecondary">{selectedGuest.email} • {selectedGuest.phone}</p>
                    <Button variant="primary" size="sm" className="mt-2" onClick={() => setCurrentStep(2)}>
                      Continue to Stay Details
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Step 2: Stay Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text">Step 2: Input Stay Details</h3>
              {selectedGuest && (
                <div className="p-3 bg-surface border border-border rounded-lg mb-4">
                  <p className="text-sm text-text"><strong>Guest:</strong> {selectedGuest.fullName}</p>
                </div>
              )}

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

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>Back</Button>
                <Button 
                  variant="primary" 
                  className="flex-1" 
                  onClick={searchAvailableRooms}
                  disabled={!formData.checkInDate || !formData.checkOutDate || !selectedGuest}
                >
                  Search Available Rooms
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 3: Room Availability Search */}
          {currentStep === 3 && showRoomSearch && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text">Step 3: Room Availability Search</h3>
              
              {/* Filters */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Room Type</label>
                  <select
                    className="w-full px-4 py-2 bg-surface border border-border rounded-xl text-text"
                    value={roomTypeFilter}
                    onChange={(e) => {
                      setRoomTypeFilter(e.target.value)
                      searchAvailableRooms()
                    }}
                  >
                    <option value="All">All Types</option>
                    {Array.from(new Set(roomsStore.rooms.map(r => r.type))).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">View Type</label>
                  <select
                    className="w-full px-4 py-2 bg-surface border border-border rounded-xl text-text"
                    value={viewTypeFilter}
                    onChange={(e) => {
                      setViewTypeFilter(e.target.value)
                      searchAvailableRooms()
                    }}
                  >
                    <option value="All">All View Types</option>
                    {viewTypes.filter(vt => vt.active).map(vt => (
                      <option key={vt.id} value={vt.id}>{vt.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {availableRooms.length === 0 ? (
                <p className="text-textSecondary">No rooms available for the selected dates and filters.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableRooms.map(room => {
                    const pricing = calculatePricing(room)
                    return (
                      <Card key={room.id} className="p-4 cursor-pointer hover:border-primary transition-colors" onClick={() => handleRoomSelection(room)}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-text">Room {room.number}</h4>
                              <Badge variant="outline">{room.type}</Badge>
                              {room.viewTypeName && <Badge variant="outline">{room.viewTypeName}</Badge>}
                            </div>
                            <p className="text-sm text-textSecondary mb-2">{room.area} • Capacity: {room.capacity}</p>
                            <p className="text-sm text-textSecondary mb-3">Amenities: {room.amenities.join(', ')}</p>
                            <div className="text-sm font-semibold text-primary">
                              ${pricing.totalAmount.toFixed(2)} total
                            </div>
                          </div>
                          <Button
                            variant="primary"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRoomSelection(room)
                            }}
                            className="ml-4"
                          >
                            Select
                          </Button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
              <Button variant="outline" onClick={() => setCurrentStep(2)}>Back</Button>
            </div>
          )}
          
          {/* Step 4: Price Calculation */}
          {currentStep === 4 && selectedRoom && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text">Step 4: Price Calculation</h3>
              <div className="p-4 bg-surface border border-border rounded-lg">
                <h4 className="font-semibold text-text mb-3">Room {selectedRoom.number} - {selectedRoom.type}</h4>
                {(() => {
                  const pricing = calculatePricing(selectedRoom)
                  return (
                    <div className="space-y-2 text-sm">
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
                          <span className="text-textSecondary">Channel Adjustment:</span>
                          <span className={pricing.channelPricing < 0 ? 'text-success' : 'text-text'}>
                            ${pricing.channelPricing.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {pricing.mealPlanMarkup > 0 && (
                        <div className="flex justify-between">
                          <span className="text-textSecondary">Meal Plan ({getMealPlanLabel(pricing.mealPlanCode)}):</span>
                          <span className="text-text">${pricing.mealPlanMarkup.toFixed(2)}</span>
                        </div>
                      )}
                      {pricing.viewTypeSurcharge && pricing.viewTypeSurcharge > 0 && (
                        <div className="flex justify-between">
                          <span className="text-textSecondary">View Type Surcharge:</span>
                          <span className="text-text">${pricing.viewTypeSurcharge.toFixed(2)}</span>
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
                  )
                })()}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>Back</Button>
                <Button variant="primary" className="flex-1" onClick={() => setCurrentStep(5)}>
                  Continue to Guest Confirmation
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 5: Guest Information Confirmation */}
          {currentStep === 5 && selectedGuest && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text">Step 5: Guest Information Confirmation</h3>
              <div className="p-4 bg-surface border border-border rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-textSecondary">Full Name</p>
                    <p className="font-medium text-text">{selectedGuest.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-textSecondary">Email</p>
                    <p className="font-medium text-text">{selectedGuest.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-textSecondary">Phone</p>
                    <p className="font-medium text-text">{selectedGuest.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-textSecondary">Country</p>
                    <p className="font-medium text-text">{selectedGuest.country}</p>
                  </div>
                  <div>
                    <p className="text-sm text-textSecondary">Document Type</p>
                    <p className="font-medium text-text">{selectedGuest.documentType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-textSecondary">Document Number</p>
                    <p className="font-medium text-text">{selectedGuest.documentNumber}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  // Open guest edit modal
                  const found = guestsStore.getById(selectedGuest.id)
                  if (found) {
                    setGuestForm({
                      fullName: found.fullName,
                      email: found.email,
                      phone: found.phone,
                      country: found.country,
                      gender: found.gender,
                      documentType: found.documentType,
                      documentNumber: found.documentNumber,
                    })
                  }
                }}>
                  Edit Guest Information
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(4)}>Back</Button>
                <Button variant="primary" className="flex-1" onClick={() => setCurrentStep(6)}>
                  Continue to Booking Confirmation
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 6: Booking Confirmation */}
          {currentStep === 6 && selectedRoom && selectedGuest && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text">Step 6: Booking Confirmation</h3>
              <div className="p-4 bg-surface border border-border rounded-lg space-y-4">
                <div>
                  <h4 className="font-semibold text-text mb-2">Reservation Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-textSecondary">Guest:</span>
                      <span className="text-text">{selectedGuest.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textSecondary">Room:</span>
                      <span className="text-text">{selectedRoom.number} - {selectedRoom.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textSecondary">Check-In:</span>
                      <span className="text-text">{new Date(formData.checkInDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textSecondary">Check-Out:</span>
                      <span className="text-text">{new Date(formData.checkOutDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textSecondary">Guests:</span>
                      <span className="text-text">{formData.adults} Adults, {formData.children} Children</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textSecondary">Channel:</span>
                      <span className="text-text">{formData.channel}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="font-semibold text-text">Total Amount:</span>
                      <span className="font-bold text-primary">${calculatePricing(selectedRoom).totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-textSecondary mb-2">Notes (Optional)</label>
                <textarea
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Add any special requests or notes..."
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(5)}>Back</Button>
                <Button variant="primary" className="flex-1" onClick={handleConfirmBooking}>
                  Confirm Booking
                </Button>
              </div>
            </div>
          )}

        </div>
      </Modal>
      
      {/* Guest Registration Modal */}
      <Modal
        isOpen={isGuestRegisterOpen}
        onClose={() => {
          setIsGuestRegisterOpen(false)
          setGuestForm({
            fullName: '',
            email: '',
            phone: '',
            country: '',
            gender: '',
            documentType: '',
            documentNumber: '',
          })
        }}
        title="Register New Guest"
      >
        <div className="space-y-4">
          <FormField
            label="Full Name *"
            value={guestForm.fullName}
            onChange={(e) => setGuestForm({ ...guestForm, fullName: e.target.value })}
            required
          />
          <FormField
            label="Email *"
            type="email"
            value={guestForm.email}
            onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
            required
          />
          <FormField
            label="Phone *"
            value={guestForm.phone}
            onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
            required
          />
          <FormField
            label="Country *"
            value={guestForm.country}
            onChange={(e) => setGuestForm({ ...guestForm, country: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Gender</label>
              <select
                className="w-full px-4 py-2 bg-surface border border-border rounded-xl text-text"
                value={guestForm.gender}
                onChange={(e) => setGuestForm({ ...guestForm, gender: e.target.value })}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Document Type</label>
              <select
                className="w-full px-4 py-2 bg-surface border border-border rounded-xl text-text"
                value={guestForm.documentType}
                onChange={(e) => setGuestForm({ ...guestForm, documentType: e.target.value })}
              >
                <option value="">Select</option>
                <option value="Passport">Passport</option>
                <option value="NIC">NIC</option>
                <option value="Driving License">Driving License</option>
              </select>
            </div>
          </div>
          <FormField
            label="Document Number *"
            value={guestForm.documentNumber}
            onChange={(e) => setGuestForm({ ...guestForm, documentNumber: e.target.value })}
            required
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setIsGuestRegisterOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleRegisterGuest}>Register Guest</Button>
          </div>
        </div>
      </Modal>
      
      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Payment"
      >
        {selectedReservation && (
          <div className="space-y-4">
            <div className="p-4 bg-surface border border-border rounded-lg">
              <p className="text-sm text-textSecondary">Reservation: {selectedReservation.reservationNumber}</p>
              <p className="text-sm text-textSecondary">Total Amount: ${selectedReservation.totalAmount.toFixed(2)}</p>
              <p className="text-sm text-textSecondary">Paid: ${selectedReservation.paidAmount.toFixed(2)}</p>
              <p className="text-sm font-semibold text-error">Pending: ${selectedReservation.pendingAmount.toFixed(2)}</p>
            </div>
            <FormField
              label="Payment Amount"
              type="number"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
              min={0}
              max={selectedReservation.pendingAmount}
              required
            />
            <div>
              <label className="block text-sm font-medium text-text mb-2">Payment Method</label>
              <select
                className="w-full px-4 py-2 bg-surface border border-border rounded-xl text-text"
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as PaymentMethod })}
              >
                {Object.values(PaymentMethod).map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
            <FormField
              label="Notes (Optional)"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={processPayment}>Record Payment</Button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Check-In Confirmation Modal */}
      <Modal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        title="Check-In Confirmation"
      >
        {selectedReservation && (
          <div className="space-y-4">
            {/* Guest Details */}
            <div className="p-4 bg-surface border border-border rounded-lg">
              <h3 className="font-semibold text-text mb-2">Guest Details</h3>
              <p className="text-sm text-textSecondary">Name: {selectedReservation.guestName}</p>
              <p className="text-sm text-textSecondary">ID: {selectedReservation.guestId}</p>
              <p className="text-sm text-textSecondary">Contact: {selectedReservation.guestEmail}</p>
            </div>
            
            {/* Reservation Info */}
            <div className="p-4 bg-surface border border-border rounded-lg">
              <h3 className="font-semibold text-text mb-2">Reservation Info</h3>
              <p className="text-sm text-textSecondary">Reservation #: {selectedReservation.reservationNumber}</p>
              <p className="text-sm text-textSecondary">Check-In: {new Date(selectedReservation.checkInDate).toLocaleDateString()}</p>
              <p className="text-sm text-textSecondary">Check-Out: {new Date(selectedReservation.checkOutDate).toLocaleDateString()}</p>
            </div>
            
            {/* Payment and Balance */}
            <div className="p-4 bg-surface border border-border rounded-lg">
              <h3 className="font-semibold text-text mb-2">Payment Details</h3>
              <p className="text-sm text-textSecondary">Total Amount: ${selectedReservation.totalAmount.toFixed(2)}</p>
              <p className="text-sm text-textSecondary">Paid: ${selectedReservation.paidAmount.toFixed(2)}</p>
              <p className="text-sm font-semibold text-error">Pending: ${selectedReservation.pendingAmount.toFixed(2)}</p>
            </div>
            
            {/* Editable Fields */}
            <div className="space-y-4">
              <h3 className="font-semibold text-text">Edit Details (if reallocation required)</h3>
              
              <div>
                <label className="block text-sm font-medium text-text mb-2">Room Number *</label>
                <select
                  className="w-full px-4 py-2 bg-surface border border-border rounded-xl text-text"
                  value={checkInForm.roomId}
                  onChange={(e) => {
                    const room = roomsStore.getById(e.target.value)
                    setCheckInForm({ ...checkInForm, roomId: e.target.value, roomNumber: room?.number || '' })
                  }}
                  required
                >
                  <option value="">Select Room</option>
                  {roomsStore.rooms
                    .filter(r => r.status === RoomStatus.Available || r.id === selectedReservation.roomId)
                    .map(room => (
                      <option key={room.id} value={room.id}>
                        {room.number} - {room.type} {room.status === RoomStatus.Reserved && room.id === selectedReservation.roomId ? '(Current)' : ''}
                      </option>
                    ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text mb-2">Meal Plan</label>
                <select
                  className="w-full px-4 py-2 bg-surface border border-border rounded-xl text-text"
                  value={checkInForm.mealPlanCode}
                  onChange={(e) => setCheckInForm({ ...checkInForm, mealPlanCode: e.target.value as MealPlanCode })}
                >
                  {mealPlans.map(plan => (
                    <option key={plan.id} value={plan.code}>{plan.code} – {plan.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Adults"
                  type="number"
                  value={checkInForm.adults}
                  onChange={(e) => setCheckInForm({ ...checkInForm, adults: parseInt(e.target.value) || 1 })}
                  min={1}
                  required
                />
                <FormField
                  label="Children"
                  type="number"
                  value={checkInForm.children}
                  onChange={(e) => setCheckInForm({ ...checkInForm, children: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>
              
              <FormField
                label="Notes (Optional)"
                value={checkInForm.notes}
                onChange={(e) => setCheckInForm({ ...checkInForm, notes: e.target.value })}
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setIsCheckInModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={processCheckIn} disabled={!checkInForm.roomId}>
                Confirm Check-In
              </Button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Check-Out Modal */}
      <Modal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        title="Check-Out Guest"
      >
        {selectedReservation && (
          <div className="space-y-4">
            <div className="p-4 bg-surface border border-border rounded-lg">
              <p className="text-sm text-textSecondary">Reservation: {selectedReservation.reservationNumber}</p>
              <p className="text-sm text-textSecondary">Guest: {selectedReservation.guestName}</p>
              <p className="text-sm text-textSecondary">Room: {selectedReservation.roomNumber}</p>
              {selectedReservation.pendingAmount > 0 && (
                <p className="text-sm font-semibold text-error mt-2">
                  Pending Amount: ${selectedReservation.pendingAmount.toFixed(2)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm text-text">Would you like to extend the stay?</p>
              <div className="flex gap-2">
                <Button variant="primary" className="flex-1" onClick={() => processCheckout(true)}>
                  Extend Stay
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => processCheckout(false)}>
                  Check-Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Extension Modal */}
      <Modal
        isOpen={isExtensionModalOpen}
        onClose={() => setIsExtensionModalOpen(false)}
        title="Extend Stay"
      >
        {selectedReservation && (
          <div className="space-y-4">
            <div className="p-4 bg-surface border border-border rounded-lg">
              <p className="text-sm text-textSecondary">Current Check-Out: {new Date(selectedReservation.checkOutDate).toLocaleDateString()}</p>
              <p className="text-sm text-textSecondary">Room: {selectedReservation.roomNumber}</p>
            </div>
            <FormField
              label="Extra Days"
              type="number"
              value={extensionForm.extraDays}
              onChange={(e) => setExtensionForm({ ...extensionForm, extraDays: parseInt(e.target.value) || 1 })}
              min={1}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Adults"
                type="number"
                value={extensionForm.adults}
                onChange={(e) => setExtensionForm({ ...extensionForm, adults: parseInt(e.target.value) || 1 })}
                min={1}
                required
              />
              <FormField
                label="Children"
                type="number"
                value={extensionForm.children}
                onChange={(e) => setExtensionForm({ ...extensionForm, children: parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setIsExtensionModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={processExtension}>Extend Stay</Button>
            </div>
          </div>
        )}
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
              {selectedReservation.pendingAmount > 0 && (
                <Button variant="primary" icon={DollarSign} onClick={() => {
                  handlePayment(selectedReservation)
                  setIsDetailsModalOpen(false)
                }}>
                  Record Payment
                </Button>
              )}
              {selectedReservation.status === ReservationStatus.Confirmed && (
                <Button variant="primary" icon={CheckCircle} onClick={() => {
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

