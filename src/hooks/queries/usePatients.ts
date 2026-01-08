import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PatientService } from '../../services/patients';
import { Database } from '../../lib/database.types';

type Patient = Database['public']['Tables']['patients']['Row'];

export const PATIENTS_QUERY_KEY = ['patients'];

export function usePatients() {
  return useQuery({
    queryKey: PATIENTS_QUERY_KEY,
    queryFn: () => PatientService.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Patient>) => PatientService.create(data as any),
    onMutate: async (newPatient) => {
      await queryClient.cancelQueries({ queryKey: PATIENTS_QUERY_KEY });
      const previousPatients = queryClient.getQueryData<Patient[]>(PATIENTS_QUERY_KEY);
      
      const optimisticPatient: Patient = {
        id: `temp-${Date.now()}`,
        first_name: newPatient.first_name || '',
        last_name: newPatient.last_name || '',
        date_of_birth: newPatient.date_of_birth || '',
        gender: newPatient.gender || 'M',
        phone: newPatient.phone || '',
        email: newPatient.email || null,
        address: newPatient.address || '',
        emergency_contact: newPatient.emergency_contact || '',
        blood_type: newPatient.blood_type || null,
        allergies: newPatient.allergies || [],
        medical_history: newPatient.medical_history || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
      };
      
      queryClient.setQueryData<Patient[]>(PATIENTS_QUERY_KEY, (old) => 
        old ? [optimisticPatient, ...old] : [optimisticPatient]
      );
      
      return { previousPatients };
    },
    onError: (error, _, context) => {
      console.error('Error creating patient:', error);
      if (context?.previousPatients) {
        queryClient.setQueryData(PATIENTS_QUERY_KEY, context.previousPatients);
      }
      toast.error('Erreur lors de la création du patient');
    },
    onSuccess: () => {
      toast.success('Patient créé avec succès');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Patient> }) => 
      PatientService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: PATIENTS_QUERY_KEY });
      const previousPatients = queryClient.getQueryData<Patient[]>(PATIENTS_QUERY_KEY);
      
      queryClient.setQueryData<Patient[]>(PATIENTS_QUERY_KEY, (old) =>
        old?.map((patient) =>
          patient.id === id
            ? { ...patient, ...data, updated_at: new Date().toISOString() }
            : patient
        )
      );
      
      return { previousPatients };
    },
    onError: (error, _, context) => {
      console.error('Error updating patient:', error);
      if (context?.previousPatients) {
        queryClient.setQueryData(PATIENTS_QUERY_KEY, context.previousPatients);
      }
      toast.error('Erreur lors de la mise à jour du patient');
    },
    onSuccess: () => {
      toast.success('Patient mis à jour avec succès');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY });
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => PatientService.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: PATIENTS_QUERY_KEY });
      const previousPatients = queryClient.getQueryData<Patient[]>(PATIENTS_QUERY_KEY);
      
      queryClient.setQueryData<Patient[]>(PATIENTS_QUERY_KEY, (old) =>
        old?.filter((patient) => patient.id !== id)
      );
      
      return { previousPatients };
    },
    onError: (error, _, context) => {
      console.error('Error deleting patient:', error);
      if (context?.previousPatients) {
        queryClient.setQueryData(PATIENTS_QUERY_KEY, context.previousPatients);
      }
      toast.error('Erreur lors de la suppression du patient');
    },
    onSuccess: () => {
      toast.success('Patient supprimé avec succès');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY });
    },
  });
}
