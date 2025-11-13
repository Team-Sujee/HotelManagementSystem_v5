import React from 'react'
import { Room, RoomStatus } from '../../types'
import Card from '../atoms/Card'
import Badge from '../atoms/Badge'
import Button from '../atoms/Button'
import { Bed, Users, DollarSign, Wrench, CheckCircle, Clock } from 'lucide-react'

interface RoomCardProps {
  room: Room
  onViewDetails?: (room: Room) => void
  onUpdateStatus?: (roomId: string, status: RoomStatus) => void
}

const getStatusBadgeVariant = (status: RoomStatus) => {
  switch (status) {
    case RoomStatus.Available: return 'success'
    case RoomStatus.Occupied: return 'error'
    case RoomStatus.Reserved: return 'primary'
    case RoomStatus.CleaningInProgress: return 'warning'
    case RoomStatus.Dirty: return 'error'
    case RoomStatus.UnderMaintenance: return 'secondary'
    default: return 'info'
  }
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onViewDetails, onUpdateStatus }) => {
  return (
    <Card className="flex flex-col h-full overflow-hidden p-0">
      <div className="relative h-48 w-full overflow-hidden rounded-t-2xl">
        <img
          src={room.imageUrl}
          alt={`Room ${room.number}`}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <Badge
          variant={getStatusBadgeVariant(room.status)}
          className="absolute top-4 left-4 text-sm px-3 py-1.5"
        >
          {room.status}
        </Badge>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-text mb-2">{room.type} - Room {room.number}</h3>
        <div className="flex items-center text-textSecondary text-sm mb-3 space-x-4">
          <span className="flex items-center gap-1">
            <Bed className="h-4 w-4" /> {room.type}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" /> {room.capacity} Guests
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" /> ${room.price}/night
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-textSecondary mb-3">
          {room.viewTypeName && (
            <Badge variant="outline" className="text-xs">
              {room.viewTypeName}
            </Badge>
          )}
          {room.mealPlanCode && (
            <Badge variant="secondary" className="text-xs">
              Meal: {room.mealPlanCode}
            </Badge>
          )}
        </div>
        <p className="text-textSecondary text-sm mb-4 flex-grow">{room.amenities.join(', ')}</p>

        <div className="flex justify-end gap-3 mt-auto">
          {room.status === RoomStatus.Dirty && onUpdateStatus && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onUpdateStatus(room.id, RoomStatus.CleaningInProgress)}
              icon={Clock}
            >
              Start Cleaning
            </Button>
          )}
          {room.status === RoomStatus.CleaningInProgress && onUpdateStatus && (
            <Button
              variant="success"
              size="sm"
              onClick={() => onUpdateStatus(room.id, RoomStatus.Available)}
              icon={CheckCircle}
            >
              Mark Available
            </Button>
          )}
          {room.status === RoomStatus.Available && onUpdateStatus && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateStatus(room.id, RoomStatus.UnderMaintenance)}
              icon={Wrench}
            >
              Maintenance
            </Button>
          )}
          {onViewDetails && (
            <Button variant="primary" size="sm" onClick={() => onViewDetails(room)}>
              View Details
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

export default RoomCard
