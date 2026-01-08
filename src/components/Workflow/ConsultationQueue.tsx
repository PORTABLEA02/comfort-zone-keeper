import { useState, useEffect } from 'react';
import { Clock, User, Activity, Stethoscope, CheckCircle, Play, RefreshCw, FileCheck } from 'lucide-react';
import { ConsultationWorkflowService } from '../../services/consultation-workflow';
import { MedicalRecordService } from '../../services/medical-records';
import { useAuth } from '../../context/AuthContext';
import { Tables } from '../../integrations/supabase/types';
import { ConfirmDialog } from '../UI/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';
import { useRouter } from '../../hooks/useRouter';

type ConsultationWorkflowRow = Tables<'consultation_workflows'>;
type PatientRow = Tables<'patients'>;
type MedicalRecordRow = Tables<'medical_records'>;

type ConsultationWorkflow = ConsultationWorkflowRow & {
  patient?: Pick<PatientRow, 'first_name' | 'last_name' | 'phone' | 'blood_type' | 'allergies'> | null;
  vital_signs?: any;
};

type PendingControl = MedicalRecordRow & {
  patient?: Pick<PatientRow, 'first_name' | 'last_name' | 'phone' | 'blood_type' | 'allergies'> | null;
  parent?: { reason: string; diagnosis: string } | null;
};

