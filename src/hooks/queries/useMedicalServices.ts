import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MedicalServiceService } from '../../services/medical-services';
import { Tables, TablesInsert, TablesUpdate } from '../../integrations/supabase/types';

type MedicalService = Tables<'medical_services'>;
type MedicalServiceInsert = TablesInsert<'medical_services'>;
type MedicalServiceUpdate = TablesUpdate<'medical_services'>;

export const useMedicalServices = () => {
  return useQuery<MedicalService[]>({
    queryKey: ['medical-services'],
    queryFn: MedicalServiceService.getAll,
  });
};

export const useCreateMedicalService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: MedicalServiceInsert) => 
      MedicalServiceService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-services'] });
    },
  });
};

export const useUpdateMedicalService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MedicalServiceUpdate }) => 
      MedicalServiceService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-services'] });
    },
  });
};

export const useDeleteMedicalService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => MedicalServiceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-services'] });
    },
  });
};
