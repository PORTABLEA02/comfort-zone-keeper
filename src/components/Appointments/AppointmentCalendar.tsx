import { useState } from 'react';
import { Calendar, Plus, ChevronLeft, ChevronRight, Clock, User, Trash2, Edit } from 'lucide-react';
import { ConfirmDialog } from '../UI/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';
import { Tables } from '../../integrations/supabase/types';
import { useAppointments, useDeleteAppointment } from '../../hooks/queries/useAppointments';
import { usePatients } from '../../hooks/queries/usePatients';
import { useDoctors } from '../../hooks/queries/useStaff';
import { useRouter } from '../../hooks/useRouter';
import { getStatusColor, getStatusLabel } from '../../lib/type-helpers';

type Appointment = Tables<'appointments'>;

export function AppointmentCalendar() {
  const { navigate } = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  // React Query hooks
  const { data: appointments = [], isLoading: appointmentsLoading } = useAppointments();
  const { data: patients = [], isLoading: patientsLoading } = usePatients();
  const { data: doctors = [], isLoading: doctorsLoading } = useDoctors();
  const deleteAppointmentMutation = useDeleteAppointment();

  const loading = appointmentsLoading || patientsLoading || doctorsLoading;

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getAppointmentsForDate = (date: Date) => {
    // Utiliser une méthode qui évite les problèmes de fuseau horaire
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    return appointments.filter(apt => apt.date === dateString);
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.first_name} ${patient.last_name}` : 'Patient inconnu';
  };

  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : 'Médecin inconnu';
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    // Utiliser une méthode qui évite les problèmes de fuseau horaire
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    setSelectedDate(dateString);
  };

  const handleNewAppointment = () => {
    navigate(`appointment-form?date=${selectedDate}`);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    navigate(`appointment-form?appointmentId=${appointment.id}`);
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    const confirmed = await confirm({
      title: 'Supprimer le rendez-vous',
      message: 'Êtes-vous sûr de vouloir supprimer ce rendez-vous ? Cette action est irréversible.',
      type: 'danger',
      confirmText: 'Supprimer',
      cancelText: 'Annuler'
    });
    
    if (confirmed) {
      deleteAppointmentMutation.mutate(appointmentId);
    }
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const days = getDaysInMonth(currentDate);
  const selectedDateAppointments = appointments.filter(apt => apt.date === selectedDate);

  if (loading) {
    return (
      <div className="card-glass rounded-2xl p-8 animate-fade-in">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-primary mx-auto shadow-glow"></div>
          <p className="text-muted-foreground mt-4 font-medium">Chargement du calendrier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card-glass rounded-2xl shadow-card border border-border/50">
        <div className="p-6 border-b border-border/50 bg-gradient-subtle">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gradient-primary">Calendrier des Rendez-vous</h2>
              <p className="text-sm text-muted-foreground mt-1 font-medium">
                Gérer et planifier les consultations
              </p>
            </div>
            <button
              onClick={handleNewAppointment}
              className="btn-gradient px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 hover-lift shadow-glow"
            >
              <Plus className="h-5 w-5" />
              <span>Nouveau RDV</span>
            </button>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePreviousMonth}
              className="p-3 hover:bg-primary/10 rounded-xl transition-all hover-lift border border-border/50"
            >
              <ChevronLeft className="h-6 w-6 text-foreground" />
            </button>
            
            <h3 className="text-xl font-bold text-foreground">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            
            <button
              onClick={handleNextMonth}
              className="p-3 hover:bg-primary/10 rounded-xl transition-all hover-lift border border-border/50"
            >
              <ChevronRight className="h-6 w-6 text-foreground" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center text-sm font-bold text-muted-foreground uppercase tracking-wide">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="p-2 h-24"></div>;
              }
              
              const dayAppointments = getAppointmentsForDate(day);
              // Comparer les dates de manière plus fiable
              const year = day.getFullYear();
              const month = String(day.getMonth() + 1).padStart(2, '0');
              const dayNum = String(day.getDate()).padStart(2, '0');
              const dayString = `${year}-${month}-${dayNum}`;
              const isSelected = dayString === selectedDate;
              const isToday = day.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(day)}
                  className={`p-2 h-24 border-2 rounded-xl cursor-pointer transition-all duration-200 hover-lift ${
                    isSelected ? 'bg-primary/10 border-primary shadow-md' : 'border-border/50 hover:border-primary/50'
                  } ${isToday ? 'bg-warning/10 border-warning' : ''}`}
                >
                  <div className={`text-sm font-bold mb-2 ${
                    isToday ? 'text-warning' : isSelected ? 'text-primary' : 'text-foreground'
                  }`}>
                    {day.getDate()}
                  </div>
                  
                  <div className="space-y-0.5 lg:space-y-1">
                    {dayAppointments.slice(0, window.innerWidth < 1024 ? 1 : 2).map((apt, aptIndex) => (
                      <div
                        key={aptIndex}
                        className={`text-xs p-0.5 lg:p-1 rounded truncate ${getStatusColor(apt.status || null)}`}
                        title={`${apt.time} - ${getPatientName(apt.patient_id)}`}
                      >
                        <span className="hidden lg:inline">{apt.time} - </span>
                        {getPatientName(apt.patient_id).split(' ')[0]}
                      </div>
                    ))}
                    {dayAppointments.length > (window.innerWidth < 1024 ? 1 : 2) && (
                      <div className="text-xs text-gray-500 text-center hidden lg:block">
                        +{dayAppointments.length - (window.innerWidth < 1024 ? 1 : 2)} autres
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Date Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Rendez-vous du {new Date(selectedDate).toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            <div className="text-sm text-gray-600">
              {selectedDateAppointments.length} rendez-vous
            </div>
          </div>
        </div>

        <div className="p-6">
          {selectedDateAppointments.length > 0 ? (
            <div className="space-y-4">
              {selectedDateAppointments
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((appointment) => (
                  <div
                    key={appointment.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {appointment.time}
                            </span>
                            <span className="text-sm text-gray-500">
                              ({appointment.duration} min)
                            </span>
                          </div>
                          
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status || null)}`}>
                            {getStatusLabel(appointment.status || null)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <span className="font-medium text-gray-700">Patient: </span>
                              <span className="text-gray-900">{getPatientName(appointment.patient_id)}</span>
                            </div>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-700">Médecin: </span>
                            <span className="text-gray-900">{getDoctorName(appointment.doctor_id)}</span>
                          </div>
                          
                          <div className="md:col-span-2">
                            <span className="font-medium text-gray-700">Motif: </span>
                            <span className="text-gray-900">{appointment.reason}</span>
                          </div>
                          
                          {appointment.notes && (
                            <div className="md:col-span-2">
                              <span className="font-medium text-gray-700">Notes: </span>
                              <span className="text-gray-900 italic">{appointment.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEditAppointment(appointment)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAppointment(appointment.id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun rendez-vous pour cette date</p>
              <button
                onClick={handleNewAppointment}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Planifier un rendez-vous
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">Total RDV</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{appointments.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-lg mr-3">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">Confirmés</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {appointments.filter(a => a.status === 'confirmed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-2 rounded-lg mr-3">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">En attente</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {appointments.filter(a => a.status === 'scheduled').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-gray-100 p-2 rounded-lg mr-3">
              <Calendar className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">Terminés</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {appointments.filter(a => a.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

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