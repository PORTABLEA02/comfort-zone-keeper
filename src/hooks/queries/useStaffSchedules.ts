import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { StaffScheduleService } from '../../services/staff-schedules';
import { Database } from '../../lib/database.types';

type StaffSchedule = Database['public']['Tables']['staff_schedules']['Row'];
type StaffScheduleInsert = Database['public']['Tables']['staff_schedules']['Insert'];
type StaffScheduleUpdate = Database['public']['Tables']['staff_schedules']['Update'];

export const STAFF_SCHEDULES_QUERY_KEY = ['staff-schedules'];

export function useStaffSchedules(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: [...STAFF_SCHEDULES_QUERY_KEY, startDate, endDate],
    queryFn: () => {
      if (startDate) {
        return StaffScheduleService.getByWeek(startDate);
      }
      return StaffScheduleService.getAll();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useStaffSchedulesByStaff(staffId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: [...STAFF_SCHEDULES_QUERY_KEY, 'staff', staffId, startDate, endDate],
    queryFn: () => StaffScheduleService.getByStaff(staffId, startDate, endDate),
    staleTime: 1000 * 60 * 5,
  });
}

export function useStaffSchedulesByDate(date: string) {
  return useQuery({
    queryKey: [...STAFF_SCHEDULES_QUERY_KEY, 'date', date],
    queryFn: () => StaffScheduleService.getByDate(date),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateStaffSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: StaffScheduleInsert) => StaffScheduleService.create(data),
    onMutate: async (newSchedule) => {
      await queryClient.cancelQueries({ queryKey: STAFF_SCHEDULES_QUERY_KEY });
      
      const optimisticSchedule: StaffSchedule = {
        id: `temp-${Date.now()}`,
        staff_id: newSchedule.staff_id,
        date: newSchedule.date,
        start_time: newSchedule.start_time,
        end_time: newSchedule.end_time,
        shift: newSchedule.shift,
        status: newSchedule.status || 'scheduled',
        created_at: new Date().toISOString(),
        created_by: newSchedule.created_by || null,
      };
      
      // Update all related queries
      queryClient.setQueriesData<StaffSchedule[]>(
        { queryKey: STAFF_SCHEDULES_QUERY_KEY },
        (old) => old ? [optimisticSchedule, ...old] : [optimisticSchedule]
      );
      
      return { optimisticSchedule };
    },
    onError: (error) => {
      console.error('Error creating schedule:', error);
      queryClient.invalidateQueries({ queryKey: STAFF_SCHEDULES_QUERY_KEY });
      toast.error('Erreur lors de la création du planning');
    },
    onSuccess: () => {
      toast.success('Planning créé avec succès');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_SCHEDULES_QUERY_KEY });
    },
  });
}

export function useUpdateStaffSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StaffScheduleUpdate }) =>
      StaffScheduleService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: STAFF_SCHEDULES_QUERY_KEY });
      
      // Update all related queries
      queryClient.setQueriesData<StaffSchedule[]>(
        { queryKey: STAFF_SCHEDULES_QUERY_KEY },
        (old) => old?.map((schedule) =>
          schedule.id === id ? { ...schedule, ...data } : schedule
        )
      );
      
      return { id };
    },
    onError: (error) => {
      console.error('Error updating schedule:', error);
      queryClient.invalidateQueries({ queryKey: STAFF_SCHEDULES_QUERY_KEY });
      toast.error('Erreur lors de la mise à jour du planning');
    },
    onSuccess: () => {
      toast.success('Planning mis à jour avec succès');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_SCHEDULES_QUERY_KEY });
    },
  });
}

export function useDeleteStaffSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => StaffScheduleService.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: STAFF_SCHEDULES_QUERY_KEY });
      
      // Update all related queries
      queryClient.setQueriesData<StaffSchedule[]>(
        { queryKey: STAFF_SCHEDULES_QUERY_KEY },
        (old) => old?.filter((schedule) => schedule.id !== id)
      );
      
      return { id };
    },
    onError: (error) => {
      console.error('Error deleting schedule:', error);
      queryClient.invalidateQueries({ queryKey: STAFF_SCHEDULES_QUERY_KEY });
      toast.error('Erreur lors de la suppression du planning');
    },
    onSuccess: () => {
      toast.success('Planning supprimé avec succès');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_SCHEDULES_QUERY_KEY });
    },
  });
}

export function useCheckScheduleConflict() {
  return useMutation({
    mutationFn: async ({
      staffId,
      date,
      startTime,
      endTime,
      excludeScheduleId,
    }: {
      staffId: string;
      date: string;
      startTime: string;
      endTime: string;
      excludeScheduleId?: string;
    }) => {
      const hasConflict = await StaffScheduleService.checkConflicts(
        staffId,
        date,
        startTime,
        endTime,
        excludeScheduleId
      );
      return hasConflict;
    },
    onError: (error) => {
      console.error('Error checking conflicts:', error);
      toast.error('Erreur lors de la vérification des conflits');
    },
  });
}
