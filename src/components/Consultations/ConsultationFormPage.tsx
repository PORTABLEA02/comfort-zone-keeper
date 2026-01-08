import { useState, useEffect } from 'react';
import { ArrowLeft, User, Calendar, FileText, Pill, Plus, Trash2, Save, CheckCircle } from 'lucide-react';
import { Tables } from '../../integrations/supabase/types';
import { PatientService } from '../../services/patients';
import { MedicalRecordService } from '../../services/medical-records';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../hooks/useRouter';
import { useCreateConsultation, useUpdateConsultation, useCreateControl } from '../../hooks/queries/useConsultations';
import { toast } from 'sonner';

type MedicalRecord = Tables<'medical_records'>;
type Patient = Tables<'patients'>;

interface PrescriptionInput {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export function ConsultationFormPage() {
  const { navigate, queryParams } = useRouter();
  const consultationId = queryParams.consultationId;
  const parentConsultationId = queryParams.parentConsultationId; // Pour les contrôles
  const { user } = useAuth();
  
  const [consultation, setConsultation] = useState<MedicalRecord | null>(null);
  const [parentConsultation, setParentConsultation] = useState<MedicalRecord | null>(null);
  const [formData, setFormData] = useState({
    patient_id: '',
    date: new Date().toISOString().split('T')[0],
    type: 'general' as 'general' | 'specialist' | 'emergency' | 'followup' | 'preventive' | 'other',
    reason: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    notes: '',
    previous_treatment: '',
    physical_examination: '',
    lab_orders: ''
  });
  
