import { useState } from 'react';
import { X, User, Activity, Heart, Thermometer, Scale, Ruler, Droplets, Wind, FileText, CheckCircle } from 'lucide-react';
import { TreatmentSession, TreatmentSessionsService } from '../../services/treatment-sessions';
import { VitalSignsService } from '../../services/vital-signs';
import { Tables } from '../../integrations/supabase/types';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

type Patient = Tables<'patients'>;

interface TreatmentSessionFormProps {
  session: TreatmentSession;
  patient: Patient | null;
  onClose: () => void;
  onComplete: () => void;
}

export function TreatmentSessionForm({ session, patient, onClose, onComplete }: TreatmentSessionFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [includeVitals, setIncludeVitals] = useState(true);

  const [formData, setFormData] = useState({
    treatmentNotes: '',
    observations: '',
    temperature: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    weight: '',
    height: '',
    oxygenSaturation: '',
    respiratoryRate: '',
    vitalNotes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error('Vous devez être connecté');
      return;
    }

    try {
      setLoading(true);
      let vitalSignsId: string | undefined;

      // Créer les constantes vitales si demandé
      if (includeVitals) {
        const hasVitals = formData.temperature || formData.bloodPressureSystolic || 
                         formData.heartRate || formData.weight || formData.oxygenSaturation;
        
        if (hasVitals) {
          const vitalSigns = await VitalSignsService.create({
            patient_id: session.patient_id,
            temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
            blood_pressure_systolic: formData.bloodPressureSystolic ? parseInt(formData.bloodPressureSystolic) : undefined,
            blood_pressure_diastolic: formData.bloodPressureDiastolic ? parseInt(formData.bloodPressureDiastolic) : undefined,
            heart_rate: formData.heartRate ? parseInt(formData.heartRate) : undefined,
            weight: formData.weight ? parseFloat(formData.weight) : undefined,
            height: formData.height ? parseFloat(formData.height) : undefined,
            oxygen_saturation: formData.oxygenSaturation ? parseInt(formData.oxygenSaturation) : undefined,
            respiratory_rate: formData.respiratoryRate ? parseInt(formData.respiratoryRate) : undefined,
            notes: formData.vitalNotes || undefined,
            recorded_by: user.id
          });
          vitalSignsId = vitalSigns.id;
        }
      }

      // Marquer la séance comme terminée
      await TreatmentSessionsService.markAsCompleted(
        session.id,
        user.id,
        vitalSignsId,
        formData.treatmentNotes,
        formData.observations
      );

      toast.success('Séance de traitement enregistrée avec succès');
      onComplete();
    } catch (error) {
      console.error('Error completing treatment session:', error);
      toast.error('Erreur lors de l\'enregistrement de la séance');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsMissed = async () => {
    try {
      setLoading(true);
      await TreatmentSessionsService.markAsMissed(session.id, formData.observations || 'Patient absent');
      toast.success('Séance marquée comme manquée');
      onComplete();
    } catch (error) {
      console.error('Error marking session as missed:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="card-glass rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-border/50 animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-gradient-subtle">
          <div>
            <h2 className="text-xl font-bold text-gradient-primary">
              Effectuer le Traitement
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Séance {session.session_number}{session.total_sessions ? `/${session.total_sessions}` : ''} - {session.treatment_type}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-muted transition-all"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Informations patient */}
            {patient && (
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 p-2 rounded-xl">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {patient.first_name} {patient.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tél: {patient.phone} • Groupe: {patient.blood_type || 'Non défini'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes du traitement */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Notes du traitement
              </h3>
              <textarea
                name="treatmentNotes"
                value={formData.treatmentNotes}
                onChange={handleChange}
                rows={3}
                placeholder="Notes sur le traitement effectué..."
                className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
              />
              <textarea
                name="observations"
                value={formData.observations}
                onChange={handleChange}
                rows={2}
                placeholder="Observations sur l'état du patient..."
                className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
              />
            </div>

            {/* Toggle constantes vitales */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-secondary" />
                <span className="font-medium text-foreground">Prendre les constantes vitales</span>
              </div>
              <button
                type="button"
                onClick={() => setIncludeVitals(!includeVitals)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  includeVitals ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                  includeVitals ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Constantes vitales */}
            {includeVitals && (
              <div className="space-y-4 animate-slide-down">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Heart className="h-5 w-5 text-error" />
                  Constantes Vitales
                </h3>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                      <Thermometer className="h-4 w-4 mr-1" />
                      Température (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="temperature"
                      value={formData.temperature}
                      onChange={handleChange}
                      placeholder="37.0"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                      <Droplets className="h-4 w-4 mr-1" />
                      Tension (Sys/Dia)
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        name="bloodPressureSystolic"
                        value={formData.bloodPressureSystolic}
                        onChange={handleChange}
                        placeholder="120"
                        className="w-1/2 px-2 py-2 bg-background border border-border rounded-lg focus:border-primary transition-all outline-none"
                      />
                      <input
                        type="number"
                        name="bloodPressureDiastolic"
                        value={formData.bloodPressureDiastolic}
                        onChange={handleChange}
                        placeholder="80"
                        className="w-1/2 px-2 py-2 bg-background border border-border rounded-lg focus:border-primary transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                      <Heart className="h-4 w-4 mr-1" />
                      Pouls (bpm)
                    </label>
                    <input
                      type="number"
                      name="heartRate"
                      value={formData.heartRate}
                      onChange={handleChange}
                      placeholder="75"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:border-primary transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                      <Wind className="h-4 w-4 mr-1" />
                      SpO2 (%)
                    </label>
                    <input
                      type="number"
                      name="oxygenSaturation"
                      value={formData.oxygenSaturation}
                      onChange={handleChange}
                      placeholder="98"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:border-primary transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                      <Scale className="h-4 w-4 mr-1" />
                      Poids (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      placeholder="70"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:border-primary transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                      <Ruler className="h-4 w-4 mr-1" />
                      Taille (cm)
                    </label>
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      placeholder="170"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:border-primary transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                      <Wind className="h-4 w-4 mr-1" />
                      Resp. (c/min)
                    </label>
                    <input
                      type="number"
                      name="respiratoryRate"
                      value={formData.respiratoryRate}
                      onChange={handleChange}
                      placeholder="16"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:border-primary transition-all outline-none"
                    />
                  </div>
                </div>

                <textarea
                  name="vitalNotes"
                  value={formData.vitalNotes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Notes supplémentaires sur les constantes..."
                  className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl focus:border-primary transition-all outline-none"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 pt-4 border-t border-border/50 bg-gradient-subtle flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleMarkAsMissed}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-error/10 text-error rounded-xl font-medium hover:bg-error/20 transition-colors flex items-center justify-center gap-2"
            >
              Patient absent
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-gradient px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Valider le traitement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
