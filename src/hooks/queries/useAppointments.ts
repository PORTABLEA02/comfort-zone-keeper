import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AppointmentService } from '../../services/appointments';
import { Database } from '../../lib/database.types';

type Appointment = Database['public']['Tables']['appointments']['Row'];

export const APPOINTMENTS_QUERY_KEY = ['appointments'];

export function useAppointments() {
  return useQuery({
    queryKey: APPOINTMENTS_QUERY_KEY,
    queryFn: () => AppointmentService.getAll(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Appointment>) => AppointmentService.create(data as any),
    onMutate: async (newAppointment) => {
      await queryClient.cancelQueries({ queryKey: APPOINTMENTS_QUERY_KEY });
      const previousAppointments = queryClient.getQueryData<Appointment[]>(APPOINTMENTS_QUERY_KEY);
      
      const optimisticAppointment: Appointment = {
        id: `temp-${Date.now()}`,
        patient_id: newAppointment.patient_id || '',
        doctor_id: newAppointment.doctor_id || '',
        date: newAppointment.date || '',
        time: newAppointment.time || '',
        duration: newAppointment.duration || 30,
        reason: newAppointment.reason || '',
        status: newAppointment.status || 'scheduled',
        notes: newAppointment.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
      };
      
      queryClient.setQueryData<Appointment[]>(APPOINTMENTS_QUERY_KEY, (old) =>
        old ? [optimisticAppointment, ...old] : [optimisticAppointment]
      );
      
      return { previousAppointments };
    },
    onError: (error, _, context) => {
      console.error('Error creating appointment:', error);
      if (context?.previousAppointments) {
        queryClient.setQueryData(APPOINTMENTS_QUERY_KEY, context.previousAppointments);
      }
      toast.error('Erreur lors de la création du rendez-vous');
    },
    onSuccess: () => {
      toast.success('Rendez-vous créé avec succès');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Appointment> }) =>
      AppointmentService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: APPOINTMENTS_QUERY_KEY });
      const previousAppointments = queryClient.getQueryData<Appointment[]>(APPOINTMENTS_QUERY_KEY);
      
      queryClient.setQueryData<Appointment[]>(APPOINTMENTS_QUERY_KEY, (old) =>
        old?.map((appointment) =>
          appointment.id === id
            ? { ...appointment, ...data, updated_at: new Date().toISOString() }
            : appointment
        )
      );
      
      return { previousAppointments };
    },
    onError: (error, _, context) => {
      console.error('Error updating appointment:', error);
      if (context?.previousAppointments) {
        queryClient.setQueryData(APPOINTMENTS_QUERY_KEY, context.previousAppointments);
      }
      toast.error('Erreur lors de la mise à jour du rendez-vous');
    },
    onSuccess: () => {
      toast.success('Rendez-vous mis à jour avec succès');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => AppointmentService.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: APPOINTMENTS_QUERY_KEY });
      const previousAppointments = queryClient.getQueryData<Appointment[]>(APPOINTMENTS_QUERY_KEY);
      
      queryClient.setQueryData<Appointment[]>(APPOINTMENTS_QUERY_KEY, (old) =>
        old?.filter((appointment) => appointment.id !== id)
      );
      
      return { previousAppointments };
    },
    onError: (error, _, context) => {
      console.error('Error deleting appointment:', error);
      if (context?.previousAppointments) {
        queryClient.setQueryData(APPOINTMENTS_QUERY_KEY, context.previousAppointments);
      }
      toast.error('Erreur lors de la suppression du rendez-vous');
    },
    onSuccess: () => {
      toast.success('Rendez-vous supprimé avec succès');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY });
    },
  });
}