  const [prescriptions, setPrescriptions] = useState<PrescriptionInput[]>([]);
  const [newPrescription, setNewPrescription] = useState<PrescriptionInput>({
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const createConsultation = useCreateConsultation();
  const updateConsultation = useUpdateConsultation();
  const createControl = useCreateControl();
  
  const isEditing = !!consultationId;
  const isControl = !!parentConsultationId;
  const isAutoCreated = consultation?.notes?.includes('Consultation créée automatiquement depuis le workflow');

  useEffect(() => {
    loadData();
  }, [consultationId, parentConsultationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const patientsData = await PatientService.getAll();
      setPatients(patientsData as Patient[]);
      
      if (consultationId) {
        // Mode édition
        const consultationData = await MedicalRecordService.getById(consultationId);
        if (consultationData) {
          setConsultation(consultationData as MedicalRecord);
          setFormData({
            patient_id: consultationData.patient_id,
            date: consultationData.date,
            type: consultationData.type as any,
            reason: consultationData.reason,
            symptoms: consultationData.symptoms || '',
            diagnosis: consultationData.diagnosis,
            treatment: consultationData.treatment || '',
            notes: consultationData.notes || '',
            previous_treatment: (consultationData as any).previous_treatment || '',
            physical_examination: (consultationData as any).physical_examination || '',
            lab_orders: (consultationData as any).lab_orders || ''
          });
        }
      } else if (parentConsultationId) {
        // Mode contrôle - charger la consultation parente
        const parentData = await MedicalRecordService.getById(parentConsultationId);
        if (parentData) {
          setParentConsultation(parentData as MedicalRecord);
          // Pré-remplir avec les données de la consultation parente
          setFormData({
            patient_id: parentData.patient_id,
            date: new Date().toISOString().split('T')[0],
            type: 'followup', // Les contrôles sont des suivis
            reason: `Contrôle suite à la consultation du ${new Date(parentData.date).toLocaleDateString('fr-FR')}`,
            symptoms: '',
            diagnosis: '',
            treatment: '',
            notes: '',
            previous_treatment: parentData.treatment || '',
            physical_examination: '',
            lab_orders: ''
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patient_id || !formData.diagnosis || !formData.reason) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    setSaving(true);
    try {
      const recordData = {
        ...formData,
        doctor_id: user?.id || '',
        attachments: []
      };
      
      if (isEditing && consultationId) {
        await updateConsultation.mutateAsync({ 
          id: consultationId, 
          data: recordData 
        });
        toast.success('Consultation mise à jour avec succès');
      } else if (isControl && parentConsultationId) {
        // Créer un contrôle
        await createControl.mutateAsync({
          parentConsultationId,
          record: recordData as any,
          prescriptions: prescriptions
        });
        toast.success('Contrôle créé avec succès');
      } else {
        await createConsultation.mutateAsync({ 
          record: recordData as any, 
          prescriptions: prescriptions 
        });
        toast.success('Consultation créée avec succès');
      }
      
      navigate('consultations');
    } catch (error) {
      console.error('Error saving consultation:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addPrescription = () => {
    if (newPrescription.medication && newPrescription.dosage) {
      setPrescriptions([...prescriptions, newPrescription]);
      setNewPrescription({
        medication: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      });
    }
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const selectedPatient = patients.find(p => p.id === formData.patient_id);

  if (loading) {
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
            onClick={() => navigate('consultations')}
            className="p-2 hover:bg-muted rounded-xl transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEditing ? 'Modifier la Consultation' : isControl ? 'Nouveau Contrôle' : 'Nouvelle Consultation'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing 
                ? 'Mettre à jour le dossier médical' 
                : isControl 
                  ? 'Créer un contrôle gratuit lié à une consultation' 
                  : 'Créer un nouveau dossier de consultation'}
            </p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors flex items-center space-x-2 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Enregistrer'}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Alerte contrôle gratuit */}
        {isControl && parentConsultation && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <span className="font-medium text-emerald-800">Contrôle gratuit</span>
            </div>
            <p className="text-sm text-emerald-700 mt-1">
              Ce contrôle est lié à la consultation du{' '}
              <span className="font-medium">
                {new Date(parentConsultation.date).toLocaleDateString('fr-FR')}
              </span>
              {' '}({parentConsultation.diagnosis}).
              Il ne sera pas facturé.
            </p>
          </div>
        )}

        {/* Alerte consultation auto-créée */}
        {isAutoCreated && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">Consultation créée automatiquement</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Cette consultation a été créée automatiquement depuis le workflow de prise en charge. 
              Les constantes vitales ont été intégrées dans les symptômes.
            </p>
          </div>
        )}

        {/* Informations Patient */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center space-x-2 mb-4">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Informations Patient</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Patient *
              </label>
              <select
                name="patient_id"
                value={formData.patient_id}
                onChange={handleChange}
                required
                disabled={isControl} // Le patient est fixé pour un contrôle
                className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:cursor-not-allowed"
              >
                <option value="">Sélectionner un patient</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Date de consultation *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Type de consultation *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                disabled={isControl} // Le type est fixé à "suivi" pour un contrôle
                className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:cursor-not-allowed"
              >
                <option value="general">Consultation générale</option>
                <option value="specialist">Consultation spécialisée</option>
                <option value="emergency">Consultation d'urgence</option>
                <option value="followup">Consultation de suivi</option>
                <option value="preventive">Consultation préventive</option>
                <option value="other">Autre</option>
              </select>
            </div>
          </div>

          {selectedPatient && (
            <div className="mt-4 p-4 bg-muted/50 rounded-xl border border-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Âge: </span>
                  <span className="text-foreground">
                    {new Date().getFullYear() - new Date(selectedPatient.date_of_birth).getFullYear()} ans
                  </span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Groupe sanguin: </span>
                  <span className="text-foreground">{selectedPatient.blood_type || 'Non défini'}</span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Téléphone: </span>
                  <span className="text-foreground">{selectedPatient.phone}</span>
                </div>
              </div>
              {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                <div className="mt-2">
                  <span className="font-medium text-destructive">Allergies: </span>
                  <span className="text-destructive">{selectedPatient.allergies.join(', ')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Détails de la Consultation */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Détails de la Consultation</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Motif de consultation *
              </label>
              <input
                type="text"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                required
                placeholder="Ex: Douleurs abdominales, Contrôle de routine..."
                className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Symptômes observés
              </label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleChange}
                rows={3}
                placeholder="Décrire les symptômes du patient..."
                className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Traitement antérieur
              </label>
              <textarea
                name="previous_treatment"
                value={formData.previous_treatment}
                onChange={handleChange}
                rows={3}
                placeholder="Traitements antérieurs du patient..."
                className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Examen physique
              </label>
              <textarea
                name="physical_examination"
                value={formData.physical_examination}
                onChange={handleChange}
                rows={4}
                placeholder="Résultats de l'examen physique..."
                className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Diagnostic *
              </label>
              <textarea
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleChange}
                required
                rows={5}
                placeholder="Diagnostic médical..."
                className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Traitement recommandé
              </label>
              <textarea
                name="treatment"
                value={formData.treatment}
                onChange={handleChange}
                rows={5}
                placeholder="Plan de traitement, recommandations..."
                className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Bilan (Bon d'examen)
              </label>
              <textarea
                name="lab_orders"
                value={formData.lab_orders}
                onChange={handleChange}
                rows={4}
                placeholder="Liste des examens à effectuer (biologie, imagerie, etc.)..."
                className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Ordonnance (uniquement pour nouvelle consultation ou contrôle) */}
        {!isEditing && (
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Pill className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-foreground">Ordonnance</h3>
            </div>

            {prescriptions.length > 0 && (
              <div className="space-y-3 mb-4">
                {prescriptions.map((prescription, index) => (
                  <div key={index} className="bg-muted/50 rounded-xl p-3 border border-border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{prescription.medication}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          <span className="font-medium">Dosage:</span> {prescription.dosage} - 
                          <span className="font-medium"> Fréquence:</span> {prescription.frequency} - 
                          <span className="font-medium"> Durée:</span> {prescription.duration}
                        </div>
                        {prescription.instructions && (
                          <div className="text-sm text-muted-foreground mt-1">
                            <span className="font-medium">Instructions:</span> {prescription.instructions}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removePrescription(index)}
                        className="text-destructive hover:text-destructive/80 p-1 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-muted/30 rounded-xl p-4 border border-border">
              <h4 className="font-medium text-foreground mb-3">Ajouter un médicament</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nom du médicament"
                  value={newPrescription.medication}
                  onChange={(e) => setNewPrescription({...newPrescription, medication: e.target.value})}
                  className="px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Dosage (ex: 500mg)"
                  value={newPrescription.dosage}
                  onChange={(e) => setNewPrescription({...newPrescription, dosage: e.target.value})}
                  className="px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Fréquence (ex: 3 fois/jour)"
                  value={newPrescription.frequency}
                  onChange={(e) => setNewPrescription({...newPrescription, frequency: e.target.value})}
                  className="px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Durée (ex: 7 jours)"
                  value={newPrescription.duration}
                  onChange={(e) => setNewPrescription({...newPrescription, duration: e.target.value})}
                  className="px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Instructions particulières"
                  value={newPrescription.instructions}
                  onChange={(e) => setNewPrescription({...newPrescription, instructions: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <button
                type="button"
                onClick={addPrescription}
                className="mt-3 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Ajouter</span>
              </button>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="bg-card rounded-xl border border-border p-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            Notes du médecin
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Notes complémentaires, observations particulières..."
            className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('consultations')}
            className="px-6 py-2 border border-border rounded-xl text-foreground hover:bg-muted transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : isControl ? 'Enregistrer le contrôle' : 'Enregistrer la consultation'}
          </button>
        </div>
      </form>
    </div>
  );
}
