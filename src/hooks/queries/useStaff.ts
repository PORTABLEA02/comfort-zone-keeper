import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ProfileService } from '../../services/profiles';
import { Database } from '../../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export const STAFF_QUERY_KEY = ['staff'];
export const DOCTORS_QUERY_KEY = ['doctors'];

export function useStaff() {
  return useQuery({
    queryKey: STAFF_QUERY_KEY,
    queryFn: () => ProfileService.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useDoctors() {
  return useQuery({
    queryKey: DOCTORS_QUERY_KEY,
    queryFn: () => ProfileService.getDoctors(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Profile> }) =>
      ProfileService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: STAFF_QUERY_KEY });
      await queryClient.cancelQueries({ queryKey: DOCTORS_QUERY_KEY });
      
      const previousStaff = queryClient.getQueryData<Profile[]>(STAFF_QUERY_KEY);
      const previousDoctors = queryClient.getQueryData<Profile[]>(DOCTORS_QUERY_KEY);
      
      queryClient.setQueryData<Profile[]>(STAFF_QUERY_KEY, (old) =>
        old?.map((staff) =>
          staff.id === id
            ? { ...staff, ...data, updated_at: new Date().toISOString() }
            : staff
        )
      );
      
      queryClient.setQueryData<Profile[]>(DOCTORS_QUERY_KEY, (old) =>
        old?.map((doctor) =>
          doctor.id === id
            ? { ...doctor, ...data, updated_at: new Date().toISOString() }
            : doctor
        )
      );
      
      return { previousStaff, previousDoctors };
    },
    onError: (error, _, context) => {
      console.error('Error updating staff:', error);
      if (context?.previousStaff) {
        queryClient.setQueryData(STAFF_QUERY_KEY, context.previousStaff);
      }
      if (context?.previousDoctors) {
        queryClient.setQueryData(DOCTORS_QUERY_KEY, context.previousDoctors);
      }
      toast.error('Erreur lors de la mise à jour du personnel');
    },
    onSuccess: () => {
      toast.success('Personnel mis à jour avec succès');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: DOCTORS_QUERY_KEY });
    },
  });
}

export function useToggleStaffStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      ProfileService.update(id, { is_active: isActive }),
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: STAFF_QUERY_KEY });
      await queryClient.cancelQueries({ queryKey: DOCTORS_QUERY_KEY });
      
      const previousStaff = queryClient.getQueryData<Profile[]>(STAFF_QUERY_KEY);
      const previousDoctors = queryClient.getQueryData<Profile[]>(DOCTORS_QUERY_KEY);
      
      queryClient.setQueryData<Profile[]>(STAFF_QUERY_KEY, (old) =>
        old?.map((staff) =>
          staff.id === id
            ? { ...staff, is_active: isActive, updated_at: new Date().toISOString() }
            : staff
        )
      );
      
      queryClient.setQueryData<Profile[]>(DOCTORS_QUERY_KEY, (old) =>
        old?.map((doctor) =>
          doctor.id === id
            ? { ...doctor, is_active: isActive, updated_at: new Date().toISOString() }
            : doctor
        )
      );
      
      return { previousStaff, previousDoctors };
    },
    onError: (error, _, context) => {
      console.error('Error toggling staff status:', error);
      if (context?.previousStaff) {
        queryClient.setQueryData(STAFF_QUERY_KEY, context.previousStaff);
      }
      if (context?.previousDoctors) {
        queryClient.setQueryData(DOCTORS_QUERY_KEY, context.previousDoctors);
      }
      toast.error('Erreur lors de la mise à jour du statut');
    },
    onSuccess: (_, variables) => {
      toast.success(`Personnel ${variables.isActive ? 'activé' : 'désactivé'} avec succès`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: DOCTORS_QUERY_KEY });
    },
  });
}
