import React, { useState } from 'react';
import { X, User, Phone, Mail, MapPin, Heart, AlertTriangle, Calendar, FileText, Pill, Clock } from 'lucide-react';
import { Tables } from '../../integrations/supabase/types';
import { supabase } from '../../lib/supabase';

type Patient = Tables<'patients'>;

interface PatientDetailProps {
  patient: Patient;
  onClose: () => void;
  onEdit: () => void;
}

export function PatientDetail({ patient, onClose, onEdit }: PatientDetailProps) {
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
      general: 'bg-blue-100 text-blue-800',
      specialist: 'bg-purple-100 text-purple-800',
      emergency: 'bg-red-100 text-red-800',
      followup: 'bg-green-100 text-green-800',
      preventive: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                {patient.first_name} {patient.last_name}
              </h2>
              <p className="text-gray-600">Dossier Patient - ID: {patient.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Modifier
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Informations personnelles */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Informations Personnelles
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nom complet</label>
                  <p className="text-gray-900 font-medium">{patient.first_name} {patient.last_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Date de naissance</label>
                  <p className="text-gray-900">{new Date(patient.date_of_birth).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Âge</label>
                  <p className="text-gray-900">{calculateAge(patient.date_of_birth)} ans</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Genre</label>
                  <p className="text-gray-900">{patient.gender === 'M' ? 'Masculin' : 'Féminin'}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-600">Téléphone</label>
                    <p className="text-gray-900">{patient.phone}</p>
                  </div>
                </div>
                {patient.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900">{patient.email}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                  <div>
                    <label className="text-sm font-medium text-gray-600">Adresse</label>
                    <p className="text-gray-900">{patient.address}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Contact d'urgence</label>
                  <p className="text-gray-900">{patient.emergency_contact}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Inscrit le</label>
                  <p className="text-gray-900">{patient.created_at ? new Date(patient.created_at).toLocaleDateString('fr-FR') : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Informations médicales */}
          <div className="bg-red-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
              <Heart className="h-5 w-5 mr-2" />
              Informations Médicales
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600">Groupe sanguin</label>
                <div className="mt-1">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    <Heart className="h-4 w-4 mr-1" />
                    {patient.blood_type || 'Non défini'}
                  </span>
                </div>
              </div>
              
              <div>
                  <label className="text-sm font-medium text-gray-600">Allergies connues</label>
                  <div className="mt-1">
                    {patient.allergies && patient.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {patient.allergies.map((allergy, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {allergy}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Aucune allergie connue</p>
                  )}
                </div>
              </div>
            </div>

            {/* Antécédents Médicaux */}
            <div className="mt-6">
              <label className="text-sm font-medium text-gray-600">Antécédents Médicaux</label>
              <div className="mt-1">
                {patient.medical_history && patient.medical_history.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.medical_history.map((item, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Aucun antécédent médical enregistré</p>
                )}
              </div>
            </div>
          </div>

          {/* Historique médical */}
          <div className="bg-green-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Historique Médical ({medicalHistory.length} consultations)
            </h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Chargement de l'historique...</p>
              </div>
            ) : medicalHistory.length > 0 ? (
              <div className="space-y-4">
                {medicalHistory
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((record) => (
                    <div key={record.id} className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {new Date(record.date).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConsultationTypeColor(record.type)}`}>
                            {getConsultationTypeLabel(record.type)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Motif: </span>
                          <span className="text-gray-900">{record.reason}</span>
                        </div>
                        
                        <div>
                          <span className="text-sm font-medium text-gray-700">Diagnostic: </span>
                          <span className="text-gray-900 font-medium">{record.diagnosis}</span>
                        </div>

                        {record.symptoms && (
                          <div>
                            <span className="text-sm font-medium text-gray-700">Symptômes: </span>
                            <span className="text-gray-900">{record.symptoms}</span>
                          </div>
                        )}

                        {record.treatment && (
                          <div>
                            <span className="text-sm font-medium text-gray-700">Traitement: </span>
                            <span className="text-gray-900">{record.treatment}</span>
                          </div>
                        )}

                        {record.prescriptions && record.prescriptions.length > 0 && (
                          <div>
                            <span className="text-sm font-medium text-gray-700 flex items-center mb-2">
                              <Pill className="h-4 w-4 mr-1" />
                              Prescription:
                            </span>
                            <div className="bg-gray-50 rounded p-3 space-y-2">
                              {record.prescriptions.map((prescription: any, index: number) => (
                                <div key={index} className="text-sm">
                                  <span className="font-medium text-gray-900">{prescription.medication}</span>
                                  <span className="text-gray-600"> - {prescription.dosage}, {prescription.frequency}, {prescription.duration}</span>
                                  {prescription.instructions && (
                                    <div className="text-xs text-gray-500 mt-1">
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
                            <span className="text-sm font-medium text-gray-700">Notes: </span>
                            <span className="text-gray-900 italic">{record.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun historique médical disponible</p>
              </div>
            )}
          </div>

          {/* Statistiques rapides */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Résumé
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{medicalHistory.length}</div>
                <div className="text-sm text-gray-600">Consultations</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {medicalHistory.reduce((total, record) => total + (record.prescriptions?.length || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Prescriptions</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{patient.allergies?.length || 0}</div>
                <div className="text-sm text-gray-600">Allergies</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {medicalHistory.length > 0 ? 
                    Math.ceil((new Date().getTime() - new Date(medicalHistory[medicalHistory.length - 1].date).getTime()) / (1000 * 3600 * 24)) 
                    : 0}
                </div>
                <div className="text-sm text-gray-600">Jours depuis dernière visite</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}