import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, User, Calendar, Syringe, Hash, FileText, Check, Clock } from 'lucide-react';
import { TreatmentSessionsService, TreatmentSessionInsert } from '../../services/treatment-sessions';
import { MedicalRecordService } from '../../services/medical-records';
import { PatientService } from '../../services/patients';
import { Tables } from '../../integrations/supabase/types';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../hooks/useRouter';
import { toast } from 'sonner';

type Patient = Tables<'patients'>;

const TREATMENT_TYPES = [
  'Injection intramusculaire',
  'Injection intraveineuse',
  'Perfusion',
  'Pansement',
  'Vaccination',
  'Soins de plaie',
  'Kinésithérapie',
  'Aérosol',
  'Prise de sang',
  'Autre'
];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Tous les jours' },
  { value: 'every-other-day', label: 'Un jour sur deux' },
  { value: 'weekly', label: 'Chaque semaine' }
];

const SESSION_PRESETS = [1, 3, 5, 7, 10, 14];

export function TreatmentFormPage() {
  const { user } = useAuth();
  const { navigate, queryParams } = useRouter();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const [formData, setFormData] = useState({
    patientId: queryParams.patientId || '',
    medicalRecordId: '',
    treatmentType: TREATMENT_TYPES[0],
    customTreatmentType: '',
    numberOfSessions: 1,
    startDate: new Date().toISOString().split('T')[0],
    frequency: 'daily',
    notes: ''
  });

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (formData.patientId) {
      loadMedicalRecords(formData.patientId);
    } else {
      setMedicalRecords([]);
      setFormData(prev => ({ ...prev, medicalRecordId: '' }));
    }
  }, [formData.patientId]);

  const loadPatients = async () => {
    try {
      setLoadingPatients(true);
      const data = await PatientService.getAll();
      setPatients(data);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Erreur lors du chargement des patients');
    } finally {
      setLoadingPatients(false);
    }
  };

  const loadMedicalRecords = async (patientId: string) => {
    try {
      setLoadingRecords(true);
      const records = await MedicalRecordService.getByPatient(patientId);
      setMedicalRecords(records);
      if (records.length > 0) {
        setFormData(prev => ({ ...prev, medicalRecordId: records[0].id }));
      }
    } catch (error) {
      console.error('Error loading medical records:', error);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'numberOfSessions' ? parseInt(value) || 1 : value }));
  };

  const calculateScheduledDates = (): string[] => {
    const dates: string[] = [];
    const startDate = new Date(formData.startDate);
    
    for (let i = 0; i < formData.numberOfSessions; i++) {
      const date = new Date(startDate);
      
      switch (formData.frequency) {
        case 'daily':
          date.setDate(startDate.getDate() + i);
          break;
        case 'every-other-day':
          date.setDate(startDate.getDate() + (i * 2));
          break;
        case 'weekly':
          date.setDate(startDate.getDate() + (i * 7));
          break;
      }
      
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error('Vous devez être connecté');
      return;
    }

    if (!formData.patientId) {
      toast.error('Veuillez sélectionner un patient');
      return;
    }

    if (!formData.medicalRecordId) {
      toast.error('Veuillez sélectionner une consultation');
      return;
    }

    try {
      setLoading(true);
      
      const treatmentType = formData.treatmentType === 'Autre' 
        ? formData.customTreatmentType || 'Autre'
        : formData.treatmentType;

      const scheduledDates = calculateScheduledDates();
      
      const sessions: TreatmentSessionInsert[] = scheduledDates.map((date, index) => ({
        patient_id: formData.patientId,
        medical_record_id: formData.medicalRecordId,
        treatment_type: treatmentType,
        scheduled_date: date,
        session_number: index + 1,
        total_sessions: formData.numberOfSessions,
        treatment_notes: formData.notes || null,
        created_by: user.id
      }));

      await TreatmentSessionsService.createMultiple(sessions);
      
      toast.success(`${sessions.length} séance(s) de traitement créée(s)`);
      navigate('treatments');
    } catch (error) {
      console.error('Error creating treatment sessions:', error);
      toast.error('Erreur lors de la création du traitement');
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = patients.find(p => p.id === formData.patientId);
  const selectedRecord = medicalRecords.find(r => r.id === formData.medicalRecordId);

  // Calcul de la progression
  const completedFields = [
    formData.patientId,
    formData.medicalRecordId,
    formData.treatmentType,
    formData.startDate
  ].filter(Boolean).length;
  const totalFields = 4;
  const progressPercent = Math.round((completedFields / totalFields) * 100);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const today = new Date().toISOString().split('T')[0];

  if (loadingPatients) {
    return (
      <div className="card-glass rounded-2xl p-8 animate-fade-in">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/30 border-t-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('treatments')}
          className="p-2 hover:bg-muted rounded-xl transition-colors"
        >
          <ArrowLeft className="h-6 w-6 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gradient-primary">Nouveau Traitement</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Planifier des séances de traitement pour un patient
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Colonne principale - Formulaire */}
          <div className="lg:col-span-3 space-y-6">
            {/* Section Patient */}
            <div className="card-glass rounded-2xl shadow-card border border-border/50 overflow-hidden">
              <div className="p-4 bg-gradient-subtle border-b border-border/50">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Patient & Consultation
                </h3>
              </div>
              <div className="p-6 space-y-6">
                {/* Sélection patient */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Sélectionner un patient *
                  </label>
                  <select
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  >
                    <option value="">Choisir un patient...</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name} - {patient.phone}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Info patient sélectionné */}
                {selectedPatient && (
                  <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {selectedPatient.first_name} {selectedPatient.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedPatient.phone} • {selectedPatient.gender === 'M' ? 'Homme' : 'Femme'}
                      </p>
                    </div>
                    {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                      <div className="px-3 py-1 bg-warning/10 text-warning text-xs font-medium rounded-full">
                        Allergies: {selectedPatient.allergies.join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {/* Sélection consultation */}
                {formData.patientId && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      <FileText className="h-4 w-4 inline mr-2 text-primary" />
                      Consultation liée *
                    </label>
                    {loadingRecords ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary/30 border-t-primary mx-auto"></div>
                      </div>
                    ) : medicalRecords.length > 0 ? (
                      <select
                        name="medicalRecordId"
                        value={formData.medicalRecordId}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      >
                        {medicalRecords.map(record => (
                          <option key={record.id} value={record.id}>
                            {new Date(record.date).toLocaleDateString('fr-FR')} - {record.reason} ({record.diagnosis})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-warning bg-warning/10 px-4 py-3 rounded-xl text-sm border border-warning/20">
                        Ce patient n'a pas encore de consultation. Créez d'abord une consultation.
                      </p>
                    )}
                  </div>
                )}

                {/* Informations de la consultation */}
                {selectedRecord && (
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30 rounded-xl p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/20 p-2 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-4">
                        {/* Traitement recommandé */}
                        <div>
                          <h4 className="font-semibold text-primary text-sm uppercase tracking-wide mb-2">
                            Traitement recommandé par le médecin
                          </h4>
                          <p className={`leading-relaxed whitespace-pre-wrap ${selectedRecord.treatment ? 'text-foreground font-medium' : 'text-muted-foreground italic'}`}>
                            {selectedRecord.treatment || 'Non renseigné'}
                          </p>
                        </div>

                        {/* Notes du médecin */}
                        <div className="pt-3 border-t border-primary/20">
                          <h4 className="font-semibold text-primary text-sm uppercase tracking-wide mb-2">
                            Notes du médecin
                          </h4>
                          <p className={`leading-relaxed whitespace-pre-wrap ${selectedRecord.notes ? 'text-foreground font-medium' : 'text-muted-foreground italic'}`}>
                            {selectedRecord.notes || 'Non renseigné'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section Type de traitement */}
            <div className="card-glass rounded-2xl shadow-card border border-border/50 overflow-hidden">
              <div className="p-4 bg-gradient-subtle border-b border-border/50">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Syringe className="h-5 w-5 text-primary" />
                  Type de Traitement
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {TREATMENT_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, treatmentType: type }))}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border-2 ${
                        formData.treatmentType === type
                          ? 'bg-primary text-primary-foreground border-primary shadow-glow'
                          : 'bg-background text-foreground border-border hover:border-primary/50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                {formData.treatmentType === 'Autre' && (
                  <input
                    type="text"
                    name="customTreatmentType"
                    value={formData.customTreatmentType}
                    onChange={handleChange}
                    placeholder="Précisez le type de traitement"
                    className="w-full mt-4 px-4 py-3 bg-background border-2 border-border rounded-xl focus:border-primary transition-all outline-none"
                  />
                )}
              </div>
            </div>

            {/* Section Planification */}
            <div className="card-glass rounded-2xl shadow-card border border-border/50 overflow-hidden">
              <div className="p-4 bg-gradient-subtle border-b border-border/50">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Planification
                </h3>
              </div>
              <div className="p-6 space-y-6">
                {/* Nombre de séances */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    <Hash className="h-4 w-4 inline mr-2 text-primary" />
                    Nombre de séances
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {SESSION_PRESETS.map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, numberOfSessions: num }))}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          formData.numberOfSessions === num
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    name="numberOfSessions"
                    value={formData.numberOfSessions}
                    onChange={handleChange}
                    className="w-32 px-4 py-2 bg-background border-2 border-border rounded-xl focus:border-primary transition-all outline-none text-center"
                  />
                </div>

                {/* Fréquence */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    <Clock className="h-4 w-4 inline mr-2 text-primary" />
                    Fréquence
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {FREQUENCY_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, frequency: opt.value }))}
                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border-2 ${
                          formData.frequency === opt.value
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-border hover:border-primary/50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date de début */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Date de début *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    min={today}
                    required
                    className="w-full sm:w-auto px-4 py-3 bg-background border-2 border-border rounded-xl focus:border-primary transition-all outline-none"
                  />
                </div>

                {/* Aperçu des dates */}
                {formData.numberOfSessions > 1 && (
                  <div className="bg-secondary/10 rounded-xl p-4 border border-secondary/20">
                    <p className="text-sm font-medium text-secondary mb-3">Aperçu des séances planifiées:</p>
                    <div className="flex flex-wrap gap-2">
                      {calculateScheduledDates().slice(0, 10).map((date, index) => (
                        <span key={index} className="px-3 py-1.5 bg-secondary/20 text-secondary rounded-lg text-xs font-medium">
                          #{index + 1}: {new Date(date).toLocaleDateString('fr-FR')}
                        </span>
                      ))}
                      {formData.numberOfSessions > 10 && (
                        <span className="px-3 py-1.5 bg-secondary/20 text-secondary rounded-lg text-xs font-medium">
                          +{formData.numberOfSessions - 10} autres
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="card-glass rounded-2xl shadow-card border border-border/50 overflow-hidden">
              <div className="p-4 bg-gradient-subtle border-b border-border/50">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Notes (optionnel)
                </h3>
              </div>
              <div className="p-6">
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Instructions particulières pour le traitement..."
                  className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl focus:border-primary transition-all outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Colonne droite - Résumé */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-6 space-y-6">
              <div className="card-glass rounded-2xl shadow-card border border-border/50 overflow-hidden">
                <div className="p-4 bg-gradient-subtle border-b border-border/50">
                  <h3 className="font-semibold text-foreground">Résumé du traitement</h3>
                </div>
                <div className="p-6 space-y-6">
                  {/* Barre de progression */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progression</span>
                      <span className="font-medium text-foreground">{progressPercent}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-primary transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Détails */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${selectedPatient ? 'bg-success/10' : 'bg-muted'}`}>
                        {selectedPatient ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <User className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Patient</p>
                        <p className="font-medium text-foreground">
                          {selectedPatient 
                            ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
                            : 'Non sélectionné'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${selectedRecord ? 'bg-success/10' : 'bg-muted'}`}>
                        {selectedRecord ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Consultation</p>
                        <p className="font-medium text-foreground">
                          {selectedRecord 
                            ? `${new Date(selectedRecord.date).toLocaleDateString('fr-FR')} - ${selectedRecord.reason}`
                            : 'Non sélectionnée'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${formData.treatmentType ? 'bg-success/10' : 'bg-muted'}`}>
                        {formData.treatmentType ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Syringe className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Type de traitement</p>
                        <p className="font-medium text-foreground">
                          {formData.treatmentType === 'Autre' && formData.customTreatmentType 
                            ? formData.customTreatmentType 
                            : formData.treatmentType}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${formData.startDate ? 'bg-success/10' : 'bg-muted'}`}>
                        {formData.startDate ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Planification</p>
                        <p className="font-medium text-foreground">
                          {formData.numberOfSessions} séance{formData.numberOfSessions > 1 ? 's' : ''}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          À partir du {formatDate(formData.startDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bouton de soumission */}
                  <button
                    type="submit"
                    disabled={loading || !formData.medicalRecordId}
                    className="w-full btn-gradient px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-glow"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                    ) : (
                      <>
                        <Plus className="h-5 w-5" />
                        Créer {formData.numberOfSessions} séance{formData.numberOfSessions > 1 ? 's' : ''}
                      </>
                    )}
                  </button>

                  {!formData.medicalRecordId && formData.patientId && medicalRecords.length === 0 && (
                    <p className="text-xs text-warning text-center">
                      Une consultation est requise pour créer un traitement
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
