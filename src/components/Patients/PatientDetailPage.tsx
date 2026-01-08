import React, { useState } from 'react';
import { ArrowLeft, User, Phone, Mail, MapPin, Heart, AlertTriangle, Calendar, FileText, Pill, Clock, Edit, ClipboardList } from 'lucide-react';
import { Tables } from '../../integrations/supabase/types';
import { supabase } from '../../lib/supabase';

type Patient = Tables<'patients'>;

interface PatientDetailPageProps {
  patient: Patient;
  onBack: () => void;
  onEdit: () => void;
}

export function PatientDetailPage({ patient, onBack, onEdit }: PatientDetailPageProps) {
  const [medicalHistory, setMedicalHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadMedicalHistory();
  }, [patient.id]);

  const loadMedicalHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('medical_records')
        .select(`
          *,
          prescriptions(*)
        `)
        .eq('patient_id', patient.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading medical history:', error);
        return;
      }

      setMedicalHistory(data || []);
    } catch (error) {
      console.error('Error loading medical history:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getConsultationTypeLabel = (type: string) => {
    const types = {
      general: 'Générale',
      specialist: 'Spécialisée',
      emergency: 'Urgence',
      followup: 'Suivi',
      preventive: 'Préventive',
      other: 'Autre'
    };
    return types[type as keyof typeof types] || 'Non défini';
  };

  const getConsultationTypeColor = (type: string) => {
    const colors = {
      general: 'bg-primary/10 text-primary',
      specialist: 'bg-secondary/10 text-secondary',
      emergency: 'bg-error/10 text-error',
      followup: 'bg-success/10 text-success',
      preventive: 'bg-warning/10 text-warning',
      other: 'bg-muted text-muted-foreground'
    };
    return colors[type as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card-glass rounded-2xl shadow-card border border-border/50">
        <div className="p-6 bg-gradient-subtle flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 rounded-xl hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-muted-foreground" />
            </button>
            <div className="flex items-center space-x-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <span className="text-white font-bold text-xl">
                  {patient.first_name[0]}{patient.last_name[0]}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient-primary">
                  {patient.first_name} {patient.last_name}
                </h1>
                <p className="text-sm text-muted-foreground mt-1 font-medium">
                  Dossier Patient - {calculateAge(patient.date_of_birth)} ans • {patient.gender === 'M' ? 'Masculin' : 'Féminin'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onEdit}
            className="btn-gradient px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 hover-lift shadow-glow"
          >
            <Edit className="h-5 w-5" />
            <span>Modifier</span>
          </button>
        </div>
      </div>

      {/* Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Patient Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Informations personnelles */}
          <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-primary" />
              Informations Personnelles
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nom complet</label>
                <p className="text-foreground font-medium">{patient.first_name} {patient.last_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date de naissance</label>
                <p className="text-foreground">{new Date(patient.date_of_birth).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Âge</label>
                <p className="text-foreground">{calculateAge(patient.date_of_birth)} ans</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Genre</label>
                <p className="text-foreground">{patient.gender === 'M' ? 'Masculin' : 'Féminin'}</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
              <Phone className="h-5 w-5 mr-2 text-secondary" />
              Contact
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Téléphone</label>
                  <p className="text-foreground font-medium">{patient.phone}</p>
                </div>
              </div>
              {patient.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-foreground">{patient.email}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Adresse</label>
                  <p className="text-foreground">{patient.address}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Contact d'urgence</label>
                <p className="text-foreground">{patient.emergency_contact}</p>
              </div>
            </div>
          </div>

          {/* Informations médicales */}
          <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
              <Heart className="h-5 w-5 mr-2 text-error" />
              Informations Médicales
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Groupe sanguin</label>
                <div className="mt-1">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-bold bg-error/10 text-error">
                    <Heart className="h-4 w-4 mr-1" />
                    {patient.blood_type || 'Non défini'}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Allergies connues</label>
                <div className="mt-2">
                  {patient.allergies && patient.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {patient.allergies.map((allergy, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-warning/10 text-warning"
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {allergy}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic text-sm">Aucune allergie connue</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center">
                  <ClipboardList className="h-4 w-4 mr-1" />
                  Antécédents Médicaux
                </label>
                <div className="mt-2">
                  {patient.medical_history && patient.medical_history.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {patient.medical_history.map((history, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-secondary/10 text-secondary"
                        >
                          {history}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic text-sm">Aucun antécédent médical enregistré</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Inscrit le</label>
                <p className="text-foreground">{patient.created_at ? new Date(patient.created_at).toLocaleDateString('fr-FR') : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-primary" />
              Résumé
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-primary">{medicalHistory.length}</div>
                <div className="text-sm text-muted-foreground">Consultations</div>
              </div>
              <div className="bg-success/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-success">
                  {medicalHistory.reduce((total, record) => total + (record.prescriptions?.length || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Prescriptions</div>
              </div>
              <div className="bg-warning/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-warning">{patient.allergies?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Allergies</div>
              </div>
              <div className="bg-secondary/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-secondary">
                  {medicalHistory.length > 0 ? 
                    Math.ceil((new Date().getTime() - new Date(medicalHistory[medicalHistory.length - 1].date).getTime()) / (1000 * 3600 * 24)) 
                    : 0}
                </div>
                <div className="text-sm text-muted-foreground">Jours depuis visite</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Medical History */}
        <div className="lg:col-span-2">
          <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-success" />
              Historique Médical ({medicalHistory.length} consultations)
            </h3>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-primary mx-auto shadow-glow"></div>
                <p className="text-muted-foreground mt-4 font-medium">Chargement de l'historique...</p>
              </div>
            ) : medicalHistory.length > 0 ? (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {medicalHistory
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((record) => (
                    <div key={record.id} className="bg-muted/30 rounded-xl p-4 border border-border/30">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">
                              {new Date(record.date).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getConsultationTypeColor(record.type)}`}>
                            {getConsultationTypeLabel(record.type)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Motif: </span>
                          <span className="text-foreground">{record.reason}</span>
                        </div>
                        
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Diagnostic: </span>
                          <span className="text-foreground font-medium">{record.diagnosis}</span>
                        </div>

                        {record.symptoms && (
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Symptômes: </span>
                            <span className="text-foreground">{record.symptoms}</span>
                          </div>
                        )}

                        {record.treatment && (
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Traitement: </span>
                            <span className="text-foreground">{record.treatment}</span>
                          </div>
                        )}

                        {record.prescriptions && record.prescriptions.length > 0 && (
                          <div>
                            <span className="text-sm font-medium text-muted-foreground flex items-center mb-2">
                              <Pill className="h-4 w-4 mr-1" />
                              Prescription:
                            </span>
                            <div className="bg-background rounded-lg p-3 space-y-2 border border-border/30">
                              {record.prescriptions.map((prescription: any, index: number) => (
                                <div key={index} className="text-sm">
                                  <span className="font-medium text-foreground">{prescription.medication}</span>
                                  <span className="text-muted-foreground"> - {prescription.dosage}, {prescription.frequency}, {prescription.duration}</span>
                                  {prescription.instructions && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Instructions: {prescription.instructions}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {record.notes && (
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Notes: </span>
                            <span className="text-foreground italic">{record.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">Aucun historique médical disponible</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
