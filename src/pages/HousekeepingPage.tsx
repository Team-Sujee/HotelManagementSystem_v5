import React, { useMemo, useState } from 'react'
import { HousekeepingTask, RoomStatus } from '../types'
import Card from '../components/atoms/Card'
import Badge from '../components/atoms/Badge'
import Button from '../components/atoms/Button'
import { CheckSquare, Square, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import Modal from '../components/molecules/Modal'
import { useRoomsStore } from '../store/roomsStore'

const HousekeepingPage: React.FC = () => {
  const roomsStore = useRoomsStore()
  // Derive tasks from rooms status
  const baseTasks: HousekeepingTask[] = useMemo(() => {
    return roomsStore.rooms
      .filter(r => r.status === RoomStatus.Dirty || r.status === RoomStatus.CleaningInProgress)
      .map(r => ({
        roomId: r.id,
        roomNumber: r.number,
        status: r.status,
        assignedTo: r.status === RoomStatus.CleaningInProgress ? 'Housekeeper John' : undefined,
        checklist: {
          cleanBathroom: false,
          changeBedSheets: false,
          replaceTowels: false,
          restockEssentials: false,
          floorCleaning: false,
          finalInspection: false,
        },
        lastUpdated: new Date().toISOString(),
      }))
  }, [roomsStore.rooms])
  const [tasks, setTasks] = useState<HousekeepingTask[]>(baseTasks)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<HousekeepingTask | null>(null)

  const getRoomImageUrl = (roomId: string) => {
    return roomsStore.rooms.find(room => room.id === roomId)?.imageUrl || 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  }

  const getStatusBadgeVariant = (status: RoomStatus) => {
    switch (status) {
      case RoomStatus.Dirty: return 'error'
      case RoomStatus.CleaningInProgress: return 'warning'
      case RoomStatus.Available: return 'success'
      default: return 'info'
    }
  }

  const handleToggleChecklistItem = (taskId: string, item: keyof HousekeepingTask['checklist']) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.roomId === taskId
          ? { ...task, checklist: { ...task.checklist, [item]: !task.checklist[item] } }
          : task
      )
    )
  }

  const handleMarkComplete = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.roomId === taskId
          ? { ...task, status: RoomStatus.Available, lastUpdated: new Date().toISOString() }
          : task
      )
    )
    roomsStore.markAvailable(taskId)
    setIsModalOpen(false)
  }

  const handleStartCleaning = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.roomId === taskId
          ? { ...task, status: RoomStatus.CleaningInProgress, assignedTo: 'Housekeeper John', lastUpdated: new Date().toISOString() }
          : task
      )
    )
    roomsStore.setStatus(taskId, RoomStatus.CleaningInProgress)
  }

  const openTaskModal = (task: HousekeepingTask) => {
    setSelectedTask(task)
    setIsModalOpen(true)
  }

  const pendingTasks = tasks.filter(task => task.status === RoomStatus.Dirty)
  const inProgressTasks = tasks.filter(task => task.status === RoomStatus.CleaningInProgress)

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-text mb-6 animate-fadeIn">Housekeeping Dashboard</h2>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card title="Pending Tasks">
          <div className="flex items-center gap-4">
            <AlertTriangle className="h-10 w-10 text-error" />
            <p className="text-4xl font-bold text-text">{pendingTasks.length}</p>
            <p className="text-textSecondary">rooms need cleaning</p>
          </div>
        </Card>
        <Card title="In Progress">
          <div className="flex items-center gap-4">
            <Clock className="h-10 w-10 text-warning" />
            <p className="text-4xl font-bold text-text">{inProgressTasks.length}</p>
            <p className="text-textSecondary">rooms currently being cleaned</p>
          </div>
        </Card>
      </div>

      {/* Task Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Rooms to Clean" className="animate-fadeIn">
          {pendingTasks.length === 0 ? (
            <p className="text-textSecondary text-center py-4">No rooms currently marked as dirty.</p>
          ) : (
            <ul className="space-y-4">
              {pendingTasks.map(task => (
                <li key={task.roomId} className="flex items-center justify-between bg-surface p-4 rounded-xl border border-border">
                  <div className="flex items-center gap-4">
                    <img src={getRoomImageUrl(task.roomId)} alt={`Room ${task.roomNumber}`} className="h-12 w-12 object-cover rounded-lg" />
                    <div>
                      <p className="font-semibold text-text">Room {task.roomNumber}</p>
                      <Badge variant={getStatusBadgeVariant(task.status)} className="mt-1">{task.status}</Badge>
                    </div>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => handleStartCleaning(task.roomId)} icon={Clock}>
                    Start Cleaning
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Cleaning in Progress" className="animate-fadeIn">
          {inProgressTasks.length === 0 ? (
            <p className="text-textSecondary text-center py-4">No rooms are currently being cleaned.</p>
          ) : (
            <ul className="space-y-4">
              {inProgressTasks.map(task => (
                <li key={task.roomId} className="flex items-center justify-between bg-surface p-4 rounded-xl border border-border">
                  <div className="flex items-center gap-4">
                    <img src={getRoomImageUrl(task.roomId)} alt={`Room ${task.roomNumber}`} className="h-12 w-12 object-cover rounded-lg" />
                    <div>
                      <p className="font-semibold text-text">Room {task.roomNumber}</p>
                      <Badge variant={getStatusBadgeVariant(task.status)} className="mt-1">{task.status}</Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openTaskModal(task)} icon={CheckSquare}>
                    View Checklist
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Task Checklist Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedTask ? `Room ${selectedTask.roomNumber} Cleaning Checklist` : 'Cleaning Checklist'}
      >
        {selectedTask && (
          <div className="space-y-4">
            <p className="text-textSecondary">Assigned To: <span className="font-medium text-text">{selectedTask.assignedTo || 'N/A'}</span></p>
            <p className="text-textSecondary">Last Updated: <span className="font-medium text-text">{new Date(selectedTask.lastUpdated).toLocaleString()}</span></p>

            <div className="space-y-2 mt-4">
              {Object.entries(selectedTask.checklist).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                  <span className="text-text capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleChecklistItem(selectedTask.roomId, key as keyof HousekeepingTask['checklist'])}
                    aria-label={`Toggle ${key}`}
                  >
                    {value ? <CheckSquare className="h-6 w-6 text-success" /> : <Square className="h-6 w-6 text-textSecondary" />}
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
              <Button
                variant="primary"
                onClick={() => handleMarkComplete(selectedTask.roomId)}
                icon={CheckCircle}
                disabled={!Object.values(selectedTask.checklist).every(Boolean)}
              >
                Mark as Available
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default HousekeepingPage
