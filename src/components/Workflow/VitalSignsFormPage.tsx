import { useState, useEffect } from 'react';
import { ArrowLeft, Thermometer, Heart, Weight, Ruler, Droplets, Wind, AlertCircle, Save, User, Loader2 } from 'lucide-react';
import { VitalSignsService } from '../../services/vital-signs';
import { ConsultationWorkflowService } from '../../services/consultation-workflow';
import { supabase } from '../../integrations/supabase/client';
import { Tables } from '../../integrations/supabase/types';

type Patient = Tables<'patients'>;

interface ConsultationWorkflow {
  id: string;
  patient_id: string;
  invoice_id: string;
  vital_signs_id: string | null;
  doctor_id: string | null;
  consultation_type: 'general' | 'specialist' | 'emergency' | 'followup' | 'preventive' | 'other';
  status: string;
  created_at: string | null;
  updated_at: string | null;
  created_by: string;
  patient?: Pick<Patient, 'first_name' | 'last_name' | 'phone'> | null;
}

interface VitalSignsFormPageProps {
  workflowId: string;
  onBack: () => void;
  onSave: () => void;
}

export function VitalSignsFormPage({ workflowId, onBack, onSave }: VitalSignsFormPageProps) {
  const [workflow, setWorkflow] = useState<ConsultationWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
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
    loadWorkflow();
  }, [workflowId]);

  const loadWorkflow = async () => {
    try {
      setLoading(true);
      const data = await ConsultationWorkflowService.getById(workflowId);
      setWorkflow(data as ConsultationWorkflow);
    } catch (error) {
      console.error('Erreur lors du chargement du workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || !workflow) return;
    
    setIsSubmitting(true);
    
    // Validation
    const newErrors: Record<string, string> = {};
    
    // Au moins une constante doit être renseignée
    const hasAnyVital = Object.entries(formData).some(([key, value]) => 
      key !== 'notes' && value.trim() !== ''
    );
    
    if (!hasAnyVital) {
      newErrors.general = 'Au moins une constante vitale doit être renseignée';
      setIsSubmitting(false);
    }

    // Validation des valeurs numériques
    if (formData.temperature && (parseFloat(formData.temperature) < 30 || parseFloat(formData.temperature) > 45)) {
      newErrors.temperature = 'Température invalide (30-45°C)';
    }

    if (formData.blood_pressure_systolic && (parseInt(formData.blood_pressure_systolic) < 50 || parseInt(formData.blood_pressure_systolic) > 250)) {
      newErrors.blood_pressure_systolic = 'Tension systolique invalide (50-250 mmHg)';
    }

    if (formData.blood_pressure_diastolic && (parseInt(formData.blood_pressure_diastolic) < 30 || parseInt(formData.blood_pressure_diastolic) > 150)) {
      newErrors.blood_pressure_diastolic = 'Tension diastolique invalide (30-150 mmHg)';
    }

    if (formData.heart_rate && (parseInt(formData.heart_rate) < 30 || parseInt(formData.heart_rate) > 200)) {
      newErrors.heart_rate = 'Fréquence cardiaque invalide (30-200 bpm)';
    }

    if (formData.weight && (parseFloat(formData.weight) < 1 || parseFloat(formData.weight) > 300)) {
      newErrors.weight = 'Poids invalide (1-300 kg)';
    }

    if (formData.height && (parseFloat(formData.height) < 50 || parseFloat(formData.height) > 250)) {
      newErrors.height = 'Taille invalide (50-250 cm)';
    }

    if (formData.oxygen_saturation && (parseInt(formData.oxygen_saturation) < 70 || parseInt(formData.oxygen_saturation) > 100)) {
      newErrors.oxygen_saturation = 'Saturation invalide (70-100%)';
    }

    if (formData.respiratory_rate && (parseInt(formData.respiratory_rate) < 5 || parseInt(formData.respiratory_rate) > 50)) {
      newErrors.respiratory_rate = 'Fréquence respiratoire invalide (5-50/min)';
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      try {
        // Obtenir l'utilisateur courant pour recorded_by
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('Vous devez être connecté pour enregistrer les constantes vitales');
        }

        // Convertir les valeurs en nombres
        const vitalSignsData = {
          patient_id: workflow.patient_id,
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
        
        // Créer les constantes vitales
        const vitalSigns = await VitalSignsService.create(vitalSignsData);

        // Mettre à jour le workflow
        const nextStatus = workflow.doctor_id ? 'consultation-ready' : 'doctor-assignment';
        await ConsultationWorkflowService.update(workflow.id, {
          vital_signs_id: vitalSigns.id,
          status: nextStatus
        });

        onSave();
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des constantes vitales:', error);
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Calculer l'IMC si poids et taille sont renseignés
    if (name === 'weight' || name === 'height') {
      const weight = name === 'weight' ? parseFloat(value) : parseFloat(formData.weight);
      const height = name === 'height' ? parseFloat(value) : parseFloat(formData.height);
      
      if (weight > 0 && height > 0) {
        setBmi(VitalSignsService.calculateBMI(weight, height));
      } else {
        setBmi(null);
      }
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

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

  if (!workflow) {
    return (
      <div className="card-glass rounded-2xl p-8 animate-fade-in">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
          <p className="text-foreground font-medium">Workflow non trouvé</p>
          <button
            onClick={onBack}
            className="mt-4 btn-gradient px-4 py-2 rounded-xl"
          >
            Retour
          </button>
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
              onClick={onBack}
              disabled={isSubmitting}
              className="p-2 rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="h-6 w-6 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gradient-primary">Prise des Constantes Vitales</h1>
              <div className="flex items-center space-x-2 mt-1">
                <User className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-medium">
                  Patient: {workflow.patient?.first_name} {workflow.patient?.last_name}
                </p>
              </div>
            </div>
          </div>
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
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Erreur générale */}
            {errors.general && (
              <div className="bg-error-light border border-error/30 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-error" />
                  <span className="text-sm font-medium text-error">{errors.general}</span>
                </div>
              </div>
            )}

            {/* Indicateur de traitement */}
            {isSubmitting && (
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  <div>
                    <p className="text-sm font-medium text-primary">Enregistrement des constantes vitales en cours...</p>
                    <p className="text-xs text-primary/70">Veuillez patienter, ne quittez pas cette page.</p>
                  </div>
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
                    className={`w-full px-4 py-3 bg-background border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.temperature ? 'border-error' : 'border-border'
                    }`}
                  />
                  {errors.temperature && (
                    <span className="text-sm text-error mt-1">{errors.temperature}</span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Heart className="inline h-4 w-4 mr-1 text-error" />
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
                    className={`w-full px-4 py-3 bg-background border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.heart_rate ? 'border-error' : 'border-border'
                    }`}
                  />
                  {errors.heart_rate && (
                    <span className="text-sm text-error mt-1">{errors.heart_rate}</span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tension systolique (mmHg)
                  </label>
                  <input
                    type="number"
                    name="blood_pressure_systolic"
                    value={formData.blood_pressure_systolic}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    min="50"
                    max="250"
                    placeholder="120"
                    className={`w-full px-4 py-3 bg-background border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.blood_pressure_systolic ? 'border-error' : 'border-border'
                    }`}
                  />
                  {errors.blood_pressure_systolic && (
                    <span className="text-sm text-error mt-1">{errors.blood_pressure_systolic}</span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tension diastolique (mmHg)
                  </label>
                  <input
                    type="number"
                    name="blood_pressure_diastolic"
                    value={formData.blood_pressure_diastolic}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    min="30"
                    max="150"
                    placeholder="80"
                    className={`w-full px-4 py-3 bg-background border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.blood_pressure_diastolic ? 'border-error' : 'border-border'
                    }`}
                  />
                  {errors.blood_pressure_diastolic && (
                    <span className="text-sm text-error mt-1">{errors.blood_pressure_diastolic}</span>
                  )}
                </div>
              </div>

              {/* Interprétation tension artérielle */}
              {formData.blood_pressure_systolic && formData.blood_pressure_diastolic && (
                <div className="mt-4 p-3 bg-primary/10 rounded-xl border border-primary/20">
                  <div className="text-sm">
                    <span className="font-medium text-foreground">Interprétation: </span>
                    <span className="text-primary font-semibold">
                      {getBloodPressureInterpretation()}
                    </span>
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
                    className={`w-full px-4 py-3 bg-background border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.weight ? 'border-error' : 'border-border'
                    }`}
                  />
                  {errors.weight && (
                    <span className="text-sm text-error mt-1">{errors.weight}</span>
                  )}
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
                    step="0.1"
                    min="50"
                    max="250"
                    placeholder="175"
                    className={`w-full px-4 py-3 bg-background border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.height ? 'border-error' : 'border-border'
                    }`}
                  />
                  {errors.height && (
                    <span className="text-sm text-error mt-1">{errors.height}</span>
                  )}
                </div>
              </div>

              {/* Calcul IMC */}
              {bmi && (
                <div className="mt-4 p-3 bg-success/10 rounded-xl border border-success/20">
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-medium text-foreground">IMC: </span>
                      <span className="text-success font-bold">{bmi}</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Interprétation: </span>
                      <span className="text-success font-semibold">{getBMIInterpretation()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Section: Constantes Respiratoires */}
            <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6">
              <div className="flex items-center space-x-2 pb-4 border-b border-border/30 mb-6">
                <Wind className="h-5 w-5 text-secondary" />
                <h3 className="text-lg font-bold text-foreground">Constantes Respiratoires</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Droplets className="inline h-4 w-4 mr-1 text-secondary" />
                    Saturation en oxygène (%)
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
                    className={`w-full px-4 py-3 bg-background border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.oxygen_saturation ? 'border-error' : 'border-border'
                    }`}
                  />
                  {errors.oxygen_saturation && (
                    <span className="text-sm text-error mt-1">{errors.oxygen_saturation}</span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Wind className="inline h-4 w-4 mr-1 text-secondary" />
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
                    className={`w-full px-4 py-3 bg-background border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.respiratory_rate ? 'border-error' : 'border-border'
                    }`}
                  />
                  {errors.respiratory_rate && (
                    <span className="text-sm text-error mt-1">{errors.respiratory_rate}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Section: Notes */}
            <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6">
              <div className="flex items-center space-x-2 pb-4 border-b border-border/30 mb-6">
                <AlertCircle className="h-5 w-5 text-warning" />
                <h3 className="text-lg font-bold text-foreground">Notes Complémentaires</h3>
              </div>
              
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                disabled={isSubmitting}
                rows={4}
                placeholder="Observations particulières, comportement du patient, etc."
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
            </div>

            {/* Résumé des constantes */}
            <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6">
              <h3 className="font-bold text-foreground mb-4">Résumé des Constantes</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {formData.temperature && (
                  <div className="text-center p-3 bg-primary/10 rounded-xl">
                    <div className="font-bold text-primary text-lg">{formData.temperature}°C</div>
                    <div className="text-muted-foreground text-xs">Température</div>
                  </div>
                )}
                {formData.heart_rate && (
                  <div className="text-center p-3 bg-error/10 rounded-xl">
                    <div className="font-bold text-error text-lg">{formData.heart_rate} bpm</div>
                    <div className="text-muted-foreground text-xs">Pouls</div>
                  </div>
                )}
                {formData.blood_pressure_systolic && formData.blood_pressure_diastolic && (
                  <div className="text-center p-3 bg-secondary/10 rounded-xl">
                    <div className="font-bold text-secondary text-lg">
                      {formData.blood_pressure_systolic}/{formData.blood_pressure_diastolic}
                    </div>
                    <div className="text-muted-foreground text-xs">Tension</div>
                  </div>
                )}
                {bmi && (
                  <div className="text-center p-3 bg-success/10 rounded-xl">
                    <div className="font-bold text-success text-lg">{bmi}</div>
                    <div className="text-muted-foreground text-xs">IMC</div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions rapides */}
            <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6">
              <h3 className="text-lg font-bold text-foreground pb-4 border-b border-border/30 mb-6">Actions Rapides</h3>
              
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={onBack}
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl border-2 border-border text-foreground font-medium
                           hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Annuler et retourner au workflow
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-gradient py-3 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2 hover-lift shadow-glow disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                  <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer les constantes'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
