import React from 'react';
import { Bell, Search, CircleUser as UserCircle, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../hooks/useRouter';
import { ConsultationWorkflowService } from '../../services/consultation-workflow';
import { ClinicSettingsService } from '../../services/clinic-settings';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [pendingWorkflows, setPendingWorkflows] = React.useState(0);
  const [clinicName, setClinicName] = React.useState('Finagnon');

  // Charger le nombre de workflows en attente
  React.useEffect(() => {
    loadPendingWorkflows();
    loadClinicSettings();
    
    // Actualiser toutes les 30 secondes
    const interval = setInterval(loadPendingWorkflows, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const loadPendingWorkflows = async () => {
    try {
      const stats = await ConsultationWorkflowService.getStats();
      // Compter les workflows qui nécessitent une action
      const pending = stats.paymentPending + stats.vitalsPending + stats.doctorAssignment + stats.consultationReady;
      setPendingWorkflows(pending);
    } catch (error) {
      console.error('Error loading pending workflows:', error);
      setPendingWorkflows(0);
    }
  };

  const loadClinicSettings = async () => {
    try {
      const settings = await ClinicSettingsService.getSettings();
      if (settings?.clinic_name) {
        setClinicName(settings.clinic_name);
      }
    } catch (error) {
      console.error('Error loading clinic settings:', error);
    }
  };

  const handleNotificationClick = () => {
    // Naviguer vers le workflow de consultation
    navigate('workflow');
  };

  return (
    <header className="bg-card/80 backdrop-blur-md shadow-card border-b border-border fixed top-0 right-0 left-0 lg:left-64 z-20">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4 flex-1">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl hover:bg-muted transition-all duration-200 hover-lift"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Rechercher un patient, RDV..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const searchTerm = e.currentTarget.value.trim();
                  if (searchTerm) {
                    navigate(`patients?search=${encodeURIComponent(searchTerm)}`);
                  }
                }
              }}
              className="pl-12 pr-4 py-2.5 bg-background border-2 border-border rounded-xl 
                       focus:border-primary focus:ring-4 focus:ring-primary/10 
                       transition-all duration-200 outline-none w-full max-w-md
                       hover:border-primary/50"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notification desktop */}
          <button 
            onClick={handleNotificationClick}
            className={`relative p-2.5 rounded-xl transition-all duration-200 hidden sm:block hover-lift ${
              pendingWorkflows > 0 
                ? 'text-error hover:text-error/80 bg-error-light' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title={`${pendingWorkflows} consultation${pendingWorkflows > 1 ? 's' : ''} en attente`}
          >
            <Bell className="h-5 w-5" />
            {pendingWorkflows > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-primary text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-semibold animate-pulse-slow shadow-glow">
                {pendingWorkflows > 99 ? '99+' : pendingWorkflows}
              </span>
            )}
          </button>

          {/* Notification mobile */}
          <button 
            onClick={handleNotificationClick}
            className={`relative p-2.5 rounded-xl transition-all duration-200 sm:hidden hover-lift ${
              pendingWorkflows > 0 
                ? 'text-error hover:text-error/80 bg-error-light' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title={`${pendingWorkflows} consultation${pendingWorkflows > 1 ? 's' : ''} en attente`}
          >
            <Bell className="h-5 w-5" />
            {pendingWorkflows > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold animate-pulse-slow shadow-glow">
                {pendingWorkflows > 9 ? '9+' : pendingWorkflows}
              </span>
            )}
          </button>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-foreground">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground">{user?.speciality || clinicName}</p>
            </div>
            <button 
              onClick={() => navigate('profile')}
              className="bg-gradient-primary p-2.5 rounded-xl hover:shadow-glow transition-all duration-300 group hover-lift"
              title="Mon compte"
            >
              <UserCircle className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}