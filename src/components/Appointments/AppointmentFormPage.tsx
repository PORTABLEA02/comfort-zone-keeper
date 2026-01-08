import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, User, Stethoscope, FileText, Save, Check, AlertCircle } from 'lucide-react';
import { usePatients } from '../../hooks/queries/usePatients';
import { useDoctors } from '../../hooks/queries/useStaff';
import { useCreateAppointment, useUpdateAppointment } from '../../hooks/queries/useAppointments';
import { useRouter } from '../../hooks/useRouter';
import { AppointmentService } from '../../services/appointments';
import { toast } from 'sonner';

const TIME_SLOTS_MORNING = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
const TIME_SLOTS_AFTERNOON = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];

const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1h' },
  { value: 90, label: '1h30' },
  { value: 120, label: '2h' },
];

export function AppointmentFormPage() {
  const { navigate, queryParams } = useRouter();
  const appointmentId = queryParams.appointmentId;
  const preselectedDate = queryParams.date;
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    date: preselectedDate || new Date().toISOString().split('T')[0],
    time: '',
    duration: 30,
    reason: '',
    status: 'scheduled' as 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show',
    notes: ''
  });
  
  const [loading, setLoading] = useState(!!appointmentId);
  const [saving, setSaving] = useState(false);

  const { data: patients = [], isLoading: patientsLoading } = usePatients();
  const { data: doctors = [], isLoading: doctorsLoading } = useDoctors();
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();

  const isEditing = !!appointmentId;

  useEffect(() => {
    if (appointmentId) {
      loadAppointment();
    }
  }, [appointmentId]);

  const loadAppointment = async () => {
    try {
      setLoading(true);
      const data = await AppointmentService.getById(appointmentId!);
      if (data) {
        setFormData({
          patient_id: data.patient_id,
          doctor_id: data.doctor_id,
          date: data.date,
          time: data.time,
          duration: data.duration,
          reason: data.reason,
          status: data.status || 'scheduled',
          notes: data.notes || ''
        });
      }
    } catch (error) {
      console.error('Error loading appointment:', error);
      toast.error('Erreur lors du chargement du rendez-vous');
      navigate('appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patient_id || !formData.doctor_id || !formData.date || !formData.time || !formData.reason) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && appointmentId) {
        await updateAppointment.mutateAsync({ id: appointmentId, data: formData as any });
        toast.success('Rendez-vous mis à jour');
      } else {
        await createAppointment.mutateAsync(formData as any);
        toast.success('Rendez-vous créé');
      }
      navigate('appointments');
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'duration' ? parseInt(value) : value 
    }));
  };

  const selectedPatient = patients.find(p => p.id === formData.patient_id);
  const selectedDoctor = doctors.find(d => d.id === formData.doctor_id);
  const today = new Date().toISOString().split('T')[0];

  // Calculate completion progress
  const completedFields = [
    formData.patient_id,
    formData.doctor_id,
    formData.date,
    formData.time,
    formData.reason
  ].filter(Boolean).length;
  const totalFields = 5;
  const progressPercentage = (completedFields / totalFields) * 100;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  if (loading || patientsLoading || doctorsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('appointments')}
            className="p-2 hover:bg-muted rounded-xl transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEditing ? 'Modifier le Rendez-vous' : 'Nouveau Rendez-vous'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Mettre à jour les informations' : 'Planifier un nouveau rendez-vous'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main Form - Left Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Participants Section */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Participants
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Patient Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Patient *</label>
                <select
                  name="patient_id"
                  value={formData.patient_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="">Sélectionner un patient</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name}
                    </option>
                  ))}
                </select>
                
                {selectedPatient && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 p-2 bg-muted/50 rounded-lg">
                    <span>{selectedPatient.phone}</span>
                    <span>•</span>
                    <span>{new Date().getFullYear() - new Date(selectedPatient.date_of_birth).getFullYear()} ans</span>
                    {selectedPatient.blood_type && (
                      <>
                        <span>•</span>
                        <span className="text-destructive font-medium">{selectedPatient.blood_type}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Doctor Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Stethoscope className="h-3.5 w-3.5" />
                  Médecin *
                </label>
                <select
                  name="doctor_id"
                  value={formData.doctor_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="">Sélectionner un médecin</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.first_name} {doctor.last_name}
                    </option>
                  ))}
                </select>
                
                {selectedDoctor && (
                  <div className="text-xs text-muted-foreground mt-1 p-2 bg-muted/50 rounded-lg">
                    {selectedDoctor.speciality || 'Médecin généraliste'}
                  </div>
                )}
              </div>
            </div>

            {/* Patient Allergies Warning */}
            {selectedPatient?.allergies && selectedPatient.allergies.length > 0 && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div className="text-sm">
                  <span className="font-medium text-destructive">Allergies: </span>
                  <span className="text-destructive/80">{selectedPatient.allergies.join(', ')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Scheduling Section */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Planification
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={today}
                  required
                  className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              {/* Duration */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Durée</label>
                <div className="flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, duration: option.value }))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        formData.duration === option.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Time Slots Grid */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Heure *
              </label>
              
              {/* Morning Slots */}
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Matin</span>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {TIME_SLOTS_MORNING.map(time => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, time }))}
                      className={`px-2 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.time === time
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-muted/50 text-foreground hover:bg-muted'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Afternoon Slots */}
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Après-midi</span>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {TIME_SLOTS_AFTERNOON.map(time => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, time }))}
                      className={`px-2 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.time === time
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-muted/50 text-foreground hover:bg-muted'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Détails
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Motif de consultation *
                </label>
                <input
                  type="text"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Consultation de routine, Contrôle cardiologique..."
                  className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Notes complémentaires
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Notes particulières, instructions spéciales..."
                  className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Panel - Right Column */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border border-border p-6 lg:sticky lg:top-6">
            {/* Progress Indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Progression</span>
                <span className="text-sm text-muted-foreground">{completedFields}/{totalFields}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            <h3 className="font-semibold text-foreground mb-4">Résumé du rendez-vous</h3>
            
            <div className="space-y-4">
              {/* Patient */}
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  selectedPatient ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Patient</p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {selectedPatient 
                      ? `${selectedPatient.first_name} ${selectedPatient.last_name}` 
                      : '—'}
                  </p>
                </div>
                {selectedPatient && <Check className="h-4 w-4 text-primary shrink-0" />}
              </div>

              {/* Doctor */}
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  selectedDoctor ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  <Stethoscope className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Médecin</p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {selectedDoctor 
                      ? `Dr. ${selectedDoctor.first_name} ${selectedDoctor.last_name}` 
                      : '—'}
                  </p>
                </div>
                {selectedDoctor && <Check className="h-4 w-4 text-primary shrink-0" />}
              </div>

              {/* Date & Time */}
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  formData.date && formData.time ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Date et heure</p>
                  <p className="text-sm font-medium text-foreground">
                    {formData.date ? formatDate(formData.date) : '—'}
                  </p>
                  {formData.time && (
                    <p className="text-sm text-primary font-semibold">
                      {formData.time} • {formData.duration} min
                    </p>
                  )}
                </div>
                {formData.date && formData.time && <Check className="h-4 w-4 text-primary shrink-0" />}
              </div>

              {/* Reason */}
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  formData.reason ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Motif</p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {formData.reason || '—'}
                  </p>
                </div>
                {formData.reason && <Check className="h-4 w-4 text-primary shrink-0" />}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-6 border-t border-border space-y-3">
              <button
                type="submit"
                disabled={saving || completedFields < totalFields}
                className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer le rendez-vous'}
              </button>
              <button
                type="button"
                onClick={() => navigate('appointments')}
                className="w-full px-4 py-2.5 border border-border rounded-xl text-foreground hover:bg-muted transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
