import { useState, useMemo } from 'react';
import { Search, Plus, Calendar, User, FileText, Trash2, Eye, ChevronDown, ChevronRight, CheckCircle, CornerDownRight } from 'lucide-react';
import { Database } from '../../lib/database.types';
import { ConfirmDialog } from '../UI/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';
import { useConsultations, useDeleteConsultation } from '../../hooks/queries/useConsultations';
import { usePatients } from '../../hooks/queries/usePatients';
import { useDoctors } from '../../hooks/queries/useStaff';
import { useRouter } from '../../hooks/useRouter';

type MedicalRecord = Database['public']['Tables']['medical_records']['Row'];

interface PatientInfo {
  id: string;
  first_name: string;
  last_name: string;
}

interface ConsultationWithControls extends MedicalRecord {
  controls?: MedicalRecord[];
}

interface PatientGroup {
  patient: PatientInfo;
  consultations: ConsultationWithControls[];
}

interface ConsultationListProps {
  onSelectConsultation: (consultation: MedicalRecord) => void;
  onNewConsultation: () => void;
}

export function ConsultationList({ onSelectConsultation, onNewConsultation }: ConsultationListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set());
  const [expandedConsultations, setExpandedConsultations] = useState<Set<string>>(new Set());
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { navigate } = useRouter();

  // React Query hooks
  const { data: consultations = [], isLoading: consultationsLoading } = useConsultations();
  const { data: patients = [], isLoading: patientsLoading } = usePatients();
  const { data: doctors = [], isLoading: doctorsLoading } = useDoctors();
  const deleteConsultationMutation = useDeleteConsultation();

  const loading = consultationsLoading || patientsLoading || doctorsLoading;

  const handleDelete = async (id: string) => {
    const consultation = consultations.find(c => c.id === id);
    const patientName = consultation ? getPatientName(consultation.patient_id) : 'cette consultation';
    const isControl = (consultation as any)?.is_control;
    
    const confirmed = await confirm({
      title: isControl ? 'Supprimer le contrôle' : 'Supprimer la consultation',
      message: `Êtes-vous sûr de vouloir supprimer ${isControl ? 'ce contrôle' : 'la consultation'} de ${patientName} ? ${!isControl ? 'Cette action supprimera également tous les contrôles et prescriptions associés.' : ''} Cette action est irréversible.`,
      type: 'danger',
      confirmText: 'Supprimer',
      cancelText: 'Annuler'
    });
    
    if (confirmed) {
      deleteConsultationMutation.mutate(id);
    }
  };

  const handleNewControl = (consultationId: string) => {
    navigate(`consultation-form?parentConsultationId=${consultationId}`);
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.first_name} ${patient.last_name}` : 'Patient inconnu';
  };

  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : 'Médecin inconnu';
  };

  const getTypeLabel = (type: string, isControl: boolean) => {
    if (isControl) return 'Contrôle';
    const labels: Record<string, string> = {
      general: 'Générale',
      specialist: 'Spécialisée',
      emergency: 'Urgence',
      followup: 'Suivi',
      preventive: 'Préventive',
      other: 'Autre'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string, isControl: boolean) => {
    if (isControl) return 'bg-emerald-100 text-emerald-800';
    const colors: Record<string, string> = {
      general: 'bg-blue-100 text-blue-800',
      specialist: 'bg-purple-100 text-purple-800',
      emergency: 'bg-red-100 text-red-800',
      followup: 'bg-green-100 text-green-800',
      preventive: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const togglePatient = (patientId: string) => {
    setExpandedPatients(prev => {
      const next = new Set(prev);
      if (next.has(patientId)) {
        next.delete(patientId);
      } else {
        next.add(patientId);
      }
      return next;
    });
  };

  const toggleConsultation = (consultationId: string) => {
    setExpandedConsultations(prev => {
      const next = new Set(prev);
      if (next.has(consultationId)) {
        next.delete(consultationId);
      } else {
        next.add(consultationId);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allPatientIds = patientGroups.map(g => g.patient.id);
    setExpandedPatients(new Set(allPatientIds));
  };

  const collapseAll = () => {
    setExpandedPatients(new Set());
    setExpandedConsultations(new Set());
  };

  // Organiser les consultations en parent/enfants
  const organizedConsultations = useMemo(() => {
    const mainConsultations: ConsultationWithControls[] = [];
    const controlsMap = new Map<string, MedicalRecord[]>();

    // Séparer les consultations principales des contrôles
    consultations.forEach((c: any) => {
      if (c.is_control && c.parent_consultation_id) {
        const controls = controlsMap.get(c.parent_consultation_id) || [];
        controls.push(c);
        controlsMap.set(c.parent_consultation_id, controls);
      } else {
        mainConsultations.push({ ...c, controls: [] });
      }
    });

    // Associer les contrôles à leurs consultations parentes
    mainConsultations.forEach(consultation => {
      consultation.controls = controlsMap.get(consultation.id) || [];
      // Trier les contrôles par date (plus récent en premier)
      consultation.controls.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    return mainConsultations;
  }, [consultations]);

  // Filter consultations
  const filteredConsultations = useMemo(() => {
    return organizedConsultations.filter(consultation => {
      const patientName = getPatientName(consultation.patient_id).toLowerCase();
      const doctorName = getDoctorName(consultation.doctor_id).toLowerCase();
      const diagnosis = consultation.diagnosis?.toLowerCase() || '';
      
      const matchesSearch = patientName.includes(searchTerm.toLowerCase()) ||
                           doctorName.includes(searchTerm.toLowerCase()) ||
                           diagnosis.includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType === 'all' || consultation.type === selectedType;
      
      return matchesSearch && matchesType;
    });
  }, [organizedConsultations, patients, doctors, searchTerm, selectedType]);

  // Group consultations by patient
  const patientGroups = useMemo(() => {
    const groups: Map<string, PatientGroup> = new Map();

    filteredConsultations.forEach(consultation => {
      const patient = patients.find(p => p.id === consultation.patient_id);
      if (!patient) return;

      if (!groups.has(patient.id)) {
        groups.set(patient.id, {
          patient: { id: patient.id, first_name: patient.first_name, last_name: patient.last_name },
          consultations: []
        });
      }
      groups.get(patient.id)!.consultations.push(consultation);
    });

    // Sort consultations within each group by date (most recent first)
    groups.forEach(group => {
      group.consultations.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    });

    // Convert to array and sort by patient name
    return Array.from(groups.values()).sort((a, b) => 
      `${a.patient.first_name} ${a.patient.last_name}`.localeCompare(
        `${b.patient.first_name} ${b.patient.last_name}`
      )
    );
  }, [filteredConsultations, patients]);

  // Compter le total de consultations + contrôles
  const totalRecords = useMemo(() => {
    return consultations.length;
  }, [consultations]);

  const totalControls = useMemo(() => {
    return consultations.filter((c: any) => c.is_control).length;
  }, [consultations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Consultations</h2>
          <p className="text-gray-600">Gérer les consultations et dossiers médicaux</p>
        </div>
        <button
          onClick={onNewConsultation}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nouvelle consultation</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher par patient, médecin ou diagnostic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les types</option>
              <option value="general">Générale</option>
              <option value="specialist">Spécialisée</option>
              <option value="emergency">Urgence</option>
              <option value="followup">Suivi</option>
              <option value="preventive">Préventive</option>
              <option value="other">Autre</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {patientGroups.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune consultation trouvée</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedType !== 'all' 
                ? 'Aucune consultation ne correspond à vos critères de recherche.'
                : 'Commencez par créer votre première consultation.'
              }
            </p>
            {!searchTerm && selectedType === 'all' && (
              <button
                onClick={onNewConsultation}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Créer une consultation
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Header with expand/collapse buttons */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {patientGroups.length} patient{patientGroups.length > 1 ? 's' : ''} • {totalRecords - totalControls} consultation{totalRecords - totalControls > 1 ? 's' : ''}
                  {totalControls > 0 && (
                    <span className="text-emerald-600 ml-1">• {totalControls} contrôle{totalControls > 1 ? 's' : ''}</span>
                  )}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={expandAll}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Tout développer
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={collapseAll}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Tout réduire
                </button>
              </div>
            </div>

            {/* Patient groups */}
            <div className="divide-y divide-gray-200">
              {patientGroups.map((group) => {
                const isExpanded = expandedPatients.has(group.patient.id);
                const latestConsultation = group.consultations[0];
                const totalGroupControls = group.consultations.reduce((acc, c) => acc + (c.controls?.length || 0), 0);

                return (
                  <div key={group.patient.id}>
                    {/* Patient header row */}
                    <div
                      onClick={() => togglePatient(group.patient.id)}
                      className="flex items-center px-4 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <button className="mr-3 text-gray-400 hover:text-gray-600">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </button>
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-base font-semibold text-gray-900 truncate">
                              {group.patient.first_name} {group.patient.last_name}
                            </h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {group.consultations.length} consultation{group.consultations.length > 1 ? 's' : ''}
                            </span>
                            {totalGroupControls > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                {totalGroupControls} contrôle{totalGroupControls > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            Dernière consultation: {new Date(latestConsultation.date).toLocaleDateString('fr-FR')} - {latestConsultation.diagnosis || 'Non spécifié'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Consultation rows (children) */}
                    {isExpanded && (
                      <div className="bg-gray-50">
                        <table className="w-full">
                          <thead className="bg-gray-100 border-y border-gray-200">
                            <tr>
                              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
                              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Médecin
                              </th>
                              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Diagnostic
                              </th>
                              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                              </th>
                              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {group.consultations.map((consultation) => {
                              const hasControls = consultation.controls && consultation.controls.length > 0;
                              const isConsultationExpanded = expandedConsultations.has(consultation.id);

                              return (
                                <>
                                  <tr key={consultation.id} className="hover:bg-gray-100 transition-colors">
                                    <td className="px-6 py-3">
                                      {hasControls && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleConsultation(consultation.id);
                                          }}
                                          className="text-gray-400 hover:text-gray-600"
                                        >
                                          {isConsultationExpanded ? (
                                            <ChevronDown className="h-4 w-4" />
                                          ) : (
                                            <ChevronRight className="h-4 w-4" />
                                          )}
                                        </button>
                                      )}
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap">
                                      <div className="flex items-center text-sm text-gray-900">
                                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                        {new Date(consultation.date).toLocaleDateString('fr-FR')}
                                      </div>
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">
                                        {getDoctorName(consultation.doctor_id)}
                                      </div>
                                    </td>
                                    <td className="px-6 py-3">
                                      <div className="text-sm text-gray-900 max-w-xs truncate">
                                        {consultation.diagnosis || 'Non spécifié'}
                                      </div>
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap">
                                      <div className="flex items-center space-x-2">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(consultation.type, false)}`}>
                                          {getTypeLabel(consultation.type, false)}
                                        </span>
                                        {hasControls && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            {consultation.controls!.length}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium">
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectConsultation(consultation as any);
                                          }}
                                          className="text-blue-600 hover:text-blue-900 transition-colors"
                                          title="Voir les détails"
                                        >
                                          <Eye className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleNewControl(consultation.id);
                                          }}
                                          className="text-emerald-600 hover:text-emerald-900 transition-colors"
                                          title="Ajouter un contrôle"
                                        >
                                          <Plus className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(consultation.id);
                                          }}
                                          className="text-red-600 hover:text-red-900 transition-colors"
                                          title="Supprimer"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                  {/* Contrôles (enfants de la consultation) */}
                                  {isConsultationExpanded && consultation.controls?.map((control) => (
                                    <tr key={control.id} className="bg-emerald-50/50 hover:bg-emerald-50 transition-colors">
                                      <td className="px-6 py-2">
                                        <CornerDownRight className="h-4 w-4 text-emerald-500 ml-2" />
                                      </td>
                                      <td className="px-6 py-2 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-700">
                                          <Calendar className="h-4 w-4 text-emerald-400 mr-2" />
                                          {new Date(control.date).toLocaleDateString('fr-FR')}
                                        </div>
                                      </td>
                                      <td className="px-6 py-2 whitespace-nowrap">
                                        <div className="text-sm text-gray-700">
                                          {getDoctorName(control.doctor_id)}
                                        </div>
                                      </td>
                                      <td className="px-6 py-2">
                                        <div className="text-sm text-gray-700 max-w-xs truncate">
                                          {control.diagnosis || 'Non spécifié'}
                                        </div>
                                      </td>
                                      <td className="px-6 py-2 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(control.type, true)}`}>
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          {getTypeLabel(control.type, true)}
                                        </span>
                                      </td>
                                      <td className="px-6 py-2 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onSelectConsultation(control as any);
                                            }}
                                            className="text-blue-600 hover:text-blue-900 transition-colors"
                                            title="Voir les détails"
                                          >
                                            <Eye className="h-4 w-4" />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDelete(control.id);
                                            }}
                                            className="text-red-600 hover:text-red-900 transition-colors"
                                            title="Supprimer"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalRecords - totalControls}</p>
              <p className="text-sm text-gray-600">Consultations</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-emerald-100 p-2 rounded-lg mr-3">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalControls}</p>
              <p className="text-sm text-gray-600">Contrôles</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-lg mr-3">
              <User className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{patientGroups.length}</p>
              <p className="text-sm text-gray-600">Patients</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-red-100 p-2 rounded-lg mr-3">
              <Calendar className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {consultations.filter((c: any) => c.type === 'emergency' && !c.is_control).length}
              </p>
              <p className="text-sm text-gray-600">Urgences</p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title || ''}
        message={confirmState.message || ''}
        type={confirmState.type || 'warning'}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        isLoading={confirmState.isLoading}
        onConfirm={handleConfirm}
        onClose={handleCancel}
      />
    </div>
  );
}