export function ConsultationQueue() {
  const [consultations, setConsultations] = useState<ConsultationWorkflow[]>([]);
  const [pendingControls, setPendingControls] = useState<PendingControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'consultations' | 'controls'>('consultations');
  const { user } = useAuth();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { navigate } = useRouter();

  useEffect(() => {
    if (user?.role === 'doctor' && user?.id) {
      loadDoctorData();
    }
  }, [user?.role, user?.id]);

  const loadDoctorData = async () => {
    try {
      if (!user?.id) return;
      
      console.log('🔍 ConsultationQueue.loadDoctorData() - Chargement des données du médecin');
      setLoading(true);
      
      const [consultationsData, controlsData] = await Promise.all([
        ConsultationWorkflowService.getByDoctor(user.id),
        MedicalRecordService.getPendingControlsForDoctor(user.id)
      ]);
      
      console.log('✅ ConsultationQueue - Consultations:', consultationsData.length, 'Contrôles:', controlsData.length);
      setConsultations(consultationsData);
      setPendingControls(controlsData);
    } catch (error) {
      console.error('❌ ConsultationQueue.loadDoctorData() - Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartConsultation = async (workflowId: string) => {
    try {
      console.log('🔍 ConsultationQueue.handleStartConsultation() - Début de consultation:', workflowId);
      await ConsultationWorkflowService.startConsultation(workflowId);
      console.log('✅ ConsultationQueue.handleStartConsultation() - Consultation démarrée');
      await loadDoctorData();
    } catch (error) {
      console.error('❌ ConsultationQueue.handleStartConsultation() - Erreur:', error);
      alert('Erreur lors du démarrage de la consultation');
    }
  };

  const handleCompleteConsultation = async (workflowId: string) => {
    const confirmed = await confirm({
      title: 'Terminer la consultation',
      message: 'Une consultation sera automatiquement créée dans le module "Consultations" avec les constantes vitales prises. Vous pourrez ensuite la compléter avec le diagnostic et les prescriptions.',
      type: 'success',
      confirmText: 'Terminer la consultation',
      cancelText: 'Continuer la consultation'
    });
    
    if (confirmed) {
      try {
        console.log('🔍 ConsultationQueue.handleCompleteConsultation() - Fin de consultation:', workflowId);
        
        await ConsultationWorkflowService.completeConsultation(workflowId);
        console.log('✅ ConsultationQueue.handleCompleteConsultation() - Consultation terminée');
        
        alert(
          'Consultation terminée avec succès !\n\n' +
          'Une consultation a été créée automatiquement dans le module "Consultations". ' +
          'Vous pouvez maintenant la compléter avec le diagnostic final et les prescriptions.'
        );
        
        await loadDoctorData();
      } catch (error) {
        console.error('❌ ConsultationQueue.handleCompleteConsultation() - Erreur:', error);
        alert('Erreur lors de la finalisation de la consultation: ' + (error as Error).message);
      }
    }
  };

  const handleOpenControl = (controlId: string) => {
    navigate(`consultations/${controlId}`);
  };

  const getWaitingTime = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min`;
    } else {
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      return `${hours}h ${minutes}min`;
    }
  };

  if (user?.role !== 'doctor') {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Chargement de votre file d'attente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Ma File d'Attente</h2>
            <p className="text-sm text-gray-600 mt-1">
              Consultations et contrôles qui vous sont assignés
            </p>
          </div>
          <button
            onClick={loadDoctorData}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-gray-200 -mb-px">
          <button
            onClick={() => setActiveTab('consultations')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'consultations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Stethoscope className="h-4 w-4" />
              <span>Consultations</span>
              {consultations.length > 0 && (
                <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                  {consultations.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('controls')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'controls'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4" />
              <span>Contrôles</span>
              {pendingControls.length > 0 && (
                <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded-full text-xs">
                  {pendingControls.length}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {/* Consultations Tab */}
        {activeTab === 'consultations' && (
          <>
            {consultations.length > 0 ? (
              consultations.map((consultation) => (
                <div
                  key={consultation.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {consultation.patient?.first_name} {consultation.patient?.last_name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Attente: {getWaitingTime(consultation.created_at || new Date().toISOString())}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          consultation.status === 'consultation-ready' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {consultation.status === 'consultation-ready' ? 'Prêt' : 'En cours'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <p className="font-medium text-gray-900">
                            {consultation.consultation_type === 'general' ? 'Générale' :
                             consultation.consultation_type === 'specialist' ? 'Spécialisée' :
                             consultation.consultation_type === 'emergency' ? 'Urgence' :
                             consultation.consultation_type}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Téléphone:</span>
                          <p className="font-medium text-gray-900">{consultation.patient?.phone}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Constantes:</span>
                          <p className="font-medium text-gray-900">
                            {consultation.vital_signs_id ? (
                              <span className="text-green-600 flex items-center">
                                <Activity className="h-4 w-4 mr-1" />
                                Prises
                              </span>
                            ) : (
                              <span className="text-orange-600">Non prises</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {consultation.patient && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {consultation.patient.blood_type && (
                              <div>
                                <span className="font-medium text-blue-700">Groupe sanguin: </span>
                                <span className="text-blue-900">{consultation.patient.blood_type}</span>
                              </div>
                            )}
                            {consultation.patient.allergies && consultation.patient.allergies.length > 0 && (
                              <div>
                                <span className="font-medium text-red-700">Allergies: </span>
                                <span className="text-red-600">{consultation.patient.allergies.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 ml-4">
                      {consultation.status === 'consultation-ready' && (
                        <button
                          onClick={() => handleStartConsultation(consultation.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                        >
                          <Play className="h-4 w-4" />
                          <span>Commencer</span>
                        </button>
                      )}
                      
                      {consultation.status === 'in-progress' && (
                        <button
                          onClick={() => handleCompleteConsultation(consultation.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Terminer</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune consultation en attente</p>
                <p className="text-sm text-gray-400 mt-1">
                  Les nouvelles consultations apparaîtront ici
                </p>
              </div>
            )}
          </>
        )}

        {/* Controls Tab */}
        {activeTab === 'controls' && (
          <>
            {pendingControls.length > 0 ? (
              pendingControls.map((control) => (
                <div
                  key={control.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {control.patient?.first_name} {control.patient?.last_name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Attente: {getWaitingTime(control.created_at || new Date().toISOString())}
                          </span>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-800">
                          Contrôle gratuit
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Motif du contrôle:</span>
                          <p className="font-medium text-gray-900">{control.reason}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Téléphone:</span>
                          <p className="font-medium text-gray-900">{control.patient?.phone}</p>
                        </div>
                      </div>

                      {control.parent && (
                        <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                          <div className="text-sm">
                            <span className="font-medium text-purple-700">Consultation d'origine: </span>
                            <span className="text-purple-900">{control.parent.reason}</span>
                            <p className="text-purple-600 mt-1 text-xs">Diagnostic: {control.parent.diagnosis}</p>
                          </div>
                        </div>
                      )}

                      {control.patient && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {control.patient.blood_type && (
                              <div>
                                <span className="font-medium text-blue-700">Groupe sanguin: </span>
                                <span className="text-blue-900">{control.patient.blood_type}</span>
                              </div>
                            )}
                            {control.patient.allergies && control.patient.allergies.length > 0 && (
                              <div>
                                <span className="font-medium text-red-700">Allergies: </span>
                                <span className="text-red-600">{control.patient.allergies.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleOpenControl(control.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <FileCheck className="h-4 w-4" />
                        <span>Consulter</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun contrôle en attente</p>
                <p className="text-sm text-gray-400 mt-1">
                  Les contrôles créés par l'infirmier apparaîtront ici
                </p>
              </div>
            )}
          </>
        )}
      </div>

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
    </div>
  );
}