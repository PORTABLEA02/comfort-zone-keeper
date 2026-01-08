import { useState } from 'react';
import { PatientList } from './PatientList';
import { PatientFormPage } from './PatientFormPage';
import { PatientDetailPage } from './PatientDetailPage';
import { Database } from '../../lib/database.types';
import { useCreatePatient, useUpdatePatient } from '../../hooks/queries/usePatients';

type Patient = Database['public']['Tables']['patients']['Row'];

type ViewType = 'list' | 'new' | 'edit' | 'detail';

export function PatientManager() {
  const [activeView, setActiveView] = useState<ViewType>('list');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();

  const handleNewPatient = () => {
    setSelectedPatient(null);
    setActiveView('new');
  };

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveView('edit');
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveView('detail');
  };

  const handleBackToList = () => {
    setActiveView('list');
    setSelectedPatient(null);
  };

  const handleSavePatient = async (patientData: Partial<Patient>) => {
    try {
      if (selectedPatient) {
        await updatePatient.mutateAsync({ id: selectedPatient.id, data: patientData });
      } else {
        await createPatient.mutateAsync(patientData);
      }
      handleBackToList();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const handleEditFromDetail = () => {
    if (selectedPatient) {
      setActiveView('edit');
    }
  };

  switch (activeView) {
    case 'new':
      return (
        <PatientFormPage
          onBack={handleBackToList}
          onSave={handleSavePatient}
        />
      );
    case 'edit':
      return (
        <PatientFormPage
          patient={selectedPatient || undefined}
          onBack={handleBackToList}
          onSave={handleSavePatient}
        />
      );
    case 'detail':
      return selectedPatient ? (
        <PatientDetailPage
          patient={selectedPatient}
          onBack={handleBackToList}
          onEdit={handleEditFromDetail}
        />
      ) : null;
    default:
      return (
        <PatientList
          onNewPatient={handleNewPatient}
          onEditPatient={handleEditPatient}
          onViewPatient={handleViewPatient}
        />
      );
  }
}
