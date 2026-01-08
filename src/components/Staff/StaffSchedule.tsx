import { useState } from 'react';
import { Calendar, Clock, User, Plus, Edit, Trash2, Filter } from 'lucide-react';
import { ScheduleSlotForm } from './ScheduleSlotForm';
import { Database } from '../../lib/database.types';
import { ConfirmDialog } from '../UI/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';
import { useStaffSchedules, useCreateStaffSchedule, useDeleteStaffSchedule } from '../../hooks/queries/useStaffSchedules';
import { useStaff } from '../../hooks/queries/useStaff';

type StaffSchedule = Database['public']['Tables']['staff_schedules']['Row'];

// Helper function to get week dates
function getWeekDates(date: string) {
  const currentDate = new Date(date);
  const week = [];
  
  // Trouver le lundi de la semaine
  const monday = new Date(currentDate);
  monday.setDate(currentDate.getDate() - currentDate.getDay() + 1);
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    week.push(day.toISOString().split('T')[0]);
  }
  
  return week;
}

export function StaffSchedule() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  // React Query hooks
  const startDate = getWeekDates(selectedDate)[0];
  const { data: schedules = [], isLoading: schedulesLoading } = useStaffSchedules(startDate);
  const { data: staff = [], isLoading: staffLoading } = useStaff();
  const createScheduleMutation = useCreateStaffSchedule();
  const deleteScheduleMutation = useDeleteStaffSchedule();

  const loading = schedulesLoading || staffLoading;

  const filteredSchedule = schedules.filter(entry => {
    const matchesDate = entry.date === selectedDate;
    const matchesShift = selectedShift === 'all' || entry.shift === selectedShift;
    return matchesDate && matchesShift;
  });

  const getShiftLabel = (shift: string) => {
    const labels = {
      morning: 'Matin',
      afternoon: 'Après-midi',
      night: 'Nuit',
      'full-day': 'Journée complète'
    };
    return labels[shift as keyof typeof labels] || shift;
  };

  const getShiftColor = (shift: string) => {
    const colors = {
      morning: 'bg-yellow-100 text-yellow-800',
      afternoon: 'bg-orange-100 text-orange-800',
      night: 'bg-blue-100 text-blue-800',
      'full-day': 'bg-green-100 text-green-800'
    };
    return colors[shift as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      scheduled: 'Planifié',
      confirmed: 'Confirmé',
      completed: 'Terminé',
      absent: 'Absent'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      absent: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Administrateur',
      doctor: 'Médecin',
      secretary: 'Personnel soignant'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const calculateHours = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diff = end.getTime() - start.getTime();
    return Math.round(diff / (1000 * 60 * 60));
  };

  const handleAddScheduleSlot = () => {
    setShowScheduleForm(true);
  };

  const handleSaveScheduleSlot = (slotData: any) => {
    createScheduleMutation.mutate({
      staff_id: slotData.staffId,
      date: slotData.date,
      start_time: slotData.startTime,
      end_time: slotData.endTime,
      shift: slotData.shift,
      status: slotData.status
    });
    setShowScheduleForm(false);
  };

  const handleEditSchedule = async (scheduleId: string) => {
    // TODO: Implémenter l'édition des créneaux
    console.log('Edit schedule:', scheduleId);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    const confirmed = await confirm({
      title: 'Supprimer le créneau',
      message: 'Êtes-vous sûr de vouloir supprimer ce créneau de planning ? Cette action est irréversible.',
      type: 'danger',
      confirmText: 'Supprimer',
      cancelText: 'Annuler'
    });
    
    if (confirmed) {
      deleteScheduleMutation.mutate(scheduleId);
    }
  };

  const handleCloseScheduleForm = () => {
    setShowScheduleForm(false);
  };

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : 'Personnel inconnu';
  };

  const weekDates = getWeekDates(selectedDate);
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Chargement du planning...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Planning hebdomadaire */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Planning Hebdomadaire</h2>
            <button 
              onClick={handleAddScheduleSlot}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter un créneau</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les créneaux</option>
                <option value="morning">Matin</option>
                <option value="afternoon">Après-midi</option>
                <option value="night">Nuit</option>
                <option value="full-day">Journée complète</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vue calendrier hebdomadaire */}
        <div className="p-6">
          <div className="grid grid-cols-7 gap-4 mb-6">
            {weekDates.map((date, index) => {
              const daySchedule = schedules.filter(entry => entry.date === date);
              const isSelected = date === selectedDate;
              
              return (
                <div
                  key={date}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedDate(date)}
                >
                  <div className="text-center mb-3">
                    <div className="text-sm font-medium text-gray-600">{dayNames[index]}</div>
                    <div className="text-lg font-bold text-gray-900">
                      {new Date(date).getDate()}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    {daySchedule.slice(0, 3).map(entry => (
                      <div
                        key={entry.id}
                        className="text-xs p-1 rounded bg-gray-100 text-gray-700 truncate"
                      >
                        {getStaffName(entry.staff_id).split(' ')[0]}
                      </div>
                    ))}
                    {daySchedule.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{daySchedule.length - 3} autres
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Planning détaillé du jour sélectionné */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Planning du {new Date(selectedDate).toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            <div className="text-sm text-gray-600">
              {filteredSchedule.length} personne{filteredSchedule.length > 1 ? 's' : ''} programmée{filteredSchedule.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="p-6">
          {filteredSchedule.length > 0 ? (
            <div className="space-y-4">
              {filteredSchedule
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {entry.start_time} - {entry.end_time}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({calculateHours(entry.start_time, entry.end_time)}h)
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {getStaffName(entry.staff_id)}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({getRoleLabel(staff.find(s => s.id === entry.staff_id)?.role || 'secretary')})
                          </span>
                        </div>

                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getShiftColor(entry.shift)}`}>
                          {getShiftLabel(entry.shift)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                          {getStatusLabel(entry.status)}
                        </span>
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => handleEditSchedule(entry.id)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteSchedule(entry.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun planning pour cette date</p>
              <button 
                onClick={handleAddScheduleSlot}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ajouter un créneau
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Résumé des heures */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Résumé des Heures</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredSchedule.reduce((total, entry) => 
                  total + calculateHours(entry.start_time, entry.end_time), 0
                )}h
              </div>
              <div className="text-sm text-blue-600">Total planifié</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredSchedule.filter(e => e.status === 'confirmed').length}
              </div>
              <div className="text-sm text-green-600">Créneaux confirmés</div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredSchedule.filter(e => e.status === 'scheduled').length}
              </div>
              <div className="text-sm text-yellow-600">En attente</div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {filteredSchedule.filter(e => e.status === 'absent').length}
              </div>
              <div className="text-sm text-red-600">Absences</div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire d'ajout de créneau */}
      {showScheduleForm && (
        <ScheduleSlotForm
          selectedDate={selectedDate}
          availableStaff={staff.map(s => ({
            ...s,
            is_active: s.is_active ?? true,
            created_at: s.created_at || new Date().toISOString(),
            updated_at: s.updated_at || new Date().toISOString()
          }))}
          onClose={handleCloseScheduleForm}
          onSave={handleSaveScheduleSlot}
        />
      )}

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        isLoading={confirmState.isLoading}
      />
    </div>
  );
}