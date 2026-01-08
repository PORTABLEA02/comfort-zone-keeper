import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Users, DollarSign, Package, BarChart3, Settings, Stethoscope, UserCheck, LogOut, Heart, Pill, GitBranch, CircleUser as UserCircle, X, ChevronDown, ChevronRight, ListOrdered, Syringe } from 'lucide-react';
import { ClinicSettingsService } from '../../services/clinic-settings';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ activeTab, setActiveTab, isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const [collapsedSections, setCollapsedSections] = React.useState<Record<string, boolean>>({});
  const [clinicName, setClinicName] = React.useState('Clinique Médicale');

  // Charger le nom de la clinique
  React.useEffect(() => {
    loadClinicSettings();
  }, []);

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

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const getMenuItems = () => {
    if (user?.role === 'admin') {
      return {
        main: [
          { id: 'dashboard', label: 'Tableau de bord', icon: BarChart3 },
          { id: 'patients', label: 'Patients', icon: Users },
          { id: 'appointments', label: 'Rendez-vous', icon: Calendar },
        ],
        medical: [
          { id: 'workflow', label: 'Consultations en attente', icon: GitBranch },
          { id: 'consultations', label: 'Consultations', icon: Stethoscope },
          { id: 'prescriptions', label: 'Ordonnances', icon: Pill },
          { id: 'treatments', label: 'Traitements', icon: Syringe },
        ],
        management: [
          { id: 'billing', label: 'Facturation', icon: DollarSign },
          { id: 'staff', label: 'Personnel', icon: UserCheck },
          { id: 'inventory', label: 'Stock', icon: Package },
        ],
        system: [
          { id: 'profile', label: 'Mon compte', icon: UserCircle },
          { id: 'settings', label: 'Paramètres', icon: Settings },
        ]
      };
    }
    
    if (user?.role === 'doctor') {
      return {
        main: [
          { id: 'patients', label: 'Mes Patients', icon: Users },
          { id: 'appointments', label: 'Mes RDV', icon: Calendar },
          { id: 'queue', label: 'Ma File d\'Attente', icon: ListOrdered },
          { id: 'consultations', label: 'Consultations', icon: Stethoscope },
        ],
        system: [
          { id: 'profile', label: 'Mon compte', icon: UserCircle },
        ]
      };
    }
    
    if (user?.role === 'nurse') {
      return {
        main: [
          { id: 'nurse-dashboard', label: 'Mon Tableau de Bord', icon: Heart },
        ],
        medical: [
          { id: 'treatments', label: 'Tous les Traitements', icon: Syringe },
        ],
        management: [
          { id: 'billing', label: 'Facturation', icon: DollarSign },
        ],
        system: [
          { id: 'profile', label: 'Mon compte', icon: UserCircle },
        ]
      };
    }
    
    // Secretary ou autre rôle par défaut
    return {
      main: [
        { id: 'patients', label: 'Patients', icon: Users },
        { id: 'appointments', label: 'Rendez-vous', icon: Calendar },
      ],
      medical: [
        { id: 'workflow', label: 'Consultations en attente', icon: GitBranch },
        { id: 'prescriptions', label: 'Ordonnances', icon: Pill },
        { id: 'treatments', label: 'Traitements', icon: Syringe },
        { id: 'nurse-dashboard', label: 'Tableau Soins', icon: Heart },
      ],
      management: [
        { id: 'billing', label: 'Facturation', icon: DollarSign },
        { id: 'inventory', label: 'Inventaire', icon: Package },
      ],
      system: [
        { id: 'profile', label: 'Mon compte', icon: UserCircle },
      ]
    };
  };

  const menuSections = getMenuItems();

  const sectionLabels = {
    main: 'Principal',
    medical: 'Médical',
    management: 'Gestion',
    system: 'Système'
  };

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onClose(); // Fermer la sidebar sur mobile après sélection
  };

  const renderMenuSection = (sectionId: string, items: any[]) => {
    const isCollapsed = collapsedSections[sectionId];
    const hasActiveItem = items.some(item => item.id === activeTab);
    
    return (
      <div key={sectionId} className="mb-2">
        {sectionId !== 'main' && (
          <button
            onClick={() => toggleSection(sectionId)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
          >
            <span>{sectionLabels[sectionId as keyof typeof sectionLabels]}</span>
            {isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        )}
        
        {(sectionId === 'main' || !isCollapsed || hasActiveItem) && (
          <ul className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left text-sm font-medium group ${
                      isActive
                        ? 'bg-gradient-primary text-white shadow-md hover:shadow-lg'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className={`h-4 w-4 flex-shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  };
  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`w-64 bg-card/95 backdrop-blur-md shadow-xl h-screen fixed left-0 top-0 z-40 transform transition-all duration-300 ease-out flex flex-col border-r border-border ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        {/* Header avec bouton fermer sur mobile */}
        <div className="flex items-center justify-between p-4 border-b border-border lg:justify-center flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-primary p-2.5 rounded-xl shadow-glow animate-pulse-slow">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gradient-primary">{clinicName}</h1>
              <p className="text-xs text-muted-foreground font-medium">Gestion Médicale</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Profil utilisateur */}
        <div className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-subtle hover-lift transition-all duration-200 cursor-pointer">
            <div className="bg-gradient-secondary p-2 rounded-xl shadow-md">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground capitalize truncate font-medium">
                {user?.role === 'admin' ? 'Administrateur' : 
                 user?.role === 'doctor' ? 'Médecin' : 
                 user?.role === 'nurse' ? 'Infirmier' : 'Secrétaire'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto min-h-0 scrollbar-hide">
          <div className="space-y-1">
            {Object.entries(menuSections).map(([sectionId, items]) => 
              renderMenuSection(sectionId, items)
            )}
          </div>
        </nav>

        {/* Déconnexion */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 text-muted-foreground hover:text-error hover:bg-error-light rounded-xl transition-all duration-200 text-sm font-medium group"
          >
            <LogOut className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </>
  );
}