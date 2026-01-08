import { useState } from 'react';
import { Settings, User, Shield, Save, AlertCircle } from 'lucide-react';
import { GeneralSettings } from './GeneralSettings';
import { UserManagement } from './UserManagement';
import { MedicalServicesSettings } from './MedicalServicesSettings';

const SETTINGS_TABS = [
  { id: 'general', label: 'Général', icon: Settings },
  { id: 'users', label: 'Utilisateurs', icon: User },
  { id: 'services', label: 'Services Médicaux', icon: Shield },
];

export function SettingsManager() {
  const [activeTab, setActiveTab] = useState('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings onSettingsChange={() => setHasUnsavedChanges(true)} />;
      case 'users':
        return <UserManagement />;
      case 'services':
        return <MedicalServicesSettings onServicesChange={() => setHasUnsavedChanges(true)} />;
      default:
        return <GeneralSettings onSettingsChange={() => setHasUnsavedChanges(true)} />;
    }
  };

  const handleSaveAll = () => {
    // Logique pour sauvegarder tous les paramètres
    console.log('Sauvegarde de tous les paramètres...');
    setHasUnsavedChanges(false);
  };

  return (
    <div className="card-glass rounded-2xl shadow-card border border-border/50 animate-fade-in">
      <div className="flex items-center justify-between p-6 border-b border-border/50 bg-gradient-subtle">
        <div>
          <h2 className="text-2xl font-bold text-gradient-primary">Paramètres du Système</h2>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            Configuration et administration de la clinique
          </p>
        </div>
        
        {hasUnsavedChanges && (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-warning">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-semibold">Modifications non sauvegardées</span>
            </div>
            <button
              onClick={handleSaveAll}
              className="btn-gradient px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 hover-lift shadow-glow"
            >
              <Save className="h-5 w-5" />
              <span>Sauvegarder</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex">
        {/* Sidebar des onglets */}
        <div className="w-full lg:w-64 border-r border-border/50 bg-gradient-subtle lg:block">
          <nav className="p-4 space-y-2">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-left lg:justify-start justify-center hover-lift ${
                    activeTab === tab.id
                      ? 'bg-gradient-primary text-white shadow-md'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-semibold hidden lg:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 p-4 lg:p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}