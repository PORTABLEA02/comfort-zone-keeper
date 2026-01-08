import { useState } from 'react';
import { X, User, Stethoscope, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Database } from '../../lib/database.types';
import { FormActions } from '../UI/FormActions';

type ConsultationWorkflowRow = Database['public']['Tables']['consultation_workflows']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

type ConsultationWorkflow = ConsultationWorkflowRow & {
  patient?: Pick<Patient, 'first_name' | 'last_name'>;
};

interface DoctorAssignmentFormProps {
  workflow: ConsultationWorkflow;
  doctors: Profile[];
  onClose: () => void;
  onSave: (doctorId: string) => void;
}

export function DoctorAssignmentForm({ workflow, doctors, onClose, onSave }: DoctorAssignmentFormProps) {
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [assignmentMode, setAssignmentMode] = useState<'manual' | 'auto'>('manual');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDoctorId) {
      alert('Veuillez sélectionner un médecin');
      return;
    }
    
    onSave(selectedDoctorId);
  };

  const getConsultationTypeLabel = (type: string) => {
    const types = {
      general: 'Consultation générale',
      specialist: 'Consultation spécialisée',
      emergency: 'Consultation d\'urgence',
      followup: 'Consultation de suivi',
      preventive: 'Consultation préventive',
      other: 'Autre consultation'
    };
    return types[type as keyof typeof types] || type;
  };

  // Filtrer les médecins selon le type de consultation
  const getAvailableDoctors = () => {
    if (workflow.consultation_type === 'general') {
      // Pour les consultations générales, tous les médecins peuvent prendre en charge
      return doctors.filter(doctor => doctor.is_active);
    } else if (workflow.consultation_type === 'specialist') {
      // Pour les consultations spécialisées, privilégier les spécialistes
      return doctors.filter(doctor => 
        doctor.is_active && 
        doctor.speciality && 
        doctor.speciality !== 'Médecine générale'
      );
    } else {
      // Pour les autres types, tous les médecins actifs
      return doctors.filter(doctor => doctor.is_active);
    }
  };

  const availableDoctors = getAvailableDoctors();

  // Suggestion automatique de médecin
  const getSuggestedDoctor = () => {
    if (availableDoctors.length === 0) return null;
    
    // Logique simple : prendre le premier médecin disponible
    // Dans un vrai système, on pourrait considérer la charge de travail, les spécialités, etc.
    return availableDoctors[0];
  };

  const suggestedDoctor = getSuggestedDoctor();

  const handleAutoAssign = () => {
    if (suggestedDoctor) {
      setSelectedDoctorId(suggestedDoctor.id);
      setAssignmentMode('auto');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="card-glass rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-border/50 animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-gradient-subtle">
          <div>
            <h2 className="text-2xl font-bold text-gradient-primary">Attribution du Médecin</h2>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              Patient: {workflow.patient?.first_name} {workflow.patient?.last_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-muted p-2 rounded-xl transition-all hover-lift"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informations de la consultation */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-3">Informations de la Consultation</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Type de consultation:</span>
                <p className="text-gray-900">{getConsultationTypeLabel(workflow.consultation_type)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Facture:</span>
                <p className="text-gray-900">{workflow.invoice_id}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Heure d'arrivée:</span>
                <p className="text-gray-900">
                  {new Date(workflow.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Constantes prises:</span>
                <p className="text-gray-900">
                  {workflow.vital_signs_id ? (
                    <span className="text-green-600 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Oui
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Non
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Mode d'attribution */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3">Mode d'Attribution</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                assignmentMode === 'manual' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="assignmentMode"
                  value="manual"
                  checked={assignmentMode === 'manual'}
                  onChange={(e) => setAssignmentMode(e.target.value as 'manual' | 'auto')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <User className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">Attribution manuelle</span>
              </label>
              
              <label className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                assignmentMode === 'auto' ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="assignmentMode"
                  value="auto"
                  checked={assignmentMode === 'auto'}
                  onChange={(e) => setAssignmentMode(e.target.value as 'manual' | 'auto')}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <Clock className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-gray-900">Attribution automatique</span>
              </label>
            </div>

            {assignmentMode === 'auto' && suggestedDoctor && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Médecin suggéré:</span>
                    <p className="text-gray-900 font-medium">
                      Dr. {suggestedDoctor.first_name} {suggestedDoctor.last_name}
                    </p>
                    <p className="text-sm text-gray-600">{suggestedDoctor.speciality}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoAssign}
                    className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
                  >
                    Sélectionner
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sélection du médecin */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-3">Sélection du Médecin</h3>
            
            {availableDoctors.length > 0 ? (
              <div className="space-y-3">
                {availableDoctors.map((doctor) => (
                  <label
                    key={doctor.id}
                    className={`flex items-center space-x-4 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedDoctorId === doctor.id 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="doctorId"
                      value={doctor.id}
                      checked={selectedDoctorId === doctor.id}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="bg-green-100 p-2 rounded-full">
                        <Stethoscope className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          Dr. {doctor.first_name} {doctor.last_name}
                        </div>
                        <div className="text-sm text-gray-600">{doctor.speciality}</div>
                        <div className="text-xs text-gray-500">{doctor.department}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-green-600 font-medium">Disponible</div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun médecin disponible pour ce type de consultation</p>
              </div>
            )}
          </div>

          {/* Résumé de l'attribution */}
          {selectedDoctorId && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">Résumé de l'Attribution</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Patient:</strong> {workflow.patient?.first_name} {workflow.patient?.last_name}</p>
                <p><strong>Type:</strong> {getConsultationTypeLabel(workflow.consultation_type)}</p>
                <p><strong>Médecin:</strong> {availableDoctors.find(d => d.id === selectedDoctorId)?.first_name} {availableDoctors.find(d => d.id === selectedDoctorId)?.last_name}</p>
                <p><strong>Spécialité:</strong> {availableDoctors.find(d => d.id === selectedDoctorId)?.speciality}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <FormActions
            onCancel={onClose}
            submitLabel="Attribuer le médecin"
            disabled={!selectedDoctorId}
            showPrevious={false}
            showNext={false}
          />
        </form>
      </div>
    </div>
  );
}