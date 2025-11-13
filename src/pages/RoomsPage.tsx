import React, { useMemo, useState } from 'react'
import { Room, RoomStatus, StayType, Amenity, AmenityCategory, RoomTypeConfig, RoomViewType, MealPlanCode } from '../types'
import RoomCard from '../components/organisms/RoomCard'
import Button from '../components/atoms/Button'
import Input from '../components/atoms/Input'
import Modal from '../components/molecules/Modal'
import FormField from '../components/molecules/FormField'
import Badge from '../components/atoms/Badge'
import Card from '../components/atoms/Card'
import Table from '../components/molecules/Table'
import { Plus, Search, Filter, BarChart2, CheckCircle, X, CalendarDays, SortAsc, SortDesc, Settings } from 'lucide-react'
import { useRoomsStore } from '../store/roomsStore'
import Pagination from '../components/molecules/Pagination'
import { useAuthStore } from '../store/authStore'
import { MOCK_ROOM_VIEW_TYPES } from '../constants'
import { useMealPlansStore } from '../store/mealPlansStore'

const RoomsPage: React.FC = () => {
  const { list, create, update, remove, setStatus } = useRoomsStore()
  const mealPlans = useMealPlansStore((state) => state.mealPlans)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<RoomStatus | 'All'>('All')
  const [filterType, setFilterType] = useState<string | 'All'>('All')
  const [filterArea, setFilterArea] = useState<string | 'All'>('All')
  const [filterViewType, setFilterViewType] = useState<string | 'All'>('All')
  const [filterMealPlan, setFilterMealPlan] = useState<MealPlanCode | 'All'>('All')
  const [capacityGte, setCapacityGte] = useState<number | ''>('')
  const [sortBy, setSortBy] = useState<'price' | 'type' | 'status' | 'area' | 'viewType' | 'mealPlan'>('type')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar'>('overview')
  const [activeSection, setActiveSection] = useState<'rooms' | 'roomTypes' | 'stayTypes' | 'amenities' | 'areas' | 'viewTypes'>('rooms')
  const [isCreateEditOpen, setIsCreateEditOpen] = useState(false)
  const [minPrice, setMinPrice] = useState<number | ''>('')
  const [maxPrice, setMaxPrice] = useState<number | ''>('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8
  const { user } = useAuthStore()
  const [viewTypes, setViewTypes] = useState<RoomViewType[]>(MOCK_ROOM_VIEW_TYPES)
  const activeViewTypes = useMemo(() => viewTypes.filter((vt) => vt.active), [viewTypes])
  const activeMealPlans = useMemo(() => mealPlans.filter((plan) => plan.active), [mealPlans])

  const rooms = list({
    search: searchTerm,
    status: filterStatus,
    type: filterType,
    area: filterArea,
    viewTypeId: filterViewType,
    mealPlanCode: filterMealPlan,
    capacityGte: capacityGte === '' ? undefined : capacityGte,
    sortBy,
    sortDir,
    ...(minPrice !== '' ? { minPrice } : {}),
    ...(maxPrice !== '' ? { maxPrice } : {}),
  })
  const totalPages = Math.max(1, Math.ceil(rooms.length / pageSize))
  const pagedRooms = rooms.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Master data (basic in-page CRUD for FR2-FR4)
  const initialRoomTypes: RoomTypeConfig[] = useMemo(() => {
    const types = Array.from(new Set(useRoomsStore.getState().rooms.map(r => r.type)))
    return types.map((t, idx) => ({
      id: `RT-${idx + 1}`,
      name: t,
      description: `${t} room type`,
      basePrice: Math.max(...useRoomsStore.getState().rooms.filter(r => r.type === t).map(r => r.price)),
      allowedCapacity: Math.max(...useRoomsStore.getState().rooms.filter(r => r.type === t).map(r => r.capacity)),
      includedAmenities: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  }, [])
  const [roomTypes, setRoomTypes] = useState<RoomTypeConfig[]>(initialRoomTypes)
  const [areas, setAreas] = useState<string[]>(Array.from(new Set(useRoomsStore.getState().rooms.map(r => r.area))))
  const [amenities, setAmenities] = useState<Amenity[]>([
    { id: 'A1', name: 'WiFi', category: AmenityCategory.Essential, active: true },
    { id: 'A2', name: 'TV', category: AmenityCategory.Essential, active: true },
    { id: 'A3', name: 'AC', category: AmenityCategory.Essential, active: true },
  ])
  const [isMdModalOpen, setIsMdModalOpen] = useState(false)
  const [mdMode, setMdMode] = useState<'create' | 'edit'>('create')
  const [mdEntity, setMdEntity] = useState<'roomType' | 'amenity' | 'area' | 'stayType' | 'viewType'>('roomType')
  const [mdEditId, setMdEditId] = useState<string | null>(null)
  const [mdForm, setMdForm] = useState<any>({})

  const handleViewDetails = (room: Room) => {
    setSelectedRoom(room)
    setIsModalOpen(true)
  }

  const handleUpdateStatus = (roomId: string, newStatus: RoomStatus) => {
    setStatus(roomId, newStatus)
  }

  const allTypes = useMemo(() => Array.from(new Set(useRoomsStore.getState().rooms.map(r => r.type))), [])
  const allAreas = useMemo(() => Array.from(new Set(useRoomsStore.getState().rooms.map(r => r.area))), [])

  // KPIs
  const kpis = useMemo(() => {
    const total = useRoomsStore.getState().rooms.length
    const counts = {
      available: useRoomsStore.getState().rooms.filter(r => r.status === RoomStatus.Available).length,
      occupied: useRoomsStore.getState().rooms.filter(r => r.status === RoomStatus.Occupied).length,
      reserved: useRoomsStore.getState().rooms.filter(r => r.status === RoomStatus.Reserved).length,
      dirty: useRoomsStore.getState().rooms.filter(r => r.status === RoomStatus.Dirty).length,
      cleaning: useRoomsStore.getState().rooms.filter(r => r.status === RoomStatus.CleaningInProgress).length,
      maintenance: useRoomsStore.getState().rooms.filter(r => r.status === RoomStatus.UnderMaintenance).length,
    }
    return { total, counts }
  }, [])

  // Create/Edit form state
  const [form, setForm] = useState<Omit<Room, 'id'>>({
    number: '',
    type: allTypes[0] || 'Standard',
    stayType: StayType.Daily,
    capacity: 2,
    price: 100,
    area: allAreas[0] || 'Floor 1',
    amenities: [],
    status: RoomStatus.Available,
    imageUrl: 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    viewTypeId: activeViewTypes[0]?.id,
    viewTypeName: activeViewTypes[0]?.name,
    mealPlanCode: activeMealPlans[0]?.code ?? mealPlans[0]?.code ?? MealPlanCode.RO,
  })

  // Helpers: master data modal openers
  const openMdCreate = (entity: typeof mdEntity) => {
    setMdMode('create')
    setMdEntity(entity)
    setMdEditId(null)
    if (entity === 'roomType') setMdForm({ name: '', description: '', basePrice: 0, allowedCapacity: 1 })
    if (entity === 'amenity') setMdForm({ name: '', category: AmenityCategory.Essential, active: true })
    if (entity === 'area') setMdForm({ name: '' })
    if (entity === 'stayType') setMdForm({ name: '', description: '', pricingRule: '' })
    if (entity === 'viewType') setMdForm({ name: '', description: '', exampleUsage: '', surchargeType: 'Flat', surchargeValue: 0, active: true })
    setIsMdModalOpen(true)
  }
  const openMdEdit = (entity: typeof mdEntity, id: string) => {
    setMdMode('edit')
    setMdEntity(entity)
    setMdEditId(id)
    if (entity === 'roomType') {
      const rt = roomTypes.find(r => r.id === id)
      if (rt) setMdForm({ name: rt.name, description: rt.description, basePrice: rt.basePrice, allowedCapacity: rt.allowedCapacity })
    }
    if (entity === 'amenity') {
      const am = amenities.find(a => a.id === id)
      if (am) setMdForm({ name: am.name, category: am.category, active: am.active })
    }
    if (entity === 'area') {
      const ar = areas.find(a => a === id)
      if (ar) setMdForm({ name: ar })
    }
    if (entity === 'stayType') {
      // For demo, we only allow rename/description in local form (not altering enum)
      setMdForm({ name: id, description: '', pricingRule: '' })
    }
    if (entity === 'viewType') {
      const vt = viewTypes.find(v => v.id === id)
      if (vt) {
        setMdForm({
          name: vt.name,
          description: vt.description,
          exampleUsage: vt.exampleUsage,
          surchargeType: vt.surchargeType || 'Flat',
          surchargeValue: vt.surchargeValue ?? 0,
          active: vt.active,
        })
      }
    }
    setIsMdModalOpen(true)
  }
  const submitMdForm = () => {
    if (mdEntity === 'roomType') {
      if (mdMode === 'create') {
        const newRt: RoomTypeConfig = {
          id: `RT-${roomTypes.length + 1}`,
          name: mdForm.name,
          description: mdForm.description,
          basePrice: Number(mdForm.basePrice) || 0,
          allowedCapacity: Number(mdForm.allowedCapacity) || 1,
          includedAmenities: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setRoomTypes([...roomTypes, newRt])
      } else if (mdEditId) {
        setRoomTypes(roomTypes.map(rt => rt.id === mdEditId ? {
          ...rt,
          name: mdForm.name,
          description: mdForm.description,
          basePrice: Number(mdForm.basePrice) || 0,
          allowedCapacity: Number(mdForm.allowedCapacity) || 1,
          updatedAt: new Date().toISOString(),
        } : rt))
      }
    }
    if (mdEntity === 'amenity') {
      if (mdMode === 'create') {
        const newAm: Amenity = {
          id: `AM-${amenities.length + 1}`,
          name: mdForm.name,
          category: mdForm.category as AmenityCategory,
          active: !!mdForm.active,
        }
        setAmenities([...amenities, newAm])
      } else if (mdEditId) {
        setAmenities(amenities.map(a => a.id === mdEditId ? {
          ...a, name: mdForm.name, category: mdForm.category as AmenityCategory, active: !!mdForm.active,
        } : a))
      }
    }
    if (mdEntity === 'area') {
      if (mdMode === 'create') {
        setAreas([...areas, mdForm.name])
      } else if (mdEditId) {
        setAreas(areas.map(a => a === mdEditId ? mdForm.name : a))
      }
    }
    if (mdEntity === 'viewType') {
      if (!mdForm.name?.trim()) {
        alert('View type name is required')
        return
      }
      if (mdMode === 'create') {
        const newVt: RoomViewType = {
          id: `VT-${String(viewTypes.length + 1).padStart(3, '0')}`,
          name: mdForm.name.trim(),
          description: mdForm.description || '',
          exampleUsage: mdForm.exampleUsage || '',
          surchargeType: (mdForm.surchargeType || 'Flat'),
          surchargeValue: Number(mdForm.surchargeValue) || 0,
          active: mdForm.active !== false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setViewTypes([...viewTypes, newVt])
        setForm((prev) => ({
          ...prev,
          viewTypeId: prev.viewTypeId ?? newVt.id,
          viewTypeName: prev.viewTypeName ?? newVt.name,
        }))
      } else if (mdEditId) {
        const updatedList = viewTypes.map(vt => vt.id === mdEditId ? {
          ...vt,
          name: mdForm.name.trim(),
          description: mdForm.description || '',
          exampleUsage: mdForm.exampleUsage || '',
          surchargeType: (mdForm.surchargeType || 'Flat'),
          surchargeValue: Number(mdForm.surchargeValue) || 0,
          active: mdForm.active !== false,
          updatedAt: new Date().toISOString(),
        } : vt)
        setViewTypes(updatedList)
        useRoomsStore.getState().rooms
          .filter(room => room.viewTypeId === mdEditId)
          .forEach(room => update(room.id, { viewTypeName: mdForm.name.trim() }))
      }
    }
    // stayType is illustrative; enum not mutated
    setIsMdModalOpen(false)
  }
  const deleteMdItem = (entity: typeof mdEntity, id: string) => {
    if (entity === 'roomType') setRoomTypes(roomTypes.filter(r => r.id !== id))
    if (entity === 'amenity') setAmenities(amenities.filter(a => a.id !== id))
    if (entity === 'area') setAreas(areas.filter(a => a !== id))
    if (entity === 'viewType') {
      setViewTypes(viewTypes.filter(v => v.id !== id))
      useRoomsStore.getState().rooms
        .filter(room => room.viewTypeId === id)
        .forEach(room => update(room.id, { viewTypeId: undefined, viewTypeName: undefined }))
    }
  }

  const openCreate = () => {
    setSelectedRoom(null)
    const defaultViewType = activeViewTypes[0] || viewTypes[0]
    const defaultMealPlan = activeMealPlans[0] || mealPlans[0]
    setForm({
      number: '',
      type: allTypes[0] || 'Standard',
      stayType: StayType.Daily,
      capacity: 2,
      price: 100,
      area: allAreas[0] || 'Floor 1',
      amenities: [],
      status: RoomStatus.Available,
      imageUrl: 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      viewTypeId: defaultViewType?.id,
      viewTypeName: defaultViewType?.name,
      mealPlanCode: defaultMealPlan?.code ?? MealPlanCode.RO,
    })
    setIsCreateEditOpen(true)
  }

  const openEdit = (room: Room) => {
    setSelectedRoom(room)
    const { id, ...rest } = room
    const matchedViewType = room.viewTypeId ? viewTypes.find(v => v.id === room.viewTypeId) : undefined
    setForm({
      ...rest,
      viewTypeName: matchedViewType?.name ?? room.viewTypeName,
      mealPlanCode: room.mealPlanCode ?? rest.mealPlanCode ?? (mealPlans[0]?.code ?? MealPlanCode.RO),
    })
    setIsCreateEditOpen(true)
  }

  const submitCreateEdit = () => {
    if (!form.number.trim()) {
      alert('Room number is required')
      return
    }
    // unique room number validation
    const existing = useRoomsStore.getState().rooms.find(r => r.number === form.number && (!selectedRoom || r.id !== selectedRoom.id))
    if (existing) {
      alert('Room number must be unique')
      return
    }
    if (selectedRoom) {
      const selectedViewType = form.viewTypeId ? viewTypes.find(v => v.id === form.viewTypeId) : undefined
      const payload = {
        ...form,
        viewTypeId: form.viewTypeId || undefined,
        viewTypeName: selectedViewType?.name,
        mealPlanCode: form.mealPlanCode ?? (mealPlans[0]?.code ?? MealPlanCode.RO),
        updatedBy: user?.name || 'Admin',
      }
      update(selectedRoom.id, payload)
    } else {
      const selectedViewType = form.viewTypeId ? viewTypes.find(v => v.id === form.viewTypeId) : undefined
      const payload = {
        ...form,
        viewTypeId: form.viewTypeId || undefined,
        viewTypeName: selectedViewType?.name,
        mealPlanCode: form.mealPlanCode ?? (mealPlans[0]?.code ?? MealPlanCode.RO),
        createdBy: user?.name || 'Admin',
      }
      create(payload)
    }
    setIsCreateEditOpen(false)
  }

  // Render helpers (sub-functions per requirement)
  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
      <Card>
        <div className="flex items-center gap-3">
          <BarChart2 className="h-5 w-5 text-primary" />
          <div>
            <div className="text-sm text-textSecondary">Total Rooms</div>
            <div className="text-2xl font-bold text-text">{kpis.total}</div>
          </div>
        </div>
      </Card>
      <Card><div className="flex items-center gap-3"><Badge variant="success">Available</Badge><div className="text-2xl font-bold text-text">{kpis.counts.available}</div></div></Card>
      <Card><div className="flex items-center gap-3"><Badge variant="primary">Reserved</Badge><div className="text-2xl font-bold text-text">{kpis.counts.reserved}</div></div></Card>
      <Card><div className="flex items-center gap-3"><Badge variant="error">Occupied</Badge><div className="text-2xl font-bold text-text">{kpis.counts.occupied}</div></div></Card>
      <Card><div className="flex items-center gap-3"><Badge variant="error">Dirty</Badge><div className="text-2xl font-bold text-text">{kpis.counts.dirty}</div></div></Card>
      <Card><div className="flex items-center gap-3"><Badge variant="warning">Cleaning</Badge><div className="text-2xl font-bold text-text">{kpis.counts.cleaning}</div></div></Card>
    </div>
  )

  const renderFilters = () => (
    <div className="mb-6 animate-fadeIn">
      <div className="mb-3">
        <Input
          type="text"
          placeholder="Search by room number, type, or area..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={Search}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text mb-2">Status</label>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as RoomStatus | 'All')}
              className="appearance-none w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 pl-10"
            >
              <option value="All">All Statuses</option>
              {Object.values(RoomStatus).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-textSecondary pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-2">Room Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
          >
            <option value="All">All Types</option>
            {Array.from(new Set(useRoomsStore.getState().rooms.map(r => r.type))).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-2">Area / Floor</label>
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value as any)}
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
          >
            <option value="All">All Areas</option>
            {Array.from(new Set(useRoomsStore.getState().rooms.map(r => r.area))).map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-2">View Type</label>
          <select
            value={filterViewType}
            onChange={(e) => setFilterViewType(e.target.value as string | 'All')}
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
          >
            <option value="All">All View Types</option>
            {viewTypes.map(vt => (
              <option key={vt.id} value={vt.id}>{vt.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-2">Meal Plan</label>
          <select
            value={filterMealPlan}
            onChange={(e) => setFilterMealPlan(e.target.value as MealPlanCode | 'All')}
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
          >
            <option value="All">All Meal Plans</option>
            {mealPlans.map(plan => (
              <option key={plan.id} value={plan.code}>{plan.code} – {plan.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Min Capacity"
            type="number"
            value={capacityGte}
            onChange={(e) => setCapacityGte(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
            min={0}
          />
          <div>
            <label className="block text-sm font-medium text-text mb-2">Sort By</label>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text"
              >
                <option value="type">Type</option>
                <option value="price">Price</option>
                <option value="status">Status</option>
                <option value="area">Floor/Area</option>
                <option value="viewType">View Type</option>
                <option value="mealPlan">Meal Plan</option>
              </select>
              <Button
                variant="outline"
                icon={sortDir === 'asc' ? SortAsc : SortDesc}
                onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
                aria-label="Toggle sort direction"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Min Price"
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
            min={0}
          />
          <FormField
            label="Max Price"
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
            min={0}
          />
        </div>
      </div>
    </div>
  )

  const renderRoomsGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {pagedRooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          onViewDetails={handleViewDetails}
          onUpdateStatus={handleUpdateStatus}
        />
      ))}
      <div className="col-span-full">
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => setCurrentPage(Math.min(Math.max(1, p), totalPages))} />
      </div>
    </div>
  )

  const renderCalendar = () => (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-text">This Week Schedule</h3>
      </div>
      <div className="grid grid-cols-8 gap-2">
        <div className="text-sm text-textSecondary">Room</div>
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
          <div key={d} className="text-xs text-textSecondary text-center">{d}</div>
        ))}
        {rooms.map(room => (
          <React.Fragment key={room.id}>
            <div className="text-sm font-medium text-text">{room.number}</div>
            {Array.from({ length: 7 }).map((_, idx) => (
              <button
                key={idx}
                className="h-8 rounded-md flex items-center justify-center text-xs bg-background border border-border hover:bg-primary/10"
                onClick={() => handleViewDetails(room)}
                aria-label={`View ${room.number} on day ${idx + 1}`}
              >
                <span className="truncate">
                  {room.status === RoomStatus.Occupied ? 'Occupied' :
                   room.status === RoomStatus.Reserved ? 'Reserved' :
                   room.status === RoomStatus.Dirty ? 'Dirty' :
                   room.status === RoomStatus.CleaningInProgress ? 'Cleaning' :
                   room.status === RoomStatus.UnderMaintenance ? 'Maint.' : 'Available'}
                </span>
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>
    </Card>
  )

  const renderRoomTypesManager = () => (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text">Room Types</h3>
        <Button variant="primary" icon={Plus} onClick={() => openMdCreate('roomType')}>Add Room Type</Button>
      </div>
      <Table<RoomTypeConfig>
        data={roomTypes}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'description', header: 'Description' },
          { key: 'basePrice', header: 'Base Price', render: (rt) => <span>${rt.basePrice}</span> },
          { key: 'allowedCapacity', header: 'Capacity' },
          {
            key: 'actions', header: 'Actions', className: 'text-right',
            render: (rt) => (
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => openMdEdit('roomType', rt.id)}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => deleteMdItem('roomType', rt.id)}>Delete</Button>
              </div>
            )
          },
        ]}
      />
    </Card>
  )

  const renderStayTypesManager = () => (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text">Stay Types</h3>
        <Button variant="primary" icon={Plus} onClick={() => openMdCreate('stayType')}>Add Stay Type</Button>
      </div>
      <Table<any>
        data={Object.values(StayType).map((st, i) => ({ id: st, name: st, description: `${st} pricing rule`, idx: i }))}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'description', header: 'Description' },
          {
            key: 'actions', header: 'Actions', className: 'text-right',
            render: (row) => (
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => openMdEdit('stayType', row.name)}>Edit</Button>
              </div>
            )
          },
        ]}
      />
    </Card>
  )

  const renderAmenitiesManager = () => (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text">Amenities</h3>
        <Button variant="primary" icon={Plus} onClick={() => openMdCreate('amenity')}>Add Amenity</Button>
      </div>
      <Table<Amenity>
        data={amenities}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'category', header: 'Category' },
          { key: 'active', header: 'Active', render: (a) => <Badge variant={a.active ? 'success' : 'outline'}>{a.active ? 'Yes' : 'No'}</Badge> },
          {
            key: 'actions', header: 'Actions', className: 'text-right',
            render: (a) => (
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => openMdEdit('amenity', a.id)}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => deleteMdItem('amenity', a.id)}>Delete</Button>
              </div>
            )
          },
        ]}
      />
    </Card>
  )

  const renderAreasManager = () => (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text">Areas (Floors/Zones)</h3>
        <Button variant="primary" icon={Plus} onClick={() => openMdCreate('area')}>Add Area</Button>
      </div>
      <Table<any>
        data={areas.map((a, i) => ({ id: a, name: a, idx: i }))}
        columns={[
          { key: 'name', header: 'Name' },
          {
            key: 'actions', header: 'Actions', className: 'text-right',
            render: (ar) => (
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => openMdEdit('area', ar.id)}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => deleteMdItem('area', ar.id)}>Delete</Button>
              </div>
            )
          },
        ]}
      />
    </Card>
  )

  const renderViewTypesManager = () => (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text">Room View Types</h3>
        <Button variant="primary" icon={Plus} onClick={() => openMdCreate('viewType')}>Add View Type</Button>
      </div>
      <Table<RoomViewType>
        data={viewTypes}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'description', header: 'Description' },
          { key: 'exampleUsage', header: 'Example Usage' },
          {
            key: 'surcharge',
            header: 'Surcharge',
            render: (vt) => (
              <span className="text-sm text-textSecondary">
                {vt.surchargeType === 'Percentage'
                  ? `${vt.surchargeValue ?? 0}%`
                  : `$${vt.surchargeValue ?? 0}`}
              </span>
            ),
          },
          {
            key: 'active',
            header: 'Active',
            render: (vt) => (
              <Badge variant={vt.active ? 'success' : 'outline'}>
                {vt.active ? 'Active' : 'Inactive'}
              </Badge>
            ),
          },
          {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            render: (vt) => (
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => openMdEdit('viewType', vt.id)}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => deleteMdItem('viewType', vt.id)}>Delete</Button>
              </div>
            ),
          },
        ]}
      />
    </Card>
  )

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6 animate-fadeIn">
        <h2 className="text-3xl font-bold text-text">Room Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" icon={Settings} onClick={() => setActiveSection('rooms')}>
            Rooms
          </Button>
          <Button variant="outline" onClick={() => setActiveSection('roomTypes')}>Room Types</Button>
          <Button variant="outline" onClick={() => setActiveSection('stayTypes')}>Stay Types</Button>
          <Button variant="outline" onClick={() => setActiveSection('amenities')}>Amenities</Button>
          <Button variant="outline" onClick={() => setActiveSection('areas')}>Areas</Button>
          <Button variant="outline" onClick={() => setActiveSection('viewTypes')}>View Types</Button>
          {activeSection === 'rooms' && (
            <Button variant="primary" icon={Plus} onClick={openCreate}>
              Add New Room
            </Button>
          )}
          {activeSection !== 'rooms' && (
            <Button variant="primary" onClick={() => setActiveSection('rooms')}>
              Back to Rooms
            </Button>
          )}
        </div>
      </div>

      {activeSection === 'rooms' && renderDashboard()}

      {activeSection === 'rooms' && (
        <div className="flex gap-4 border-b border-border">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium transition-colors ${activeTab === 'overview' ? 'text-primary border-b-2 border-primary' : 'text-textSecondary hover:text-text'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 font-medium transition-colors ${activeTab === 'calendar' ? 'text-primary border-b-2 border-primary' : 'text-textSecondary hover:text-text'}`}
          >
            Calendar View
          </button>
        </div>
      )}

      {activeSection === 'rooms' && renderFilters()}

      {activeSection === 'rooms' && activeTab === 'overview' && renderRoomsGrid()}

      {activeSection === 'rooms' && activeTab === 'calendar' && renderCalendar()}
      {activeSection === 'roomTypes' && renderRoomTypesManager()}
      {activeSection === 'stayTypes' && renderStayTypesManager()}
      {activeSection === 'amenities' && renderAmenitiesManager()}
      {activeSection === 'areas' && renderAreasManager()}
      {activeSection === 'viewTypes' && renderViewTypesManager()}

      {/* Room Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedRoom ? `Room ${selectedRoom.number} Details` : 'Room Details'}
      >
        {selectedRoom && (
          <div className="space-y-4">
            <img src={selectedRoom.imageUrl} alt={`Room ${selectedRoom.number}`} className="w-full h-48 object-cover rounded-xl mb-4" />
            <p className="text-textSecondary">
              <span className="font-semibold text-text">Type:</span> {selectedRoom.type}
            </p>
            {selectedRoom.viewTypeName && (
              <p className="text-textSecondary">
                <span className="font-semibold text-text">View Type:</span>{' '}
                {selectedRoom.viewTypeName}
                {selectedRoom.viewTypeId && (() => {
                  const vt = viewTypes.find(v => v.id === selectedRoom.viewTypeId)
                  if (!vt || vt.surchargeValue === undefined) return null
                  return ` (${vt.surchargeType === 'Percentage' ? `${vt.surchargeValue}%` : `$${vt.surchargeValue}`} surcharge)`
                })()}
              </p>
            )}
            <p className="text-textSecondary">
              <span className="font-semibold text-text">Meal Plan:</span>{' '}
              {selectedRoom.mealPlanCode
                ? (() => {
                    const plan = mealPlans.find(p => p.code === selectedRoom.mealPlanCode)
                    return plan ? `${plan.code} – ${plan.name}` : selectedRoom.mealPlanCode
                  })()
                : 'Not assigned'}
            </p>
            {selectedRoom.stayType && (
              <p className="text-textSecondary">
                <span className="font-semibold text-text">Stay Type:</span> {selectedRoom.stayType}
              </p>
            )}
            <p className="text-textSecondary">
              <span className="font-semibold text-text">Capacity:</span> {selectedRoom.capacity} Guests
            </p>
            <p className="text-textSecondary">
              <span className="font-semibold text-text">Price:</span> ${selectedRoom.price} / night
            </p>
            <p className="text-textSecondary">
              <span className="font-semibold text-text">Area:</span> {selectedRoom.area}
            </p>
            <p className="text-textSecondary">
              <span className="font-semibold text-text">Amenities:</span> {selectedRoom.amenities.join(', ')}
            </p>
            <p className="text-textSecondary">
              <span className="font-semibold text-text">Status:</span>{' '}
              <Badge variant={
                selectedRoom.status === RoomStatus.Available ? 'success' :
                selectedRoom.status === RoomStatus.Occupied ? 'error' :
                selectedRoom.status === RoomStatus.CleaningInProgress ? 'warning' :
                'info'
              }>
                {selectedRoom.status}
              </Badge>
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
              <Button variant="outline" onClick={() => { setIsModalOpen(false); openEdit(selectedRoom) }}>Edit Room</Button>
              {user?.role === 'Admin' && (
                <Button variant="danger" onClick={() => {
                  const reason = window.prompt('Please provide a reason for deletion (soft delete):') || undefined
                  remove(selectedRoom.id, reason)
                  setIsModalOpen(false)
                }} icon={X}>Delete</Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Room Modal */}
      <Modal
        isOpen={isCreateEditOpen}
        onClose={() => setIsCreateEditOpen(false)}
        title={selectedRoom ? `Edit Room ${selectedRoom.number}` : 'Add New Room'}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Room Number"
            value={form.number}
            onChange={(e) => setForm({ ...form, number: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-text mb-2">Room Type</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {Array.from(new Set(useRoomsStore.getState().rooms.map(r => r.type))).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Stay Type</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={form.stayType}
              onChange={(e) => setForm({ ...form, stayType: e.target.value as StayType })}
            >
              {Object.values(StayType).map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">View Type</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={form.viewTypeId || ''}
              onChange={(e) => {
                const value = e.target.value
                const matched = viewTypes.find(v => v.id === value)
                setForm({ ...form, viewTypeId: value || undefined, viewTypeName: matched?.name })
              }}
            >
              <option value="">Select View Type</option>
              {viewTypes.map(vt => (
                <option key={vt.id} value={vt.id}>
                  {vt.name} {vt.surchargeValue ? `(${vt.surchargeType === 'Percentage' ? `${vt.surchargeValue}%` : `$${vt.surchargeValue}`} surcharge)` : ''}
                </option>
              ))}
            </select>
          </div>
          <FormField
            label="Capacity"
            type="number"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 1 })}
            min={1}
            required
          />
          <FormField
            label="Base Price"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
            min={0}
            required
          />
          <div>
            <label className="block text-sm font-medium text-text mb-2">Area</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
            >
              {Array.from(new Set(useRoomsStore.getState().rooms.map(r => r.area))).map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Default Meal Plan</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={form.mealPlanCode || ''}
              onChange={(e) => setForm({ ...form, mealPlanCode: e.target.value as MealPlanCode })}
            >
              <option value="">Select Meal Plan</option>
              {mealPlans.map(plan => (
                <option key={plan.id} value={plan.code}>
                  {plan.code} – {plan.name} ({plan.markupType === 'Percentage' ? `${plan.markupValue}%` : `$${plan.markupValue}`} markup)
                </option>
              ))}
            </select>
          </div>
          <FormField
            label="Image URL"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text mb-2">Amenities (comma separated)</label>
            <Input
              type="text"
              value={form.amenities.join(', ')}
              onChange={(e) => setForm({ ...form, amenities: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            />
          </div>
          <div className="md:col-span-2">
            <FormField
              label="Description"
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional room description or notes"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Status</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as RoomStatus })}
            >
              {Object.values(RoomStatus).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <Button variant="outline" onClick={() => setIsCreateEditOpen(false)}>Cancel</Button>
          <Button variant="primary" icon={CheckCircle} onClick={submitCreateEdit}>
            {selectedRoom ? 'Save Changes' : 'Create Room'}
          </Button>
        </div>
      </Modal>

      {/* Master Data Create/Edit Modal */}
      <Modal
        isOpen={isMdModalOpen}
        onClose={() => setIsMdModalOpen(false)}
        title={`${mdMode === 'create' ? 'Add' : 'Edit'} ${
          mdEntity === 'roomType'
            ? 'Room Type'
            : mdEntity === 'amenity'
              ? 'Amenity'
              : mdEntity === 'area'
                ? 'Area'
                : mdEntity === 'viewType'
                  ? 'View Type'
                  : 'Stay Type'
        }`}
      >
        <div className="space-y-4">
          <FormField
            label="Name"
            value={mdForm.name || ''}
            onChange={(e) => setMdForm({ ...mdForm, name: e.target.value })}
          />
          {mdEntity === 'roomType' && (
            <>
              <FormField
                label="Description"
                value={mdForm.description || ''}
                onChange={(e) => setMdForm({ ...mdForm, description: e.target.value })}
              />
              <FormField
                label="Base Price"
                type="number"
                value={mdForm.basePrice || 0}
                onChange={(e) => setMdForm({ ...mdForm, basePrice: parseFloat(e.target.value) || 0 })}
                min={0}
              />
              <FormField
                label="Allowed Capacity"
                type="number"
                value={mdForm.allowedCapacity || 1}
                onChange={(e) => setMdForm({ ...mdForm, allowedCapacity: parseInt(e.target.value) || 1 })}
                min={1}
              />
            </>
          )}
          {mdEntity === 'amenity' && (
            <>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Category</label>
                <select
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  value={mdForm.category}
                  onChange={(e) => setMdForm({ ...mdForm, category: e.target.value as AmenityCategory })}
                >
                  {Object.values(AmenityCategory).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="amenity-active"
                  type="checkbox"
                  checked={!!mdForm.active}
                  onChange={(e) => setMdForm({ ...mdForm, active: e.target.checked })}
                />
                <label htmlFor="amenity-active" className="text-sm text-text">Active</label>
              </div>
            </>
          )}
          {mdEntity === 'viewType' && (
            <>
              <FormField
                label="Description"
                value={mdForm.description || ''}
                onChange={(e) => setMdForm({ ...mdForm, description: e.target.value })}
              />
              <FormField
                label="Example Usage"
                value={mdForm.exampleUsage || ''}
                onChange={(e) => setMdForm({ ...mdForm, exampleUsage: e.target.value })}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Surcharge Type</label>
                  <select
                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
                    value={mdForm.surchargeType || 'Flat'}
                    onChange={(e) => setMdForm({ ...mdForm, surchargeType: e.target.value })}
                  >
                    <option value="Flat">Flat Amount</option>
                    <option value="Percentage">Percentage</option>
                  </select>
                </div>
                <FormField
                  label="Surcharge Value"
                  type="number"
                  min={0}
                  value={mdForm.surchargeValue ?? 0}
                  onChange={(e) => setMdForm({ ...mdForm, surchargeValue: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="view-type-active"
                  type="checkbox"
                  checked={mdForm.active !== false}
                  onChange={(e) => setMdForm({ ...mdForm, active: e.target.checked })}
                />
                <label htmlFor="view-type-active" className="text-sm text-text">Active</label>
              </div>
            </>
          )}
          {mdEntity === 'stayType' && (
            <>
              <FormField
                label="Description"
                value={mdForm.description || ''}
                onChange={(e) => setMdForm({ ...mdForm, description: e.target.value })}
              />
              <FormField
                label="Pricing Rule"
                value={mdForm.pricingRule || ''}
                onChange={(e) => setMdForm({ ...mdForm, pricingRule: e.target.value })}
                placeholder="e.g., Daily rate, weekly discount, monthly discount"
              />
            </>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <Button variant="outline" onClick={() => setIsMdModalOpen(false)}>Cancel</Button>
          <Button variant="primary" icon={CheckCircle} onClick={submitMdForm}>
            {mdMode === 'create' ? 'Create' : 'Save'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default RoomsPage
