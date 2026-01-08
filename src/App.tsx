import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/UI/ErrorBoundary';
import { LoginForm } from './components/Auth/LoginForm';
import { useRouter } from './hooks/useRouter';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { DashboardStats } from './components/Dashboard/DashboardStats';
import { ReportsWidget } from './components/Dashboard/ReportsWidget';
import { PerformanceMetrics } from './components/Dashboard/PerformanceMetrics';
import { ActivityFeed } from './components/Dashboard/ActivityFeed';
import { PatientManager } from './components/Patients/PatientManager';
import { AppointmentCalendar, AppointmentFormPage } from './components/Appointments';
import { InventoryManager } from './components/Inventory/InventoryManager';
import { ConsultationsManager, ConsultationFormPage, ConsultationDetailPage } from './components/Consultations';
import { PrescriptionList } from './components/Prescriptions';
import { StaffManager } from './components/Staff';
import { ConsultationWorkflowManager, VitalSignsFormPage } from './components/Workflow';
import { ConsultationQueue } from './components/Workflow/ConsultationQueue';
import { SettingsManager } from './components/Settings';
import { BillingManager } from './components/Billing';
import { ProfileManager } from './components/Profile';
import { TreatmentManager, TreatmentFormPage, NurseDashboard } from './components/Treatments';
import { ProspectusPage } from './components/Prospectus';

// Create a client with error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (error instanceof Error && error.message.includes('auth')) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error);
      }
    }
  },
});

function Dashboard() {
  const { user } = useAuth();
  const { currentPath, queryParams, navigate, isInitialized } = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Rediriger les docteurs vers la page rendez-vous à la connexion
  useEffect(() => {
    if (user?.role === 'doctor' && currentPath === 'dashboard') {
      navigate('appointments');
    }
  }, [user?.role, currentPath, navigate]);

  const renderContent = () => {
    if (!isInitialized) {
      return (
        <div className="card-elevated rounded-2xl p-8 border border-border animate-scale-in">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary/30 border-t-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4 font-medium">Initialisation...</p>
          </div>
        </div>
      );
    }

    switch (currentPath) {
      case 'dashboard':
        if (user?.role !== 'admin') {
          return (
            <div className="card-elevated rounded-2xl p-8 border border-border animate-slide-up">
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-foreground mb-3">Accès Restreint</h2>
                <p className="text-muted-foreground">Seuls les administrateurs ont accès au tableau de bord.</p>
              </div>
            </div>
          );
        }
        return (
          <ErrorBoundary>
            <div className="space-y-6 animate-fade-in">
              <DashboardStats />
              <div className="space-y-6">
                <ReportsWidget />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <PerformanceMetrics />
                  <ActivityFeed />
                </div>
              </div>
            </div>
          </ErrorBoundary>
        );

      case 'patients':
        return (
          <ErrorBoundary>
            <PatientManager />
          </ErrorBoundary>
        );

      case 'appointments':
        return (
          <ErrorBoundary>
            <AppointmentCalendar />
          </ErrorBoundary>
        );

      case 'appointment-form':
        return (
          <ErrorBoundary>
            <AppointmentFormPage />
          </ErrorBoundary>
        );

      case 'queue':
        return (
          <ErrorBoundary>
            <ConsultationQueue />
          </ErrorBoundary>
        );

      case 'consultations':
        return (
          <ErrorBoundary>
            <ConsultationsManager />
          </ErrorBoundary>
        );

      case 'consultation-form':
        return (
          <ErrorBoundary>
            <ConsultationFormPage />
          </ErrorBoundary>
        );

      case 'consultation-detail':
        return (
          <ErrorBoundary>
            <ConsultationDetailPage />
          </ErrorBoundary>
        );

      case 'workflow':
        return (
          <ErrorBoundary>
            <ConsultationWorkflowManager />
          </ErrorBoundary>
        );

      case 'vital-signs':
        return (
          <ErrorBoundary>
            <VitalSignsFormPage 
              workflowId={queryParams.workflowId || ''} 
              onBack={() => navigate('workflow')}
              onSave={() => navigate('workflow')}
            />
          </ErrorBoundary>
        );

      case 'prescriptions':
        return (
          <ErrorBoundary>
            <PrescriptionList />
          </ErrorBoundary>
        );

      case 'billing':
        return (
          <ErrorBoundary>
            <BillingManager />
          </ErrorBoundary>
        );

      case 'staff':
        return (
          <ErrorBoundary>
            <StaffManager />
          </ErrorBoundary>
        );

      case 'inventory':
        return (
          <ErrorBoundary>
            <InventoryManager />
          </ErrorBoundary>
        );

      case 'reports':
        return (
          <div className="card-elevated rounded-2xl p-8 border border-border animate-slide-up">
            <h2 className="text-2xl font-bold text-foreground mb-4">Rapports et Analyses</h2>
            <p className="text-muted-foreground">Module de reporting en cours de développement...</p>
          </div>
        );

      case 'settings':
        return (
          <ErrorBoundary>
            <SettingsManager />
          </ErrorBoundary>
        );

      case 'profile':
        return (
          <ErrorBoundary>
            <ProfileManager />
          </ErrorBoundary>
        );

      case 'treatments':
        return (
          <ErrorBoundary>
            <TreatmentManager />
          </ErrorBoundary>
        );

      case 'treatment-form':
        return (
          <ErrorBoundary>
            <TreatmentFormPage />
          </ErrorBoundary>
        );

      case 'nurse-dashboard':
        return (
          <ErrorBoundary>
            <NurseDashboard />
          </ErrorBoundary>
        );

      case 'prospectus':
        return <ProspectusPage />;

      default:
        return (
          <div className="card-elevated rounded-2xl p-8 border border-border animate-slide-up">
            <h2 className="text-2xl font-bold text-foreground mb-2">Tableau de bord</h2>
            <p className="text-muted-foreground">Sélectionnez un module dans le menu de gauche</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Sidebar 
        activeTab={currentPath} 
        setActiveTab={navigate} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <main className="pt-[72px] lg:ml-64 px-4 lg:px-6">
        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  
  useEffect(() => {
    const handleOnline = () => {
      console.log('🔍 App.handleOnline() - Connexion internet rétablie, vérification de la session');
      if (isAuthenticated) {
        console.log('✅ App.handleOnline() - Session toujours valide');
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="bg-gradient-primary p-4 rounded-2xl w-20 h-20 mx-auto mb-6 shadow-glow animate-pulse-slow">
            <Heart className="h-12 w-12 text-white" />
          </div>
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary/30 border-t-primary mx-auto mb-4"></div>
          <p className="text-foreground font-medium text-lg">Chargement de l'application...</p>
          <p className="text-sm text-muted-foreground mt-2">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return <Dashboard />;
}

// Global error handler for logging
function handleGlobalError(error: Error, errorInfo: React.ErrorInfo) {
  console.error('🚨 Global Error Caught:', {
    error: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack
  });
  
  // Here you could send to an error tracking service like Sentry
}

function App() {
  return (
    <ErrorBoundary onError={handleGlobalError}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
          <Toaster 
            position="top-right" 
            richColors 
            closeButton
            toastOptions={{
              duration: 4000,
            }}
          />
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
