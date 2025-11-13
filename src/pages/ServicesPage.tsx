import React, { useState, useMemo } from 'react'
import { MOCK_SERVICES, MOCK_SERVICE_REQUESTS } from '../constants'
import { Service, ServiceRequest, ServiceCategory, PricingModel, ServiceStatus, ServiceRequestStatus, Hall } from '../types'
import Table from '../components/molecules/Table'
import Button from '../components/atoms/Button'
import Input from '../components/atoms/Input'
import Badge from '../components/atoms/Badge'
import Card from '../components/atoms/Card'
import Modal from '../components/molecules/Modal'
import FormField from '../components/molecules/FormField'
import DashboardWidget from '../components/organisms/DashboardWidget'
import { 
  Plus, Edit, Trash2, Search, Filter, Settings,
  Package, Clock, CheckCircle, AlertCircle, CalendarDays
} from 'lucide-react'
import { useHallsStore } from '../store/hallsStore'

const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>(MOCK_SERVICES)
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(MOCK_SERVICE_REQUESTS)
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | 'All'>('All')
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'All'>('All')
  const [activeTab, setActiveTab] = useState<'catalog' | 'requests' | 'halls'>('catalog')
  const hallsStore = useHallsStore()
  const halls = hallsStore.list()
  const [hallModalOpen, setHallModalOpen] = useState(false)
  const [editHall, setEditHall] = useState<Hall | null>(null)
  const [hallForm, setHallForm] = useState({
    name: '',
    capacity: 50,
    location: 'Ground Floor',
    hallType: 'Conference' as Hall['hallType'],
    basePrice: 500,
    pricingUnit: 'PerDay' as Hall['pricingUnit'],
    facilities: [] as string[],
    status: 'Available' as Hall['status'],
  })

  const [serviceForm, setServiceForm] = useState({
    name: '',
    shortDescription: '',
    detailedDescription: '',
    category: ServiceCategory.FoodBeverage,
    pricingModel: PricingModel.FixedPrice,
    price: '',
    taxApplicable: true,
    taxRate: '10',
    status: ServiceStatus.Active,
    dependencies: '',
  })

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalServices = services.length
    const activeServices = services.filter(s => s.status === ServiceStatus.Active).length
    const pendingRequests = serviceRequests.filter(r => r.status === ServiceRequestStatus.Pending).length
    const inProgressRequests = serviceRequests.filter(r => r.status === ServiceRequestStatus.InProgress).length

    return {
      totalServices,
      activeServices,
      pendingRequests,
      inProgressRequests,
    }
  }, [services, serviceRequests])

  // Filter services
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.shortDescription.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === 'All' || service.category === categoryFilter
      const matchesStatus = statusFilter === 'All' || service.status === statusFilter
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [services, searchTerm, categoryFilter, statusFilter])

  const handleCreateService = () => {
    const newService: Service = {
      id: `SRV${services.length + 1}`,
      name: serviceForm.name,
      shortDescription: serviceForm.shortDescription,
      detailedDescription: serviceForm.detailedDescription,
      category: serviceForm.category,
      pricingModel: serviceForm.pricingModel,
      price: parseFloat(serviceForm.price),
      taxApplicable: serviceForm.taxApplicable,
      taxRate: serviceForm.taxApplicable ? parseFloat(serviceForm.taxRate) : undefined,
      status: serviceForm.status,
      dependencies: serviceForm.dependencies ? serviceForm.dependencies.split(',').map(d => d.trim()) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setServices([...services, newService])
    setIsServiceModalOpen(false)
    setServiceForm({
      name: '',
      shortDescription: '',
      detailedDescription: '',
      category: ServiceCategory.FoodBeverage,
      pricingModel: PricingModel.FixedPrice,
      price: '',
      taxApplicable: true,
      taxRate: '10',
      status: ServiceStatus.Active,
      dependencies: '',
    })
  }

  const handleToggleServiceStatus = (id: string) => {
    setServices(services.map(s => 
      s.id === id 
        ? { ...s, status: s.status === ServiceStatus.Active ? ServiceStatus.Inactive : ServiceStatus.Active, updatedAt: new Date().toISOString() }
        : s
    ))
  }

  const handleUpdateRequestStatus = (id: string, status: ServiceRequestStatus) => {
    setServiceRequests(serviceRequests.map(r => 
      r.id === id 
        ? { 
            ...r, 
            status,
            completedDate: status === ServiceRequestStatus.Completed ? new Date().toISOString().split('T')[0] : r.completedDate
          }
        : r
    ))
  }

  const serviceColumns = [
    {
      key: 'name',
      header: 'Service Name',
      render: (service: Service) => (
        <div>
          <div className="font-medium">{service.name}</div>
          <div className="text-sm text-textSecondary">{service.shortDescription}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (service: Service) => <Badge variant="outline">{service.category}</Badge>,
    },
    {
      key: 'pricing',
      header: 'Pricing',
      render: (service: Service) => (
        <div>
          <div className="font-semibold text-primary">${service.price.toFixed(2)}</div>
          <div className="text-sm text-textSecondary">{service.pricingModel}</div>
        </div>
      ),
    },
    {
      key: 'tax',
      header: 'Tax',
      render: (service: Service) => (
        <div>
          {service.taxApplicable ? (
            <span className="text-sm">Yes ({service.taxRate}%)</span>
          ) : (
            <span className="text-sm text-textSecondary">No</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (service: Service) => (
        <Badge variant={service.status === ServiceStatus.Active ? 'success' : 'outline'}>
          {service.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (service: Service) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedService(service)
              setServiceForm({
                name: service.name,
                shortDescription: service.shortDescription,
                detailedDescription: service.detailedDescription,
                category: service.category,
                pricingModel: service.pricingModel,
                price: service.price.toString(),
                taxApplicable: service.taxApplicable,
                taxRate: service.taxRate?.toString() || '10',
                status: service.status,
                dependencies: service.dependencies?.join(', ') || '',
              })
              setIsServiceModalOpen(true)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleServiceStatus(service.id)}
          >
            {service.status === ServiceStatus.Active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ]

  const requestColumns = [
    {
      key: 'serviceName',
      header: 'Service',
      render: (request: ServiceRequest) => (
        <div>
          <div className="font-medium">{request.serviceName}</div>
          <div className="text-sm text-textSecondary">Qty: {request.quantity}</div>
        </div>
      ),
    },
    {
      key: 'guest',
      header: 'Guest',
      render: (request: ServiceRequest) => (
        <div>
          <div className="font-medium">{request.guestName}</div>
          <div className="text-sm text-textSecondary">Room {request.roomNumber}</div>
        </div>
      ),
    },
    {
      key: 'requestedDate',
      header: 'Requested Date',
      render: (request: ServiceRequest) => (
        <span className="text-sm">{new Date(request.requestedDate).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (request: ServiceRequest) => {
        const variant = request.status === ServiceRequestStatus.Completed ? 'success' :
                       request.status === ServiceRequestStatus.InProgress ? 'secondary' :
                       request.status === ServiceRequestStatus.Cancelled ? 'error' : 'outline'
        return <Badge variant={variant}>{request.status}</Badge>
      },
    },
    {
      key: 'department',
      header: 'Department',
      render: (request: ServiceRequest) => (
        <span className="text-sm">{request.responsibleDepartment || 'Unassigned'}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (request: ServiceRequest) => (
        <div className="flex items-center gap-2">
          {request.status === ServiceRequestStatus.Pending && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleUpdateRequestStatus(request.id, ServiceRequestStatus.InProgress)}
            >
              Start
            </Button>
          )}
          {request.status === ServiceRequestStatus.InProgress && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleUpdateRequestStatus(request.id, ServiceRequestStatus.Completed)}
            >
              Complete
            </Button>
          )}
          {request.status !== ServiceRequestStatus.Cancelled && request.status !== ServiceRequestStatus.Completed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleUpdateRequestStatus(request.id, ServiceRequestStatus.Cancelled)}
            >
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 animate-fadeIn">
        <h2 className="text-3xl font-bold text-text">Services & Hall Booking</h2>
        <div className="flex gap-2">
          {activeTab === 'catalog' && (
            <Button variant="primary" icon={Plus} onClick={() => {
            setSelectedService(null)
            setServiceForm({
              name: '',
              shortDescription: '',
              detailedDescription: '',
              category: ServiceCategory.FoodBeverage,
              pricingModel: PricingModel.FixedPrice,
              price: '',
              taxApplicable: true,
              taxRate: '10',
              status: ServiceStatus.Active,
              dependencies: '',
            })
            setIsServiceModalOpen(true)
          }}>
              Add Service
            </Button>
          )}
          {activeTab === 'halls' && (
            <Button variant="primary" icon={Plus} onClick={() => { setEditHall(null); setHallModalOpen(true) }}>
              Add Hall
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardWidget 
          metric={{
            title: 'Total Services',
            value: kpis.totalServices,
            icon: Package,
            colorClass: 'text-primary',
          }}
        />
        <DashboardWidget 
          metric={{
            title: 'Active Services',
            value: kpis.activeServices,
            icon: CheckCircle,
            colorClass: 'text-success',
          }}
        />
        <DashboardWidget 
          metric={{
            title: 'Pending Requests',
            value: kpis.pendingRequests,
            icon: Clock,
            colorClass: 'text-secondary',
          }}
        />
        <DashboardWidget 
          metric={{
            title: 'In Progress',
            value: kpis.inProgressRequests,
            icon: AlertCircle,
            colorClass: 'text-error',
          }}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'catalog'
              ? 'text-primary border-b-2 border-primary'
              : 'text-textSecondary hover:text-text'
          }`}
        >
          Service Catalog ({services.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'requests'
              ? 'text-primary border-b-2 border-primary'
              : 'text-textSecondary hover:text-text'
          }`}
        >
          Service Requests ({serviceRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('halls')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'halls'
              ? 'text-primary border-b-2 border-primary'
              : 'text-textSecondary hover:text-text'
          }`}
        >
          Halls ({halls.length})
        </button>
      </div>

      {/* Filters for Catalog */}
      {activeTab === 'catalog' && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          <select
            className="px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ServiceCategory | 'All')}
          >
            <option value="All">All Categories</option>
            {Object.values(ServiceCategory).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            className="px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ServiceStatus | 'All')}
          >
            <option value="All">All Status</option>
            <option value={ServiceStatus.Active}>Active</option>
            <option value={ServiceStatus.Inactive}>Inactive</option>
          </select>
        </div>
      )}

      {/* Services Table */}
      {activeTab === 'catalog' && (
        <Table<Service>
          data={filteredServices}
          columns={serviceColumns}
          emptyMessage="No services found."
        />
      )}

      {/* Service Requests Table */}
      {activeTab === 'requests' && (
        <Table<ServiceRequest>
          data={serviceRequests}
          columns={requestColumns}
          emptyMessage="No service requests found."
        />
      )}

      {/* Halls Table and Calendar */}
      {activeTab === 'halls' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><div className="text-sm text-textSecondary">Total Halls</div><div className="text-2xl font-bold text-text">{halls.length}</div></Card>
            <Card><div className="text-sm text-textSecondary">Available</div><div className="text-2xl font-bold text-text">{halls.filter(h => h.status === 'Available').length}</div></Card>
            <Card><div className="text-sm text-textSecondary">Booked</div><div className="text-2xl font-bold text-text">{halls.filter(h => h.status === 'Booked').length}</div></Card>
            <Card><div className="text-sm text-textSecondary">Maintenance</div><div className="text-2xl font-bold text-text">{halls.filter(h => h.status === 'Under Maintenance').length}</div></Card>
          </div>
          <Table<Hall>
            data={halls}
            columns={[
              { key: 'name', header: 'Hall' },
              { key: 'capacity', header: 'Capacity' },
              { key: 'location', header: 'Location' },
              { key: 'hallType', header: 'Type' },
              { key: 'basePrice', header: 'Base Price', render: (h: Hall) => `$${h.basePrice}` },
              { key: 'pricingUnit', header: 'Unit' },
              { key: 'status', header: 'Status', render: (h: Hall) => <Badge variant={h.status === 'Available' ? 'success' : h.status === 'Booked' ? 'primary' : 'warning'}>{h.status}</Badge> },
              { key: 'actions', header: 'Actions', className: 'text-right', render: (h: Hall) => (
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setEditHall(h); setHallModalOpen(true) }}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => hallsStore.remove(h.id)}><Trash2 className="h-4 w-4 text-error" /></Button>
                </div>
              )},
            ]}
            emptyMessage="No halls configured."
          />
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-text">Weekly Hall Schedule</h3>
            </div>
            <div className="grid grid-cols-8 gap-2">
              <div className="text-sm text-textSecondary">Hall</div>
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <div key={d} className="text-xs text-textSecondary text-center">{d}</div>
              ))}
              {halls.map(h => (
                <React.Fragment key={h.id}>
                  <div className="text-sm font-medium text-text">{h.name}</div>
                  {Array.from({ length: 7 }).map((_, idx) => (
                    <div key={idx} className={`h-8 rounded-md flex items-center justify-center text-xs border border-border ${h.status === 'Booked' ? 'bg-error/10' : h.status === 'Under Maintenance' ? 'bg-warning/10' : 'bg-background'}`}>
                      <span className="truncate">{h.status}</span>
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Service Modal */}
      <Modal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        title={selectedService ? 'Edit Service' : 'Add Service'}
      >
        <div className="space-y-4">
          <FormField
            label="Service Name"
            type="text"
            value={serviceForm.name}
            onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
            required
          />
          <FormField
            label="Short Description"
            type="text"
            value={serviceForm.shortDescription}
            onChange={(e) => setServiceForm({ ...serviceForm, shortDescription: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">Detailed Description</label>
            <textarea
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary"
              value={serviceForm.detailedDescription}
              onChange={(e) => setServiceForm({ ...serviceForm, detailedDescription: e.target.value })}
              rows={3}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-2">Category</label>
              <select
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
                value={serviceForm.category}
                onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value as ServiceCategory })}
              >
                {Object.values(ServiceCategory).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-2">Pricing Model</label>
              <select
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
                value={serviceForm.pricingModel}
                onChange={(e) => setServiceForm({ ...serviceForm, pricingModel: e.target.value as PricingModel })}
              >
                {Object.values(PricingModel).map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
          </div>
          <FormField
            label="Price"
            type="number"
            value={serviceForm.price}
            onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
            required
            min="0"
            step="0.01"
          />
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="taxApplicable"
              checked={serviceForm.taxApplicable}
              onChange={(e) => setServiceForm({ ...serviceForm, taxApplicable: e.target.checked })}
              className="w-4 h-4 rounded border-border"
            />
            <label htmlFor="taxApplicable" className="text-sm font-medium text-text">
              Tax Applicable
            </label>
          </div>
          {serviceForm.taxApplicable && (
            <FormField
              label="Tax Rate (%)"
              type="number"
              value={serviceForm.taxRate}
              onChange={(e) => setServiceForm({ ...serviceForm, taxRate: e.target.value })}
              min="0"
              max="100"
              step="0.1"
            />
          )}
          <FormField
            label="Dependencies (comma-separated)"
            type="text"
            value={serviceForm.dependencies}
            onChange={(e) => setServiceForm({ ...serviceForm, dependencies: e.target.value })}
            placeholder="e.g., Therapist availability, Equipment required"
          />
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">Status</label>
            <select
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={serviceForm.status}
              onChange={(e) => setServiceForm({ ...serviceForm, status: e.target.value as ServiceStatus })}
            >
              <option value={ServiceStatus.Active}>Active</option>
              <option value={ServiceStatus.Inactive}>Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsServiceModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateService}
              disabled={!serviceForm.name || !serviceForm.shortDescription || !serviceForm.price}
            >
              {selectedService ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Hall Modal */}
      <Modal isOpen={hallModalOpen} onClose={() => setHallModalOpen(false)} title={editHall ? 'Edit Hall' : 'Add Hall'}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Hall Name" value={hallForm.name} onChange={(e) => setHallForm({ ...hallForm, name: e.target.value })} />
          <FormField label="Capacity" type="number" value={hallForm.capacity} onChange={(e) => setHallForm({ ...hallForm, capacity: parseInt(e.target.value) || 0 })} />
          <FormField label="Location / Floor" value={hallForm.location} onChange={(e) => setHallForm({ ...hallForm, location: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">Hall Type</label>
            <select className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary" value={hallForm.hallType} onChange={(e) => setHallForm({ ...hallForm, hallType: e.target.value as any })}>
              {['Conference','Banquet','Meeting','Party'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <FormField label="Base Price" type="number" value={hallForm.basePrice} onChange={(e) => setHallForm({ ...hallForm, basePrice: parseFloat(e.target.value) || 0 })} />
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">Pricing Unit</label>
            <select className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary" value={hallForm.pricingUnit} onChange={(e) => setHallForm({ ...hallForm, pricingUnit: e.target.value as any })}>
              {['PerHour','PerDay','PerEvent'].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <FormField label="Facilities (comma separated)" value={hallForm.facilities.join(', ')} onChange={(e) => setHallForm({ ...hallForm, facilities: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">Status</label>
            <select className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary" value={hallForm.status} onChange={(e) => setHallForm({ ...hallForm, status: e.target.value as any })}>
              {['Available','Booked','Under Maintenance'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <Button variant="outline" onClick={() => setHallModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => {
            if (editHall) {
              hallsStore.update(editHall.id, hallForm as any)
            } else {
              hallsStore.create(hallForm as any)
            }
            setHallModalOpen(false)
          }}>{editHall ? 'Save' : 'Create'}</Button>
        </div>
      </Modal>
    </div>
  )
}

export default ServicesPage


