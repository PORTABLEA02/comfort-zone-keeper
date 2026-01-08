import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, CheckCircle, AlertCircle, User, Activity, Syringe, XCircle, Search } from 'lucide-react';
import { TreatmentSessionsService, TreatmentSession } from '../../services/treatment-sessions';
import { PatientService } from '../../services/patients';
import { ProfileService } from '../../services/profiles';
import { TreatmentSessionForm } from './TreatmentSessionForm';
import { Tables } from '../../integrations/supabase/types';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../hooks/useRouter';

type Patient = Tables<'patients'>;
type Profile = Tables<'profiles'>;

export function TreatmentManager() {
  const [sessions, setSessions] = useState<TreatmentSession[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<TreatmentSession | null>(null);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'pending' | 'upcoming' | 'completed'>('today');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const { navigate } = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessionsData, patientsData, staffData] = await Promise.all([
        TreatmentSessionsService.getAll(),
        PatientService.getAll(),
        ProfileService.getAll()
      ]);
      setSessions(sessionsData);
      setPatients(patientsData);
      setStaff(staffData);
    } catch (error) {
      console.error('Error loading treatment sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.first_name} ${patient.last_name}` : 'Patient inconnu';
  };

  const getStaffName = (staffId: string | null) => {
    if (!staffId) return 'Non assigné';
    const member = staff.find(s => s.id === staffId);
    return member ? `${member.first_name} ${member.last_name}` : 'Inconnu';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-warning-light text-warning',
      completed: 'bg-success-light text-success',
      cancelled: 'bg-muted text-muted-foreground',
      missed: 'bg-error-light text-error'
    };
    return colors[status as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'En attente',
      completed: 'Effectué',
      cancelled: 'Annulé',
      missed: 'Manqué'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'missed': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = searchTerm === '' || 
      getPatientName(session.patient_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.treatment_type.toLowerCase().includes(searchTerm.toLowerCase());

    switch (activeTab) {
      case 'today':
        return matchesSearch && session.scheduled_date === today;
      case 'pending':
        return matchesSearch && session.status === 'pending' && session.scheduled_date <= today;
      case 'upcoming':
        return matchesSearch && session.status === 'pending' && session.scheduled_date > today;
      case 'completed':
        return matchesSearch && session.status === 'completed';
      default:
        return matchesSearch;
    }
  });

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'today':
        return sessions.filter(s => s.scheduled_date === today).length;
      case 'pending':
        return sessions.filter(s => s.status === 'pending' && s.scheduled_date <= today).length;
      case 'upcoming':
        return sessions.filter(s => s.status === 'pending' && s.scheduled_date > today).length;
      case 'completed':
        return sessions.filter(s => s.status === 'completed').length;
      default:
        return 0;
    }
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

  const handleCreateTreatment = () => {
    navigate('treatment-form');
  };


  if (loading) {
    return (
      <div className="card-glass rounded-2xl p-8 animate-fade-in">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-primary mx-auto shadow-glow"></div>
          <p className="text-muted-foreground mt-4 font-medium">Chargement des traitements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card-glass rounded-2xl shadow-card border border-border/50">
        <div className="p-6 border-b border-border/50 bg-gradient-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gradient-primary">Suivi des Traitements</h2>
              <p className="text-sm text-muted-foreground mt-1 font-medium">
                Gérer les séances de traitement des patients
              </p>
            </div>
            {(user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse' || user?.role === 'secretary') && (
              <button
                onClick={handleCreateTreatment}
                className="btn-gradient px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 hover-lift shadow-glow"
              >
                <Plus className="h-5 w-5" />
                <span>Nouveau Traitement</span>
              </button>
            )}
          </div>
        </div>

        {/* Statistiques */}
        <div className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-elevated rounded-2xl p-5 border-l-4 border-primary hover-lift">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-primary uppercase tracking-wide">Aujourd'hui</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{getTabCount('today')}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
              </div>
            </div>

            <div className="card-elevated rounded-2xl p-5 border-l-4 border-warning hover-lift">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-warning uppercase tracking-wide">En retard</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{getTabCount('pending')}</p>
                </div>
                <div className="p-3 bg-warning/10 rounded-2xl">
                  <AlertCircle className="h-8 w-8 text-warning" />
                </div>
              </div>
            </div>

            <div className="card-elevated rounded-2xl p-5 border-l-4 border-secondary hover-lift">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-secondary uppercase tracking-wide">À venir</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{getTabCount('upcoming')}</p>
                </div>
                <div className="p-3 bg-secondary/10 rounded-2xl">
                  <Clock className="h-8 w-8 text-secondary" />
                </div>
              </div>
            </div>

            <div className="card-elevated rounded-2xl p-5 border-l-4 border-success hover-lift">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-success uppercase tracking-wide">Terminés</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{getTabCount('completed')}</p>
                </div>
                <div className="p-3 bg-success/10 rounded-2xl">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des séances */}
      <div className="card-glass rounded-2xl shadow-card border border-border/50">
        {/* Recherche et onglets */}
        <div className="p-4 border-b border-border/50">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par patient ou type de traitement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-background border-2 border-border rounded-xl 
                       focus:border-primary focus:ring-4 focus:ring-primary/10 
                       transition-all duration-200 outline-none"
            />
          </div>

          <nav className="flex space-x-4 overflow-x-auto">
            {[
              { id: 'today', label: "Aujourd'hui", count: getTabCount('today') },
              { id: 'pending', label: 'En retard', count: getTabCount('pending') },
              { id: 'upcoming', label: 'À venir', count: getTabCount('upcoming') },
              { id: 'completed', label: 'Terminés', count: getTabCount('completed') }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-4 rounded-xl font-medium text-sm flex items-center space-x-2 whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-primary/10 text-primary'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Liste */}
        <div className="p-6">
          {filteredSessions.length > 0 ? (
            <div className="space-y-4">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className="card-elevated rounded-xl p-4 border border-border/50 hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-foreground">
                            {getPatientName(session.patient_id)}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(session.status)}`}>
                          {getStatusIcon(session.status)}
                          {getStatusLabel(session.status)}
                        </span>
                        {session.session_number && session.total_sessions && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            Séance {session.session_number}/{session.total_sessions}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <Syringe className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{session.treatment_type}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {new Date(session.scheduled_date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        {session.performed_by && (
                          <div className="flex items-center space-x-2">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Par: {getStaffName(session.performed_by)}
                            </span>
                          </div>
                        )}
                      </div>

                      {session.observations && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          Note: {session.observations}
                        </p>
                      )}
                    </div>

                    {session.status === 'pending' && (user?.role === 'nurse' || user?.role === 'doctor' || user?.role === 'admin' || user?.role === 'secretary') && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePerformSession(session)}
                          className="btn-gradient px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Effectuer</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Syringe className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">
                {searchTerm ? 'Aucun traitement trouvé' : 'Aucune séance de traitement'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal pour effectuer une séance */}
      {showSessionForm && selectedSession && (
        <TreatmentSessionForm
          session={selectedSession}
          patient={patients.find(p => p.id === selectedSession.patient_id) || null}
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
