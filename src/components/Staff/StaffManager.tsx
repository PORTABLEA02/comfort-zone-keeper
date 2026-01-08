import { useState } from 'react';
import { StaffList } from './StaffList';
import { StaffForm } from './StaffForm';
import { StaffDetail } from './StaffDetail';
import { StaffSchedule } from './StaffSchedule';
import { StaffStats } from './StaffStats';
import { Database } from '../../lib/database.types';
import { useUpdateStaff } from '../../hooks/queries/useStaff';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function StaffManager() {
  const [activeView, setActiveView] = useState<'list' | 'schedule' | 'stats'>('list');
  const [selectedStaff, setSelectedStaff] = useState<Profile | null>(null);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Profile | null>(null);
  
  const updateStaffMutation = useUpdateStaff();

  const handleSelectStaff = (staff: Profile) => {
    setSelectedStaff(staff);
  };

  const handleNewStaff = () => {
    setEditingStaff(null);
    setShowStaffForm(true);
  };

  const handleEditStaff = (staff: Profile) => {
    setEditingStaff(staff);
    setSelectedStaff(null);
    setShowStaffForm(true);
  };

  const handleSaveStaff = (staffData: Partial<Profile>) => {
    if (editingStaff) {
      updateStaffMutation.mutate({ id: editingStaff.id, data: staffData });
    }
    setShowStaffForm(false);
    setEditingStaff(null);
  };

  const handleCloseForm = () => {
    setShowStaffForm(false);
    setEditingStaff(null);
  };

  const handleCloseDetail = () => {
    setSelectedStaff(null);
  };

  const handleEditFromDetail = () => {
    if (selectedStaff) {
      setEditingStaff(selectedStaff);
      setSelectedStaff(null);
      setShowStaffForm(true);
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'list':
        return (
          <StaffList
            onSelectStaff={handleSelectStaff}
            onNewStaff={handleNewStaff}
            onEditStaff={handleEditStaff}
          />
        );
      case 'schedule':
        return <StaffSchedule />;
      case 'stats':
        return <StaffStats />;
      default:
        return (
          <StaffList
            onSelectStaff={handleSelectStaff}
            onNewStaff={handleNewStaff}
            onEditStaff={handleEditStaff}
          />
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Navigation Tabs */}
      <div className="card-glass rounded-2xl shadow-card border border-border/50">
        <div className="border-b border-border/50">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveView('list')}
              className={`py-4 px-2 border-b-3 font-semibold text-sm transition-all ${
                activeView === 'list'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30'
              }`}
            >
              Liste du Personnel
            </button>
            <button
              onClick={() => setActiveView('schedule')}
              className={`py-4 px-2 border-b-3 font-semibold text-sm transition-all ${
                activeView === 'schedule'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30'
              }`}
            >
              Planning
            </button>
            <button
              onClick={() => setActiveView('stats')}
              className={`py-4 px-2 border-b-3 font-semibold text-sm transition-all ${
                activeView === 'stats'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30'
              }`}
            >
              Statistiques
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      {renderContent()}

      {/* Modals */}
      {selectedStaff && (
        <StaffDetail
          staff={selectedStaff}
          onClose={handleCloseDetail}
          onEdit={handleEditFromDetail}
        />
      )}

      {showStaffForm && (
        <StaffForm
          staff={editingStaff || undefined}
          onClose={handleCloseForm}
          onSave={handleSaveStaff}
        />
      )}
    </div>
  );
}