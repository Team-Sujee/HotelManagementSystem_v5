export enum UserRole {
  Admin = 'Admin',
  Receptionist = 'Receptionist',
  Housekeeping = 'Housekeeping',
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
}

export enum RoomStatus {
  Available = 'Available',
  Reserved = 'Reserved',
  Occupied = 'Occupied',
  CleaningInProgress = 'Cleaning in Progress',
  Dirty = 'Dirty',
  UnderMaintenance = 'Under Maintenance',
}

export type RateAdjustmentType = 'Flat' | 'Percentage'

export interface Room {
  id: string
  number: string
  type: string
  stayType?: StayType
  capacity: number
  price: number
  area: string // e.g., "Floor 1"
  amenities: string[]
  status: RoomStatus
  imageUrl: string
  description?: string
  viewTypeId?: string
  viewTypeName?: string
  mealPlanCode?: MealPlanCode
  active?: boolean
  createdAt?: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
}

export interface RoomViewType {
  id: string
  name: string
  description: string
  exampleUsage?: string
  surchargeType?: RateAdjustmentType
  surchargeValue?: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export enum MealPlanCode {
  RO = 'RO',
  BB = 'BB',
  HB = 'HB',
  FB = 'FB',
}

export interface MealPlan {
  id: string
  code: MealPlanCode
  name: string
  description: string
  markupType: RateAdjustmentType
  markupValue: number
  active: boolean
  defaultForRoomTypes?: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export enum StayType {
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
}

export interface Guest {
  id: string
  fullName: string
  email: string
  phone: string
  country: string
  gender: string
  documentType: string
  documentNumber: string
  visitCount: number
  lifetimeSpending: number
  status: 'New' | 'Regular' | 'VIP'
  avatarUrl: string
}

export interface HousekeepingTask {
  roomId: string
  roomNumber: string
  status: RoomStatus // Dirty, Cleaning in Progress, Available
  assignedTo?: string // Housekeeping staff ID
  checklist: {
    cleanBathroom: boolean
    changeBedSheets: boolean
    replaceTowels: boolean
    restockEssentials: boolean
    floorCleaning: boolean
    finalInspection: boolean
  }
  lastUpdated: string
}

export interface DashboardMetric {
  title: string
  value: string | number
  change?: string
  icon: React.ElementType
  colorClass: string
}

export interface ChartDataPoint {
  name: string
  value: number
}

export enum ReservationStatus {
  Confirmed = 'Confirmed',
  CheckedIn = 'Checked-In',
  CheckedOut = 'Checked-Out',
  Cancelled = 'Cancelled',
}

export enum PaymentMethod {
  Cash = 'Cash',
  Online = 'Online',
  Card = 'Card',
}

export enum BookingChannel {
  Website = 'Website',
  BookingCom = 'Booking.com',
  Expedia = 'Expedia',
  WalkIn = 'Walk-in',
  Phone = 'Phone',
}

export interface Reservation {
  id: string
  reservationNumber: string
  guestId: string
  guestName: string
  guestEmail: string
  guestPhone: string
  roomId: string
  roomNumber: string
  roomType: string
  mealPlanCode?: MealPlanCode
  checkInDate: string
  checkOutDate: string
  adults: number
  children: number
  channel: BookingChannel
  status: ReservationStatus
  baseRate: number
  seasonalPricing: number
  channelPricing: number
  tax: number
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  paymentMethod: PaymentMethod
  invoiceNumber?: string
  createdAt: string
  updatedAt: string
  notes?: string
}

export enum InquiryStatus {
  Pending = 'Pending',
  Converted = 'Converted',
  Rejected = 'Rejected',
}

export interface ReservationInquiry {
  id: string
  guestName: string
  guestEmail: string
  guestPhone: string
  checkInDate: string
  checkOutDate: string
  adults: number
  children: number
  preferredRoomType?: string
  status: InquiryStatus
  remarks?: string
  createdAt: string
  convertedToReservationId?: string
}

// Pricing Types
export enum SeasonStatus {
  Active = 'Active',
  Inactive = 'Inactive',
}

export enum PriceAdjustmentType {
  Amount = 'Amount',
  Percentage = 'Percentage',
}

export interface BasePrice {
  id: string
  roomType: string
  basePrice: number
  maximumOccupancy: number
  currency: string
  updatedAt: string
  updatedBy: string
}

export interface PriceHistory {
  id: string
  roomType: string
  oldPrice: number
  newPrice: number
  changedAt: string
  changedBy: string
  reason?: string
}

export interface Season {
  id: string
  name: string
  startDate: string
  endDate: string
  adjustmentType: PriceAdjustmentType
  adjustmentValue: number
  status: SeasonStatus
  createdAt: string
  updatedAt: string
}

// Channel Management Types
export enum ChannelType {
  OTA = 'OTA',
  TravelAgent = 'Travel Agent',
  Corporate = 'Corporate',
  Website = 'Website',
}

export enum ChannelStatus {
  Active = 'Active',
  Inactive = 'Inactive',
}

export interface Channel {
  id: string
  name: string
  type: ChannelType
  commissionRate: number
  status: ChannelStatus
  createdAt: string
  updatedAt: string
}

export interface ChannelPerformance {
  channelId: string
  channelName: string
  totalReservations: number
  totalRevenue: number
  commissionAmount: number
  profitAmount: number
  revenueContributionPercent: number
  averageRoomPrice: number
  bookingVolume: number
}

// Invoice Types
export enum InvoiceType {
  Proforma = 'Proforma Invoice',
  Receipt = 'Receipt',
  Refund = 'Refund Invoice',
  CreditNote = 'Credit Note',
  AdditionalBilling = 'Additional Billing',
  EventHall = 'Event/Hall Invoice',
}

export enum InvoiceStatus {
  Pending = 'Pending',
  Paid = 'Paid',
  Processed = 'Processed',
  Rejected = 'Rejected',
  Accepted = 'Accepted',
  Issued = 'Issued',
  Applied = 'Applied',
}

export interface Invoice {
  id: string
  invoiceNumber: string
  type: InvoiceType
  reservationId?: string
  guestId: string
  guestName: string
  guestEmail: string
  mealPlanCode?: MealPlanCode
  status: InvoiceStatus
  subtotal: number
  tax: number
  totalAmount: number
  paidAmount: number
  dueAmount: number
  paymentMethod?: PaymentMethod
  issueDate: string
  dueDate?: string
  expiryDate?: string
  items: InvoiceItem[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  tax: number
  total: number
}

export interface AdditionalBilling {
  id: string
  reservationId: string
  serviceName: string
  date: string
  amount: number
  tax: number
  totalAmount: number
  description?: string
  createdAt: string
}

export interface Refund {
  id: string
  refundNumber: string
  reservationId: string
  guestId: string
  guestName: string
  amount: number
  reason: string
  status: InvoiceStatus
  processedDate?: string
  createdAt: string
}

export interface CreditNote {
  id: string
  creditNoteNumber: string
  invoiceId: string
  amount: number
  reason: string
  status: InvoiceStatus
  issuedDate: string
  appliedDate?: string
  createdAt: string
}

// Services Types
export enum ServiceCategory {
  FoodBeverage = 'Food & Beverage',
  Housekeeping = 'Housekeeping',
  Spa = 'Spa',
  Transport = 'Transport',
  Laundry = 'Laundry',
  Entertainment = 'Entertainment',
  Other = 'Other',
}

export enum PricingModel {
  FixedPrice = 'Fixed Price',
  PerDay = 'Per Day',
  PerUnit = 'Per Unit',
  PerPerson = 'Per Person',
}

export enum ServiceStatus {
  Active = 'Active',
  Inactive = 'Inactive',
}

export interface Service {
  id: string
  name: string
  shortDescription: string
  detailedDescription: string
  category: ServiceCategory
  pricingModel: PricingModel
  price: number
  taxApplicable: boolean
  taxRate?: number
  status: ServiceStatus
  dependencies?: string[]
  createdAt: string
  updatedAt: string
}

export enum ServiceRequestStatus {
  Pending = 'Pending',
  InProgress = 'In Progress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export interface ServiceRequest {
  id: string
  reservationId: string
  roomId: string
  roomNumber: string
  guestId: string
  guestName: string
  serviceId: string
  serviceName: string
  quantity: number
  status: ServiceRequestStatus
  requestedDate: string
  completedDate?: string
  responsibleDepartment?: string
  responsibleStaff?: string
  notes?: string
  createdAt: string
}

// Policies Types
export enum PolicyType {
  CheckInOut = 'Check-In/Check-Out',
  ChildAccommodation = 'Child Accommodation',
  ExtraBed = 'Extra Bed',
  Identification = 'Identification',
  Smoking = 'Smoking',
  Pet = 'Pet',
  MinimumStay = 'Minimum Stay',
  Cancellation = 'Cancellation',
  Refund = 'Refund',
  Overbooking = 'Overbooking',
  Guarantee = 'Guarantee',
  DamageLoss = 'Damage & Loss',
  Privacy = 'Privacy',
  Security = 'Security',
  Emergency = 'Emergency',
}

export enum PenaltyType {
  FixedFee = 'Fixed Fee',
  Percentage = 'Percentage of Booking',
  FirstNight = 'First Night Charge',
}

export interface CancellationPolicy {
  id: string
  name: string
  channelId?: string
  seasonId?: string
  ratePlan?: string
  deadlineHours: number
  penaltyType: PenaltyType
  penaltyValue: number
  autoRefund: boolean
  status: 'Active' | 'Inactive'
  createdAt: string
  updatedAt: string
}

export interface HotelPolicy {
  id: string
  type: PolicyType
  title: string
  description: string
  rules: string[]
  applicableTo?: string[] // e.g., room types, channels
  status: 'Active' | 'Inactive'
  createdAt: string
  updatedAt: string
}

export interface OverbookingPolicy {
  id: string
  name: string
  maxOverbookingPercent: number
  conditions: string[]
  requiresGuarantee: boolean
  guaranteeType?: 'PreAuthorization' | 'AdvancePayment'
  applicableSeasons?: string[]
  status: 'Active' | 'Inactive'
  createdAt: string
  updatedAt: string
}

// Room Master Data Extensions
export enum AmenityCategory {
  Essential = 'Essential Facilities',
  Luxury = 'Luxury Features',
  Accessibility = 'Accessibility Features',
  Other = 'Other',
}

export interface Amenity {
  id: string
  name: string
  category: AmenityCategory
  active: boolean
}

export interface RoomTypeConfig {
  id: string
  name: string
  description: string
  basePrice: number
  allowedCapacity: number
  includedAmenities: string[] // amenity ids or names
  images?: string[]
  createdAt: string
  updatedAt: string
}

export interface MaintenanceRecord {
  id: string
  roomId: string
  reason: string
  assignedTo?: string
  estimatedResolution?: string
  cost?: number
  createdAt: string
  status: 'Open' | 'In Progress' | 'Resolved'
}

export interface RoomActivityLog {
  id: string
  roomId: string
  action: 'Create' | 'Update' | 'Delete' | 'StatusUpdate' | 'Allocation' | 'Maintenance' | 'AmenityUpdate'
  from?: string
  to?: string
  notes?: string
  actorRole: UserRole
  createdAt: string
}

// Taxes & Currency
export enum TaxScope {
  Room = 'Room',
  Service = 'Service',
  Event = 'Event',
  Global = 'Global',
}

export interface TaxRate {
  id: string
  name: string
  percentage: number
  code?: string
  scope: TaxScope
  effectiveFrom: string
  effectiveTo?: string
  active: boolean
  createdAt: string
  createdBy: string
  updatedAt?: string
  updatedBy?: string
}

export interface TaxApplicationLine {
  taxId: string
  taxName: string
  taxPercentage: number
  taxableAmount: number
  taxAmount: number
}

export interface CurrencyRate {
  id: string
  name: string
  code: string // e.g., USD
  symbol: string // e.g., $
  rateToBase: number
  status: 'Active' | 'Inactive'
  lastUpdated: string
  createdAt: string
  createdBy: string
  updatedAt?: string
  updatedBy?: string
}

// Events & Halls
export enum EventType {
  Wedding = 'Wedding',
  Conference = 'Conference',
  Meeting = 'Meeting',
  Party = 'Party',
  Other = 'Other',
}

export type EventStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled'
export type EventBookingStage = 'Inquiry' | 'Quotation' | 'AwaitingPayment' | 'Confirmed' | 'InExecution' | 'Completed' | 'Cancelled'
export type EventPaymentStatus = 'Pending' | 'Partial' | 'Paid' | 'Cancelled'

export interface Hall {
  id: string
  name: string
  capacity: number
  location: string
  hallType: 'Conference' | 'Banquet' | 'Meeting' | 'Party'
  basePrice: number
  pricingUnit: 'PerHour' | 'PerDay' | 'PerEvent'
  facilities: string[]
  status: 'Available' | 'Booked' | 'Under Maintenance'
  nextBookingAt?: string
  occupancyRate?: number
  maintenanceCount?: number
  revenueGenerated?: number
  createdAt: string
  updatedAt?: string
}

export interface EventPackage {
  id: string
  name: string
  description: string
  includedServices: string[]
  basePrice: number
  taxRate: number
  duration: 'Half-Day' | 'Full-Day' | 'Multi-Day'
  recommendedFor: EventType[]
  addons?: { name: string; price: number }[]
  active: boolean
  createdAt: string
  updatedAt?: string
}

export interface EventFinancials {
  packageId?: string
  packageName?: string
  baseAmount: number
  addonsAmount: number
  discountAmount: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  currency: string
  paymentStatus: EventPaymentStatus
  proformaInvoiceNumber?: string
  finalInvoiceNumber?: string
}

export interface EventTaskAssignment {
  id: string
  taskType: 'Housekeeping' | 'Service' | 'Maintenance' | 'Setup' | 'Teardown'
  assigneeRole?: UserRole
  assigneeName?: string
  scheduledAt?: string
  status: 'Pending' | 'In Progress' | 'Completed'
  notes?: string
}

export interface EventAlert {
  id: string
  message: string
  type: 'Info' | 'Warning' | 'Critical'
  createdAt: string
  acknowledgedBy?: string
  acknowledgedAt?: string
}

export interface HotelEvent {
  id: string
  name: string
  type: EventType
  date: string // start ISO date
  endDate: string // end ISO date
  description?: string
  hallIds: string[]
  services: string[]
  guestId?: string
  clientName?: string
  expectedAttendees?: number
  actualAttendees?: number
  status: EventStatus
  bookingStage?: EventBookingStage
  packageId?: string
  financials?: EventFinancials
  decorationType?: string
  cateringRequirements?: string
  equipmentNeeds?: string[]
  notes?: string
  tasks?: EventTaskAssignment[]
  alerts?: EventAlert[]
  createdAt: string
  updatedAt?: string
}

// Channel Pricing
export type CommissionType = 'Fixed' | 'Percentage'

export interface ChannelPricingRule {
  id: string
  roomType: string
  channel: 'Website' | 'Walk-in' | 'Booking.com' | 'Agoda' | 'Corporate' | 'Travel Agent'
  adjustmentType: 'Amount' | 'Percentage'
  adjustmentValue: number
  commissionType?: CommissionType
  commissionValue?: number
  seasonId?: string
  promoCode?: string
  validFrom: string
  validTo?: string
  active: boolean
  createdAt: string
  createdBy: string
  updatedAt?: string
  updatedBy?: string
}
