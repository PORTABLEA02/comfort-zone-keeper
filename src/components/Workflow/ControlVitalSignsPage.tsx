import { useState, useEffect } from 'react';
import { ArrowLeft, Thermometer, Heart, Weight, Ruler, Droplets, Wind, AlertCircle, Save, User, Loader2, Search, Calendar, FileText } from 'lucide-react';
import { VitalSignsService } from '../../services/vital-signs';
import { MedicalRecordService } from '../../services/medical-records';
import { PatientService } from '../../services/patients';
import { Tables } from '../../integrations/supabase/types';
import { useAuth } from '../../context/AuthContext';

type Patient = Tables<'patients'>;
type MedicalRecord = Tables<'medical_records'>;

interface ControlVitalSignsPageProps {
  onBack: () => void;
  onComplete: () => void;
}

export function ControlVitalSignsPage({ onBack, onComplete }: ControlVitalSignsPageProps) {
  const { user } = useAuth();
  
  // Step management
  const [step, setStep] = useState<'select-patient' | 'select-consultation' | 'vital-signs'>('select-patient');
  
  // Data
  const [patients, setPatients] = useState<Patient[]>([]);
  const [consultations, setConsultations] = useState<MedicalRecord[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedConsultation, setSelectedConsultation] = useState<MedicalRecord | null>(null);
  
  // Search & loading
  const [searchPatient, setSearchPatient] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingConsultations, setLoadingConsultations] = useState(false);
  
  // Vital signs form
  const [formData, setFormData] = useState({
    temperature: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    heart_rate: '',
    weight: '',
    height: '',
    oxygen_saturation: '',
    respiratory_rate: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bmi, setBmi] = useState<number | null>(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await PatientService.getAll();
      setPatients(data);
    } catch (error) {
      console.error('Erreur lors du chargement des patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConsultationsForPatient = async (patientId: string) => {
    try {
      setLoadingConsultations(true);
      const data = await MedicalRecordService.getByPatient(patientId);
      // Filtrer pour n'afficher que les consultations parentes (pas les contrôles)
      const parentConsultations = data.filter(record => !record.is_control);
      setConsultations(parentConsultations);
    } catch (error) {
      console.error('Erreur lors du chargement des consultations:', error);
    } finally {
      setLoadingConsultations(false);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    loadConsultationsForPatient(patient.id);
    setStep('select-consultation');
  };

  const handleSelectConsultation = (consultation: MedicalRecord) => {
    setSelectedConsultation(consultation);
    setStep('vital-signs');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (name === 'weight' || name === 'height') {
      const weight = name === 'weight' ? parseFloat(value) : parseFloat(formData.weight);
      const height = name === 'height' ? parseFloat(value) : parseFloat(formData.height);
      
      if (weight > 0 && height > 0) {
        setBmi(VitalSignsService.calculateBMI(weight, height));
      } else {
        setBmi(null);
      }
    }
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const buildVitalSignsSummary = (): string => {
    const parts: string[] = [];
    
    if (formData.temperature) {
      parts.push(`Température: ${formData.temperature}°C`);
    }
    if (formData.blood_pressure_systolic && formData.blood_pressure_diastolic) {
      const interpretation = VitalSignsService.interpretBloodPressure(
        parseInt(formData.blood_pressure_systolic),
        parseInt(formData.blood_pressure_diastolic)
      );
      parts.push(`Tension artérielle: ${formData.blood_pressure_systolic}/${formData.blood_pressure_diastolic} mmHg (${interpretation})`);
    }
    if (formData.heart_rate) {
      parts.push(`Fréquence cardiaque: ${formData.heart_rate} bpm`);
    }
    if (formData.weight) {
      parts.push(`Poids: ${formData.weight} kg`);
    }
    if (formData.height) {
      parts.push(`Taille: ${formData.height} cm`);
    }
    if (bmi) {
      const interpretation = VitalSignsService.interpretBMI(bmi);
      parts.push(`IMC: ${bmi} (${interpretation})`);
    }
    if (formData.oxygen_saturation) {
      parts.push(`SpO2: ${formData.oxygen_saturation}%`);
    }
    if (formData.respiratory_rate) {
      parts.push(`Fréquence respiratoire: ${formData.respiratory_rate}/min`);
    }
    if (formData.notes) {
      parts.push(`Notes: ${formData.notes}`);
    }
    
    return parts.length > 0 
      ? `CONSTANTES VITALES (Contrôle du ${new Date().toLocaleDateString('fr-FR')}):\n${parts.join('\n')}`
      : '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || !selectedPatient || !selectedConsultation || !user) return;
    
    setIsSubmitting(true);
    
    // Validation
    const newErrors: Record<string, string> = {};
    
    const hasAnyVital = Object.entries(formData).some(([key, value]) => 
      key !== 'notes' && value.trim() !== ''
    );
    
    if (!hasAnyVital) {
      newErrors.general = 'Au moins une constante vitale doit être renseignée';
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    // Validation des valeurs numériques
    if (formData.temperature && (parseFloat(formData.temperature) < 30 || parseFloat(formData.temperature) > 45)) {
      newErrors.temperature = 'Température invalide (30-45°C)';
    }
    if (formData.blood_pressure_systolic && (parseInt(formData.blood_pressure_systolic) < 50 || parseInt(formData.blood_pressure_systolic) > 250)) {
      newErrors.blood_pressure_systolic = 'Tension systolique invalide';
    }
    if (formData.blood_pressure_diastolic && (parseInt(formData.blood_pressure_diastolic) < 30 || parseInt(formData.blood_pressure_diastolic) > 150)) {
      newErrors.blood_pressure_diastolic = 'Tension diastolique invalide';
    }
    if (formData.heart_rate && (parseInt(formData.heart_rate) < 30 || parseInt(formData.heart_rate) > 200)) {
      newErrors.heart_rate = 'Fréquence cardiaque invalide';
    }
    if (formData.weight && (parseFloat(formData.weight) < 1 || parseFloat(formData.weight) > 300)) {
      newErrors.weight = 'Poids invalide';
    }
    if (formData.height && (parseFloat(formData.height) < 50 || parseFloat(formData.height) > 250)) {
      newErrors.height = 'Taille invalide';
    }
    if (formData.oxygen_saturation && (parseInt(formData.oxygen_saturation) < 70 || parseInt(formData.oxygen_saturation) > 100)) {
      newErrors.oxygen_saturation = 'Saturation invalide';
    }
    if (formData.respiratory_rate && (parseInt(formData.respiratory_rate) < 5 || parseInt(formData.respiratory_rate) > 50)) {
      newErrors.respiratory_rate = 'Fréquence respiratoire invalide';
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Créer les constantes vitales
      const vitalSignsData = {
        patient_id: selectedPatient.id,
        recorded_by: user.id,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        blood_pressure_systolic: formData.blood_pressure_systolic ? parseInt(formData.blood_pressure_systolic) : null,
        blood_pressure_diastolic: formData.blood_pressure_diastolic ? parseInt(formData.blood_pressure_diastolic) : null,
        heart_rate: formData.heart_rate ? parseInt(formData.heart_rate) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        oxygen_saturation: formData.oxygen_saturation ? parseInt(formData.oxygen_saturation) : null,
        respiratory_rate: formData.respiratory_rate ? parseInt(formData.respiratory_rate) : null,
        notes: formData.notes || null
      };
      
      await VitalSignsService.create(vitalSignsData);

      // 2. Construire le résumé des constantes vitales pour pré-remplir l'examen physique
      const vitalSignsSummary = buildVitalSignsSummary();

      // 3. Créer automatiquement le contrôle (consultation de contrôle) avec constantes pré-remplies
      const controlData = {
        patient_id: selectedPatient.id,
        doctor_id: selectedConsultation.doctor_id,
        date: new Date().toISOString().split('T')[0],
        type: selectedConsultation.type,
        reason: `Contrôle: ${selectedConsultation.reason}`,
        diagnosis: 'En attente de la consultation de contrôle',
        symptoms: vitalSignsSummary,
        treatment: null,
        notes: `Constantes vitales enregistrées le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}. En attente du médecin.`,
        previous_treatment: selectedConsultation.treatment,
        physical_examination: vitalSignsSummary,
        lab_orders: null,
        attachments: []
      };

      await MedicalRecordService.createControl(selectedConsultation.id, controlData);

      onComplete();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setIsSubmitting(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const search = searchPatient.toLowerCase();
    return (
      patient.first_name.toLowerCase().includes(search) ||
      patient.last_name.toLowerCase().includes(search) ||
      patient.phone.includes(search)
    );
  });

  const getBloodPressureInterpretation = () => {
    const systolic = parseInt(formData.blood_pressure_systolic);
    const diastolic = parseInt(formData.blood_pressure_diastolic);
    if (systolic > 0 && diastolic > 0) {
      return VitalSignsService.interpretBloodPressure(systolic, diastolic);
    }
    return null;
  };

  const getBMIInterpretation = () => {
    return bmi ? VitalSignsService.interpretBMI(bmi) : null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="card-glass rounded-2xl p-8 animate-fade-in">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-primary mx-auto shadow-glow"></div>
          <p className="text-muted-foreground mt-4 font-medium">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card-glass rounded-2xl shadow-card border border-border/50">
        <div className="p-6 bg-gradient-subtle flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={step === 'select-patient' ? onBack : () => {
                if (step === 'vital-signs') setStep('select-consultation');
                else if (step === 'select-consultation') setStep('select-patient');
              }}
              disabled={isSubmitting}
              className="p-2 rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="h-6 w-6 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gradient-primary">Prise de Constantes - Contrôle</h1>
              <p className="text-sm text-muted-foreground font-medium">
                {step === 'select-patient' && 'Étape 1/3 : Sélectionner le patient'}
                {step === 'select-consultation' && 'Étape 2/3 : Sélectionner la consultation à contrôler'}
                {step === 'vital-signs' && 'Étape 3/3 : Saisir les constantes vitales'}
              </p>
            </div>
          </div>

          {step === 'vital-signs' && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-gradient px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 hover-lift shadow-glow disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center space-x-4">
        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step === 'select-patient' ? 'bg-primary text-primary-foreground' : 'bg-success text-success-foreground'}`}>
          1
        </div>
        <div className={`h-1 w-16 rounded ${step !== 'select-patient' ? 'bg-success' : 'bg-muted'}`} />
        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step === 'select-consultation' ? 'bg-primary text-primary-foreground' : step === 'vital-signs' ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}`}>
          2
        </div>
        <div className={`h-1 w-16 rounded ${step === 'vital-signs' ? 'bg-success' : 'bg-muted'}`} />
        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step === 'vital-signs' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          3
        </div>
      </div>

      {/* Step 1: Select Patient */}
      {step === 'select-patient' && (
        <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-border/30 mb-6">
            <User className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Sélectionner le patient</h3>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par nom ou téléphone..."
              value={searchPatient}
              onChange={(e) => setSearchPatient(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          {/* Patient list */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredPatients.map((patient) => (
              <button
                key={patient.id}
                onClick={() => handleSelectPatient(patient)}
                className="w-full p-4 card-elevated rounded-xl border-2 border-transparent hover:border-primary/50 transition-all text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{patient.first_name} {patient.last_name}</p>
                    <p className="text-sm text-muted-foreground">{patient.phone}</p>
                  </div>
                </div>
              </button>
            ))}
            {filteredPatients.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Aucun patient trouvé</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Select Consultation */}
      {step === 'select-consultation' && selectedPatient && (
        <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-border/30 mb-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Consultations de {selectedPatient.first_name} {selectedPatient.last_name}</h3>
            </div>
          </div>

          {loadingConsultations ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Chargement des consultations...</p>
            </div>
          ) : consultations.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {consultations.map((consultation) => (
                <button
                  key={consultation.id}
                  onClick={() => handleSelectConsultation(consultation)}
                  className="w-full p-4 card-elevated rounded-xl border-2 border-transparent hover:border-primary/50 transition-all text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{formatDate(consultation.date)}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {consultation.type}
                        </span>
                      </div>
                      <p className="font-semibold text-foreground">{consultation.reason}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{consultation.diagnosis}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
              <p className="text-foreground font-medium">Aucune consultation trouvée</p>
              <p className="text-sm text-muted-foreground mt-1">Ce patient n'a pas de consultation pour laquelle effectuer un contrôle.</p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Vital Signs Form */}
      {step === 'vital-signs' && selectedPatient && selectedConsultation && (
        <form onSubmit={handleSubmit}>
          {/* Selected info */}
          <div className="card-glass rounded-2xl shadow-card border border-border/50 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Patient</p>
                  <p className="font-semibold text-foreground">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Consultation du {formatDate(selectedConsultation.date)}</p>
                  <p className="font-semibold text-foreground">{selectedConsultation.reason}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Erreur générale */}
            {errors.general && (
              <div className="lg:col-span-2 bg-destructive/10 border border-destructive/30 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <span className="text-sm font-medium text-destructive">{errors.general}</span>
                </div>
              </div>
            )}

            {/* Section: Constantes Principales */}
            <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6">
              <div className="flex items-center space-x-2 pb-4 border-b border-border/30 mb-6">
                <Heart className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Constantes Principales</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Thermometer className="inline h-4 w-4 mr-1 text-primary" />
                    Température (°C)
                  </label>
                  <input
                    type="number"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    step="0.1"
                    min="30"
                    max="45"
                    placeholder="36.5"
                    className={`w-full px-4 py-3 bg-background border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 ${
                      errors.temperature ? 'border-destructive' : 'border-border'
                    }`}
                  />
                  {errors.temperature && <span className="text-sm text-destructive mt-1">{errors.temperature}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Heart className="inline h-4 w-4 mr-1 text-destructive" />
                    Fréquence cardiaque (bpm)
                  </label>
                  <input
                    type="number"
                    name="heart_rate"
                    value={formData.heart_rate}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    min="30"
                    max="200"
                    placeholder="72"
                    className={`w-full px-4 py-3 bg-background border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 ${
                      errors.heart_rate ? 'border-destructive' : 'border-border'
                    }`}
                  />
                  {errors.heart_rate && <span className="text-sm text-destructive mt-1">{errors.heart_rate}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Tension systolique (mmHg)</label>
                  <input
                    type="number"
                    name="blood_pressure_systolic"
                    value={formData.blood_pressure_systolic}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    min="50"
                    max="250"
                    placeholder="120"
                    className={`w-full px-4 py-3 bg-background border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 ${
                      errors.blood_pressure_systolic ? 'border-destructive' : 'border-border'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Tension diastolique (mmHg)</label>
                  <input
                    type="number"
                    name="blood_pressure_diastolic"
                    value={formData.blood_pressure_diastolic}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    min="30"
                    max="150"
                    placeholder="80"
                    className={`w-full px-4 py-3 bg-background border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 ${
                      errors.blood_pressure_diastolic ? 'border-destructive' : 'border-border'
                    }`}
                  />
                </div>
              </div>

              {formData.blood_pressure_systolic && formData.blood_pressure_diastolic && (
                <div className="mt-4 p-3 bg-primary/10 rounded-xl border border-primary/20">
                  <div className="text-sm">
                    <span className="font-medium text-foreground">Interprétation: </span>
                    <span className="text-primary font-semibold">{getBloodPressureInterpretation()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Section: Mesures Physiques */}
            <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6">
              <div className="flex items-center space-x-2 pb-4 border-b border-border/30 mb-6">
                <Weight className="h-5 w-5 text-success" />
                <h3 className="text-lg font-bold text-foreground">Mesures Physiques</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Weight className="inline h-4 w-4 mr-1 text-success" />
                    Poids (kg)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    step="0.1"
                    min="1"
                    max="300"
                    placeholder="70.5"
                    className={`w-full px-4 py-3 bg-background border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 ${
                      errors.weight ? 'border-destructive' : 'border-border'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Ruler className="inline h-4 w-4 mr-1 text-success" />
                    Taille (cm)
                  </label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    min="50"
                    max="250"
                    placeholder="175"
                    className={`w-full px-4 py-3 bg-background border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 ${
                      errors.height ? 'border-destructive' : 'border-border'
                    }`}
                  />
                </div>
              </div>

              {bmi && (
                <div className="mt-4 p-3 bg-success/10 rounded-xl border border-success/20">
                  <div className="text-sm">
                    <span className="font-medium text-foreground">IMC: </span>
                    <span className="text-success font-bold">{bmi}</span>
                    <span className="text-muted-foreground ml-2">({getBMIInterpretation()})</span>
                  </div>
                </div>
              )}
            </div>

            {/* Section: Respiration */}
            <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6">
              <div className="flex items-center space-x-2 pb-4 border-b border-border/30 mb-6">
                <Wind className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Respiration</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Droplets className="inline h-4 w-4 mr-1 text-primary" />
                    Saturation O2 (%)
                  </label>
                  <input
                    type="number"
                    name="oxygen_saturation"
                    value={formData.oxygen_saturation}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    min="70"
                    max="100"
                    placeholder="98"
                    className={`w-full px-4 py-3 bg-background border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 ${
                      errors.oxygen_saturation ? 'border-destructive' : 'border-border'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Wind className="inline h-4 w-4 mr-1 text-primary" />
                    Fréquence respiratoire (/min)
                  </label>
                  <input
                    type="number"
                    name="respiratory_rate"
                    value={formData.respiratory_rate}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    min="5"
                    max="50"
                    placeholder="16"
                    className={`w-full px-4 py-3 bg-background border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 ${
                      errors.respiratory_rate ? 'border-destructive' : 'border-border'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Section: Notes */}
            <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6">
              <div className="flex items-center space-x-2 pb-4 border-b border-border/30 mb-6">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-bold text-foreground">Notes</h3>
              </div>
              
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                disabled={isSubmitting}
                rows={4}
                placeholder="Notes additionnelles..."
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 resize-none"
              />
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
