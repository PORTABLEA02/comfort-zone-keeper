import React, { useState } from 'react';
import { Search, Plus, Eye, Edit, Phone, Mail, Trash2, Users } from 'lucide-react';
import { Database } from '../../lib/database.types';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../hooks/useRouter';
import { PatientForm } from './PatientForm';
import { PatientDetail } from './PatientDetail';
import { ConfirmDialog } from '../UI/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';
import { usePatients, useCreatePatient, useUpdatePatient, useDeletePatient } from '../../hooks/queries/usePatients';

type Patient = Database['public']['Tables']['patients']['Row'];

interface PatientListProps {
  onNewPatient?: () => void;
  onEditPatient?: (patient: Patient) => void;
  onViewPatient?: (patient: Patient) => void;
}

export function PatientList({ onNewPatient, onEditPatient, onViewPatient }: PatientListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const { user } = useAuth();
  const { currentPath } = useRouter();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  
  // Check if we're in managed mode (callbacks provided) or standalone mode
  const isManagedMode = !!(onNewPatient && onEditPatient && onViewPatient);
  
  // React Query hooks
  const { data: patients = [], isLoading: loading } = usePatients();
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();
  const deletePatient = useDeletePatient();
  
  // Charger le terme de recherche depuis l'URL une seule fois au montage
  const initialSearchRef = React.useRef(false);
  React.useEffect(() => {
    if (initialSearchRef.current) return;
    initialSearchRef.current = true;
    
    const urlParams = new URLSearchParams(currentPath.split('?')[1] || '');
    const searchParam = urlParams.get('search');
    if (searchParam) {
      setSearchTerm(decodeURIComponent(searchParam));
    }
  }, [currentPath]);

  const filteredPatients = patients.filter(patient =>
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

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

  const handleViewPatient = (patient: Patient) => {
    if (isManagedMode && onViewPatient) {
      onViewPatient(patient);
    } else if (user?.role === 'doctor' || user?.role === 'admin') {
      setSelectedPatient(patient);
    }
  };

  const handleEditPatient = (patient: Patient) => {
    if (isManagedMode && onEditPatient) {
      onEditPatient(patient);
    } else {
      setEditingPatient(patient);
      setShowPatientForm(true);
    }
  };

  const handleAddPatient = () => {
    if (isManagedMode && onNewPatient) {
      onNewPatient();
    } else {
      setEditingPatient(null);
      setShowPatientForm(true);
    }
  };

  const handleCloseDetail = () => {
    setSelectedPatient(null);
  };

  const handleEditFromDetail = () => {
    if (selectedPatient) {
      setEditingPatient(selectedPatient);
      setSelectedPatient(null);
      setShowPatientForm(true);
    }
  };

  const handleCloseForm = () => {
    setShowPatientForm(false);
    setEditingPatient(null);
  };

  const handleSavePatient = async (patientData: Partial<Patient>) => {
    try {
      if (editingPatient) {
        await updatePatient.mutateAsync({ id: editingPatient.id, data: patientData });
      } else {
        await createPatient.mutateAsync(patientData);
      }
      setShowPatientForm(false);
      setEditingPatient(null);
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    const confirmed = await confirm({
      title: 'Supprimer le patient',
      message: 'Êtes-vous sûr de vouloir supprimer ce patient ? Cette action supprimera également tout son historique médical et est irréversible.',
      type: 'danger',
      confirmText: 'Supprimer définitivement',
      cancelText: 'Annuler'
    });
    
    if (confirmed) {
      try {
        await deletePatient.mutateAsync(patientId);
      } catch (error) {
        // Error handling is done in the mutation hook
      }
    }
  };

  if (loading) {
    return (
      <div className="card-glass rounded-2xl p-8 animate-fade-in">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-primary mx-auto shadow-glow"></div>
          <p className="text-muted-foreground mt-4 font-medium">Chargement des patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card-glass rounded-2xl shadow-card border border-border/50">
      <div className="p-6 border-b border-border/50 bg-gradient-subtle">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gradient-primary">Gestion des Patients</h2>
            <p className="text-sm text-muted-foreground mt-1">Gérer les dossiers médicaux</p>
          </div>
          <button
            onClick={handleAddPatient}
            className="btn-gradient px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 hover-lift shadow-glow"
          >
            <Plus className="h-5 w-5" />
            <span>Nouveau Patient</span>
          </button>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Rechercher par nom ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-background border-2 border-border rounded-xl 
                     focus:border-primary focus:ring-4 focus:ring-primary/10 
                     transition-all duration-200 outline-none hover:border-primary/50"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-subtle">
            <tr>
              <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Patient
              </th>
              <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                Contact
              </th>
              <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                Âge
              </th>
              <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                Groupe Sanguin
              </th>
              <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border/50">
            {filteredPatients.map((patient) => (
              <tr key={patient.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 lg:px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 lg:h-12 lg:w-12">
                      <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-md hover-lift">
                        <span className="text-white font-bold text-base lg:text-lg">
                          {patient.first_name[0]}{patient.last_name[0]}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 lg:ml-5 min-w-0 flex-1">
                      <div className="text-sm lg:text-base font-semibold text-foreground truncate">
                        {patient.first_name} {patient.last_name}
                      </div>
                      <div className="text-xs lg:text-sm text-muted-foreground font-medium">
                        {patient.gender === 'M' ? 'Masculin' : 'Féminin'}
                      </div>
                      {/* Afficher le contact sur mobile */}
                      <div className="text-xs text-muted-foreground md:hidden font-medium">
                        {patient.phone}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 lg:px-6 py-4 text-sm text-foreground hidden md:table-cell">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-primary" />
                      <span className="font-medium">{patient.phone}</span>
                    </div>
                    {patient.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-secondary" />
                        <span className="truncate font-medium">{patient.email}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-semibold text-foreground hidden sm:table-cell">
                  {calculateAge(patient.date_of_birth)} ans
                </td>
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm hidden lg:table-cell">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-error to-error-light text-white shadow-md">
                    {patient.blood_type || 'Non défini'}
                  </span>
                </td>
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {(user?.role === 'doctor' || user?.role === 'admin') && (
                      <button
                        onClick={() => handleViewPatient({
                          ...patient,
                          allergies: patient.allergies || [],
                          created_at: patient.created_at || new Date().toISOString(),
                          updated_at: patient.updated_at || new Date().toISOString()
                        })}
                        className="text-primary hover:text-primary-dark p-2 rounded-xl hover:bg-primary/10 transition-all hover-lift"
                        title="Voir le dossier médical"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEditPatient({
                        ...patient,
                        allergies: patient.allergies || [],
                        created_at: patient.created_at || new Date().toISOString(),
                        updated_at: patient.updated_at || new Date().toISOString()
                      })}
                      className="text-secondary hover:text-secondary-dark p-2 rounded-xl hover:bg-secondary/10 transition-all hover-lift"
                      title={user?.role === 'secretary' ? "Modifier les informations de contact" : "Modifier"}
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => handleDeletePatient(patient.id)}
                        className="text-error hover:text-error/80 p-2 rounded-xl hover:bg-error-light transition-all hover-lift"
                        title="Supprimer"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredPatients.length === 0 && (
        <div className="text-center py-12 px-4">
          <Users className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium text-lg">Aucun patient trouvé</p>
        </div>
      )}
    </div>

      {/* Patient Form Modal - Only in standalone mode */}
      {!isManagedMode && showPatientForm && (
        <PatientForm
          patient={editingPatient || undefined}
          onClose={handleCloseForm}
          onSave={handleSavePatient}
        />
      )}

      {/* Patient Detail Modal - Only in standalone mode */}
      {!isManagedMode && selectedPatient && (
        <PatientDetail
          patient={selectedPatient}
          onClose={handleCloseDetail}
          onEdit={handleEditFromDetail}
        />
      )}

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