import React, { useState } from 'react';
import { X, Save, Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { Database } from '../../lib/database.types';
import { StaffScheduleService } from '../../services/staff-schedules';
import { ConfirmDialog } from '../UI/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface ScheduleSlotData {
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  shift: 'morning' | 'afternoon' | 'night' | 'full-day';
  status: 'scheduled' | 'confirmed' | 'completed' | 'absent';
}

interface ScheduleSlotFormProps {
  onClose: () => void;
  onSave: (slotData: ScheduleSlotData) => void;
  selectedDate?: string;
  availableStaff: Profile[];
}

const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30'
];

const SHIFT_PRESETS = {
  morning: { start: '07:30', end: '15:30', label: 'Matin (7h30 - 15h30)' },
  afternoon: { start: '15:00', end: '23:00', label: 'Après-midi (15h00 - 23h00)' },
  night: { start: '23:00', end: '07:00', label: 'Nuit (23h00 - 7h00)' },
  'full-day': { start: '08:00', end: '18:00', label: 'Journée complète (8h00 - 18h00)' }
};

export function ScheduleSlotForm({ onClose, onSave, selectedDate, availableStaff }: ScheduleSlotFormProps) {
  const [formData, setFormData] = useState<ScheduleSlotData>({
    staffId: '',
    date: selectedDate || new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '16:00',
    shift: 'full-day',
    status: 'scheduled'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Empêcher les soumissions multiples
    
    // Validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.staffId) {
      newErrors.staffId = 'Veuillez sélectionner un membre du personnel';
    }
    
    if (!formData.date) {
      newErrors.date = 'La date est requise';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.date = 'La date ne peut pas être dans le passé';
      }
    }
    
    if (!formData.startTime) {
      newErrors.startTime = 'L\'heure de début est requise';
    }
    
    if (!formData.endTime) {
      newErrors.endTime = 'L\'heure de fin est requise';
    }
    
    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      
      // Handle night shift (end time next day)
      if (formData.shift === 'night' && end < start) {
        end.setDate(end.getDate() + 1);
      }
      
      if (end <= start && formData.shift !== 'night') {
        newErrors.endTime = 'L\'heure de fin doit être après l\'heure de début';
      }
      
      const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      if (duration > 12) {
        newErrors.endTime = 'Un créneau ne peut pas dépasser 12 heures';
      }
      
      // Vérifier les conflits d'horaires
      if (formData.staffId && formData.date && formData.startTime && formData.endTime) {
        setCheckingConflicts(true);
        try {
          const hasConflict = await StaffScheduleService.checkConflicts(
            formData.staffId,
            formData.date,
            formData.startTime,
            formData.endTime
          );
          
          if (hasConflict) {
            newErrors.general = 'Ce membre du personnel a déjà un créneau qui chevauche avec ces horaires';
          }
        } catch (error) {
          console.error('Error checking conflicts:', error);
        } finally {
          setCheckingConflicts(false);
        }
      }
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      // Utiliser la modale de confirmation personnalisée
      const staffMember = availableStaff.find(s => s.id === formData.staffId);
      const duration = calculateDuration();
      
      const confirmed = await confirm({
        title: 'Confirmer l\'ajout du créneau',
        message: `Voulez-vous ajouter ce créneau de planning ?\n\n` +
                `Personnel: ${staffMember?.first_name} ${staffMember?.last_name}\n` +
                `Date: ${new Date(formData.date).toLocaleDateString('fr-FR')}\n` +
                `Horaires: ${formData.startTime} - ${formData.endTime} (${duration.toFixed(1)}h)\n` +
                `Type: ${SHIFT_PRESETS[formData.shift].label}`,
        type: 'info',
        confirmText: 'Ajouter le créneau',
        cancelText: 'Annuler'
      });
      
      if (confirmed) {
        setIsSubmitting(true);
        try {
          onSave(formData);
        } catch (error) {
          console.error('Error saving schedule slot:', error);
          setIsSubmitting(false);
        }
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleShiftChange = (shift: keyof typeof SHIFT_PRESETS) => {
    const preset = SHIFT_PRESETS[shift];
    setFormData({
      ...formData,
      shift,
      startTime: preset.start,
      endTime: preset.end
    });
  };

  const getStaffInfo = (staffId: string) => {
    return availableStaff.find(s => s.id === staffId);
  };

  const calculateDuration = () => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      
      // Handle night shift
      if (formData.shift === 'night' && end < start) {
        end.setDate(end.getDate() + 1);
      }
      
      const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return Math.max(0, duration);
    }
    return 0;
  };

  const selectedStaff = getStaffInfo(formData.staffId);
  const duration = calculateDuration();

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Administrateur',
      doctor: 'Médecin',
      secretary: 'Personnel soignant'
    };
    return labels[role as keyof typeof labels] || role;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-card rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[95vh] overflow-y-auto animate-scale-in">
          <div className="flex items-center justify-between p-6 border-b border-border/50">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-light/20 p-2 rounded-xl">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-card-foreground">Ajouter un Créneau</h2>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover-lift"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {errors.general && (
              <div className="bg-error-light border border-error rounded-xl p-4 animate-slide-down">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-error" />
                  <span className="text-sm font-medium text-error">{errors.general}</span>
                </div>
              </div>
            )}

            {checkingConflicts && (
              <div className="bg-info-light border border-info rounded-xl p-4 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-info"></div>
                  <span className="text-sm font-medium text-info">Vérification des conflits d'horaires...</span>
                </div>
              </div>
            )}

            {isSubmitting && (
              <div className="bg-success-light border border-success rounded-xl p-4 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-success"></div>
                  <div>
                    <p className="text-sm font-medium text-success">Enregistrement du créneau en cours...</p>
                    <p className="text-xs text-success/80">Veuillez patienter, ne fermez pas cette fenêtre.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sélection du personnel */}
            <div className="bg-info-light rounded-xl p-4 border border-info/20">
              <h3 className="font-medium text-info mb-4">Personnel</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membre du personnel *
                </label>
                <select
                  name="staffId"
                  value={formData.staffId}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                    errors.staffId ? 'border-error' : 'border-input'
                  }`}
                >
                  <option value="">Sélectionner un membre du personnel</option>
                  {availableStaff.filter(s => s.is_active).map(staffMember => (
                    <option key={staffMember.id} value={staffMember.id}>
                      {staffMember.first_name} {staffMember.last_name} - {staffMember.department || 'Non défini'}
                      {staffMember.speciality && ` (${staffMember.speciality})`}
                    </option>
                  ))}
                </select>
                {errors.staffId && (
                  <div className="flex items-center space-x-1 mt-1">
                    <AlertCircle className="h-4 w-4 text-error" />
                    <span className="text-sm text-error">{errors.staffId}</span>
                  </div>
                )}
              </div>

              {selectedStaff && (
                <div className="mt-3 p-3 bg-card rounded-xl border border-info/30">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-info" />
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">
                        {selectedStaff.first_name} {selectedStaff.last_name}
                      </span>
                      <span className="text-gray-600 ml-2">
                        {getRoleLabel(selectedStaff.role)}
                      </span>
                      <span className="text-gray-500 ml-2">• {selectedStaff.department || 'Non défini'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Date et créneau */}
            <div className="bg-success-light rounded-xl p-4 border border-success/20">
              <h3 className="font-medium text-success mb-4">Date et Horaires</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                      errors.date ? 'border-error' : 'border-input'
                    }`}
                  />
                  {errors.date && (
                    <div className="flex items-center space-x-1 mt-1">
                      <AlertCircle className="h-4 w-4 text-error" />
                      <span className="text-sm text-error">{errors.date}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de créneau
                  </label>
                  <select
                    name="shift"
                    value={formData.shift}
                    onChange={(e) => handleShiftChange(e.target.value as keyof typeof SHIFT_PRESETS)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {Object.entries(SHIFT_PRESETS).map(([key, preset]) => (
                      <option key={key} value={key}>{preset.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Heure de début *
                  </label>
                  <select
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                      errors.startTime ? 'border-error' : 'border-input'
                    }`}
                  >
                    {TIME_SLOTS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                  {errors.startTime && (
                    <div className="flex items-center space-x-1 mt-1">
                      <AlertCircle className="h-4 w-4 text-error" />
                      <span className="text-sm text-error">{errors.startTime}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Heure de fin *
                  </label>
                  <select
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                      errors.endTime ? 'border-error' : 'border-input'
                    }`}
                  >
                    {TIME_SLOTS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                  {errors.endTime && (
                    <div className="flex items-center space-x-1 mt-1">
                      <AlertCircle className="h-4 w-4 text-error" />
                      <span className="text-sm text-error">{errors.endTime}</span>
                    </div>
                  )}
                </div>
              </div>

              {duration > 0 && (
                <div className="mt-3 p-3 bg-card rounded-xl border border-success/30">
                  <div className="text-sm">
                    <span className="font-medium text-foreground">Durée du créneau: </span>
                    <span className="text-card-foreground">{duration.toFixed(1)} heures</span>
                    {formData.shift === 'night' && formData.endTime < formData.startTime && (
                      <span className="text-warning ml-2">(se termine le lendemain)</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Statut */}
            <div className="bg-warning-light rounded-xl p-4 border border-warning/20">
              <h3 className="font-medium text-warning mb-4">Statut</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut du créneau
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <option value="scheduled">Planifié</option>
                  <option value="confirmed">Confirmé</option>
                  <option value="completed">Terminé</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
            </div>

            {/* Résumé */}
            {formData.staffId && formData.date && formData.startTime && formData.endTime && (
              <div className="bg-info-light rounded-xl p-4 border border-info/30">
                <h3 className="font-medium text-info mb-2">Résumé du Créneau</h3>
                <div className="text-sm text-info/90 space-y-1">
                  <p><strong>Personnel:</strong> {selectedStaff?.first_name} {selectedStaff?.last_name}</p>
                  <p><strong>Date:</strong> {new Date(formData.date).toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                  <p><strong>Horaires:</strong> {formData.startTime} - {formData.endTime}</p>
                  <p><strong>Durée:</strong> {duration.toFixed(1)} heures</p>
                  <p><strong>Type:</strong> {SHIFT_PRESETS[formData.shift].label}</p>
                  <p><strong>Statut:</strong> {
                    formData.status === 'scheduled' ? 'Planifié' :
                    formData.status === 'confirmed' ? 'Confirmé' :
                    formData.status === 'completed' ? 'Terminé' : 'Absent'
                  }</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-border/50">
              <button
                type="button"
                onClick={onClose}
                disabled={checkingConflicts || isSubmitting}
                className="px-6 py-2 text-muted-foreground border border-border rounded-xl hover:bg-muted transition-all hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={checkingConflicts || isSubmitting}
                className="btn-gradient px-6 py-2 rounded-xl hover-lift shadow-glow flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                <span>
                  {checkingConflicts ? 'Vérification...' : 
                   isSubmitting ? 'Enregistrement...' : 
                   'Ajouter le créneau'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modale de confirmation personnalisée */}
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
    </>
  );
}