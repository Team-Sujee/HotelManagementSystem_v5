import React, { useState } from 'react'
import { MOCK_GUESTS } from '../constants'
import { Guest } from '../types'
import Table from '../components/molecules/Table'
import Button from '../components/atoms/Button'
import Input from '../components/atoms/Input'
import Badge from '../components/atoms/Badge'
import Avatar from '../components/atoms/Avatar'
import Modal from '../components/molecules/Modal'
import { Plus, Search, Eye, Edit, Trash2, User } from 'lucide-react'

const GuestsPage: React.FC = () => {
  const [guests, setGuests] = useState<Guest[]>(MOCK_GUESTS)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)

  const filteredGuests = guests.filter(guest =>
    guest.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.phone.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleViewDetails = (guest: Guest) => {
    setSelectedGuest(guest)
    setIsModalOpen(true)
  }

  const handleDeleteGuest = (guestId: string) => {
    if (window.confirm('Are you sure you want to delete this guest?')) {
      setGuests(prevGuests => prevGuests.filter(guest => guest.id !== guestId))
    }
  }

  const getStatusBadgeVariant = (status: Guest['status']) => {
    switch (status) {
      case 'VIP': return 'primary'
      case 'Regular': return 'secondary'
      case 'New': return 'info'
      default: return 'outline'
    }
  }

  const guestTableColumns = [
    {
      key: 'fullName',
      header: 'Guest Name',
      render: (guest: Guest) => (
        <div className="flex items-center gap-3">
          <Avatar src={guest.avatarUrl} alt={guest.fullName} size="sm" />
          <span className="font-medium">{guest.fullName}</span>
        </div>
      ),
    },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'country', header: 'Country' },
    { key: 'visitCount', header: 'Visits', className: 'text-center' },
    {
      key: 'lifetimeSpending',
      header: 'Spending',
      render: (guest: Guest) => `$${guest.lifetimeSpending.toLocaleString()}`,
      className: 'text-right',
    },
    {
      key: 'status',
      header: 'Status',
      render: (guest: Guest) => (
        <Badge variant={getStatusBadgeVariant(guest.status)}>{guest.status}</Badge>
      ),
      className: 'text-center',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (guest: Guest) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleViewDetails(guest)} aria-label="View details">
            <Eye className="h-5 w-5 text-textSecondary hover:text-primary" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => alert(`Edit ${guest.fullName}`)} aria-label="Edit guest">
            <Edit className="h-5 w-5 text-textSecondary hover:text-secondary" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDeleteGuest(guest.id)} aria-label="Delete guest">
            <Trash2 className="h-5 w-5 text-textSecondary hover:text-error" />
          </Button>
        </div>
      ),
      className: 'text-right',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6 animate-fadeIn">
        <h2 className="text-3xl font-bold text-text">Guest Management</h2>
        <Button variant="primary" icon={Plus}>
          Add New Guest
        </Button>
      </div>

      {/* Search Input */}
      <div className="mb-6 animate-fadeIn">
        <Input
          type="text"
          placeholder="Search guests by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={Search}
          className="max-w-lg"
        />
      </div>

      {/* Guest Table */}
      <Table<Guest>
        data={filteredGuests}
        columns={guestTableColumns}
        emptyMessage="No guests found matching your criteria."
      />

      {/* Guest Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedGuest ? `${selectedGuest.fullName}'s Profile` : 'Guest Profile'}
      >
        {selectedGuest && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <Avatar src={selectedGuest.avatarUrl} alt={selectedGuest.fullName} size="xl" />
              <div>
                <h3 className="text-2xl font-bold text-text">{selectedGuest.fullName}</h3>
                <Badge variant={getStatusBadgeVariant(selectedGuest.status)} className="mt-1">{selectedGuest.status}</Badge>
              </div>
            </div>
            <p className="text-textSecondary"><span className="font-semibold text-text">Email:</span> {selectedGuest.email}</p>
            <p className="text-textSecondary"><span className="font-semibold text-text">Phone:</span> {selectedGuest.phone}</p>
            <p className="text-textSecondary"><span className="font-semibold text-text">Country:</span> {selectedGuest.country}</p>
            <p className="text-textSecondary"><span className="font-semibold text-text">Gender:</span> {selectedGuest.gender}</p>
            <p className="text-textSecondary"><span className="font-semibold text-text">Document:</span> {selectedGuest.documentType} - {selectedGuest.documentNumber}</p>
            <p className="text-textSecondary"><span className="font-semibold text-text">Visits:</span> {selectedGuest.visitCount}</p>
            <p className="text-textSecondary"><span className="font-semibold text-text">Lifetime Spending:</span> ${selectedGuest.lifetimeSpending.toLocaleString()}</p>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
              <Button variant="outline" icon={Edit}>Edit Profile</Button>
              <Button variant="danger" icon={Trash2} onClick={() => handleDeleteGuest(selectedGuest.id)}>Delete Guest</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default GuestsPage
