import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, User, Activity, Syringe, Heart, Droplets, ClipboardCheck } from 'lucide-react';
import { TreatmentSessionsService, TreatmentSession } from '../../services/treatment-sessions';
import { PatientService } from '../../services/patients';
import { TreatmentSessionForm } from './TreatmentSessionForm';
import { ControlVitalSignsPage } from '../Workflow/ControlVitalSignsPage';
import { Tables } from '../../integrations/supabase/types';
import { useAuth } from '../../context/AuthContext';

type Patient = Tables<'patients'>;

type ViewMode = 'dashboard' | 'control-vitals';

export function NurseDashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [sessions, setSessions] = useState<TreatmentSession[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<TreatmentSession | null>(null);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [stats, setStats] = useState({
    todayTotal: 0,
    todayCompleted: 0,
    todayPending: 0,
    weekPending: 0
  });
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessionsData, patientsData, statsData] = await Promise.all([
        TreatmentSessionsService.getTodaySessions(),
        PatientService.getAll(),
        TreatmentSessionsService.getStats()
      ]);
      setSessions(sessionsData);
      setPatients(patientsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading nurse dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.first_name} ${patient.last_name}` : 'Patient inconnu';
  };

  const getPatient = (patientId: string) => {
    return patients.find(p => p.id === patientId) || null;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-warning/10 text-warning border-warning/30',
      completed: 'bg-success/10 text-success border-success/30',
      cancelled: 'bg-muted text-muted-foreground border-border',
      missed: 'bg-destructive/10 text-destructive border-destructive/30'
    };
    return colors[status as keyof typeof colors] || 'bg-muted text-muted-foreground border-border';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'À effectuer',
      completed: 'Effectué',
      cancelled: 'Annulé',
      missed: 'Manqué'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const handlePerformSession = (session: TreatmentSession) => {
    setSelectedSession(session);
    setShowSessionForm(true);
  };

  const handleSessionCompleted = async () => {
    setShowSessionForm(false);
    setSelectedSession(null);
    await loadData();
  };

  const pendingSessions = sessions.filter(s => s.status === 'pending');
  const completedSessions = sessions.filter(s => s.status === 'completed');

  if (loading) {
    return (
      <div className="card-glass rounded-2xl p-8 animate-fade-in">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-primary mx-auto shadow-glow"></div>
          <p className="text-muted-foreground mt-4 font-medium">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  // Render Control Vital Signs Page
  if (viewMode === 'control-vitals') {
    return (
      <ControlVitalSignsPage
        onBack={() => setViewMode('dashboard')}
        onComplete={() => {
          setViewMode('dashboard');
          loadData();
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card-glass rounded-2xl shadow-card border border-border/50">
        <div className="p-6 bg-gradient-subtle">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-primary/10 rounded-2xl">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient-primary">
                  Tableau de Bord Infirmier
                </h1>
                <p className="text-muted-foreground mt-1">
                  Bonjour {user?.firstName} ! Voici vos traitements du jour.
                </p>
              </div>
            </div>
            <button
              onClick={() => setViewMode('control-vitals')}
              className="btn-gradient px-5 py-3 rounded-xl font-semibold flex items-center space-x-2 hover-lift shadow-glow"
            >
              <ClipboardCheck className="h-5 w-5" />
              <span>Constantes Contrôle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques du jour */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-glass rounded-2xl p-5 border-l-4 border-primary hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-primary uppercase tracking-wide">Total du jour</p>
              <p className="text-3xl font-bold text-foreground mt-2">{stats.todayTotal}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Calendar className="h-7 w-7 text-primary" />
            </div>
          </div>
        </div>

        <div className="card-glass rounded-2xl p-5 border-l-4 border-warning hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-warning uppercase tracking-wide">À effectuer</p>
              <p className="text-3xl font-bold text-foreground mt-2">{stats.todayPending}</p>
            </div>
            <div className="p-3 bg-warning/10 rounded-2xl">
              <Clock className="h-7 w-7 text-warning" />
            </div>
          </div>
        </div>

        <div className="card-glass rounded-2xl p-5 border-l-4 border-success hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-success uppercase tracking-wide">Terminés</p>
              <p className="text-3xl font-bold text-foreground mt-2">{stats.todayCompleted}</p>
            </div>
            <div className="p-3 bg-success/10 rounded-2xl">
              <CheckCircle className="h-7 w-7 text-success" />
            </div>
          </div>
        </div>

        <div className="card-glass rounded-2xl p-5 border-l-4 border-secondary hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-secondary uppercase tracking-wide">Cette semaine</p>
              <p className="text-3xl font-bold text-foreground mt-2">{stats.weekPending}</p>
            </div>
            <div className="p-3 bg-secondary/10 rounded-2xl">
              <Activity className="h-7 w-7 text-secondary" />
            </div>
          </div>
        </div>
      </div>

      {/* Traitements à effectuer */}
      <div className="card-glass rounded-2xl shadow-card border border-border/50">
        <div className="p-6 border-b border-border/50 bg-gradient-subtle">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-warning/10 rounded-xl">
              <AlertCircle className="h-6 w-6 text-warning" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Traitements à effectuer</h2>
              <p className="text-sm text-muted-foreground">{pendingSessions.length} séance(s) en attente</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {pendingSessions.length > 0 ? (
            <div className="space-y-4">
              {pendingSessions.map((session) => {
                const patient = getPatient(session.patient_id);
                return (
                  <div
                    key={session.id}
                    className="card-elevated rounded-xl p-5 border-2 border-warning/20 hover:border-warning/40 transition-all hover:shadow-lg"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <span className="font-bold text-lg text-foreground">
                              {getPatientName(session.patient_id)}
                            </span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(session.status)}`}>
                            {getStatusLabel(session.status)}
                          </span>
                          {session.session_number && session.total_sessions && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                              Séance {session.session_number}/{session.total_sessions}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center space-x-2 bg-muted/50 rounded-lg p-2">
                            <Syringe className="h-4 w-4 text-primary" />
                            <span className="font-medium text-foreground">{session.treatment_type}</span>
                          </div>
                          {patient && (
                            <div className="flex items-center space-x-2 bg-muted/50 rounded-lg p-2">
                              <Droplets className="h-4 w-4 text-destructive" />
                              <span className="text-muted-foreground">
                                Groupe: <span className="font-medium text-foreground">{patient.blood_type || 'Non renseigné'}</span>
                              </span>
                            </div>
                          )}
                        </div>

                        {session.treatment_notes && (
                          <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Notes:</span> {session.treatment_notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handlePerformSession(session)}
                        className="btn-gradient px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover-lift shadow-glow"
                      >
                        <CheckCircle className="h-5 w-5" />
                        <span>Effectuer le traitement</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="p-4 bg-success/10 rounded-full w-fit mx-auto mb-4">
                <CheckCircle className="h-12 w-12 text-success" />
              </div>
              <p className="text-lg font-medium text-foreground">Aucun traitement en attente</p>
              <p className="text-muted-foreground mt-1">Tous les traitements du jour ont été effectués</p>
            </div>
          )}
        </div>
      </div>

      {/* Traitements effectués */}
      {completedSessions.length > 0 && (
        <div className="card-glass rounded-2xl shadow-card border border-border/50">
          <div className="p-6 border-b border-border/50 bg-gradient-subtle">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-success/10 rounded-xl">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Traitements effectués</h2>
                <p className="text-sm text-muted-foreground">{completedSessions.length} séance(s) terminée(s)</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-3">
              {completedSessions.map((session) => (
                <div
                  key={session.id}
                  className="card-elevated rounded-xl p-4 border border-success/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-success/10 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{getPatientName(session.patient_id)}</p>
                        <p className="text-sm text-muted-foreground">{session.treatment_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {session.performed_date && (
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.performed_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                      {session.session_number && session.total_sessions && (
                        <span className="text-xs font-medium text-primary">
                          {session.session_number}/{session.total_sessions}
                        </span>
                      )}
                    </div>
                  </div>
                  {session.observations && (
                    <p className="text-sm text-muted-foreground mt-2 pl-12 italic">
                      {session.observations}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal pour effectuer une séance */}
      {showSessionForm && selectedSession && (
        <TreatmentSessionForm
          session={selectedSession}
          patient={getPatient(selectedSession.patient_id)}
          onClose={() => {
            setShowSessionForm(false);
            setSelectedSession(null);
          }}
          onComplete={handleSessionCompleted}
        />
      )}
    </div>
  );
}
