import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { MedicalRecordService } from '../../services/medical-records';
import { Database } from '../../lib/database.types';
import { supabase } from '../../integrations/supabase/client';

type MedicalRecord = Database['public']['Tables']['medical_records']['Row'];

export const CONSULTATIONS_QUERY_KEY = ['consultations'];
export const CONTROLS_QUERY_KEY = ['controls'];

export function useConsultations() {
  const queryClient = useQueryClient();

  // Écouter les changements en temps réel sur la table medical_records
  useEffect(() => {
    const channel = supabase
      .channel('medical-records-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medical_records'
        },
        (payload) => {
          console.log('🔄 Realtime: Changement détecté dans medical_records', payload);
          queryClient.invalidateQueries({ queryKey: CONSULTATIONS_QUERY_KEY });
          queryClient.invalidateQueries({ queryKey: CONTROLS_QUERY_KEY });
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Realtime: Déconnexion du canal medical_records');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: CONSULTATIONS_QUERY_KEY,
    queryFn: () => MedicalRecordService.getAll(),
    staleTime: 1000 * 60 * 3, // 3 minutes
    refetchOnMount: 'always', // Toujours rafraîchir lors du montage pour voir les nouvelles consultations
  });
}

export function useControlsForConsultation(consultationId: string | null) {
  return useQuery({
    queryKey: [...CONTROLS_QUERY_KEY, consultationId],
    queryFn: () => consultationId ? MedicalRecordService.getControlsForConsultation(consultationId) : Promise.resolve([]),
    enabled: !!consultationId,
    staleTime: 1000 * 60 * 3,
  });
}

export function useCreateConsultation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { record: Partial<MedicalRecord>; prescriptions?: any[] }) => 
      MedicalRecordService.create(data.record as any, data.prescriptions || []),
    onMutate: async ({ record }) => {
      await queryClient.cancelQueries({ queryKey: CONSULTATIONS_QUERY_KEY });
      const previousConsultations = queryClient.getQueryData<MedicalRecord[]>(CONSULTATIONS_QUERY_KEY);
      
      const optimisticConsultation: MedicalRecord = {
        id: `temp-${Date.now()}`,
        patient_id: record.patient_id || '',
        doctor_id: record.doctor_id || '',
        appointment_id: record.appointment_id || null,
        date: record.date || new Date().toISOString().split('T')[0],
        type: record.type || 'general',
        reason: record.reason || '',
        symptoms: record.symptoms || null,
        diagnosis: record.diagnosis || '',
        treatment: record.treatment || null,
        notes: record.notes || null,
        attachments: record.attachments || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        parent_consultation_id: null,
        is_control: false,
        previous_treatment: null,
        physical_examination: null,
        lab_orders: null,
      };
      
      queryClient.setQueryData<MedicalRecord[]>(CONSULTATIONS_QUERY_KEY, (old) =>
        old ? [optimisticConsultation, ...old] : [optimisticConsultation]
      );
      
      return { previousConsultations };
    },
    onError: (error, _, context) => {
      console.error('Error creating consultation:', error);
      if (context?.previousConsultations) {
        queryClient.setQueryData(CONSULTATIONS_QUERY_KEY, context.previousConsultations);
      }
      toast.error('Erreur lors de la création de la consultation');
    },
    onSuccess: () => {
      toast.success('Consultation créée avec succès');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CONSULTATIONS_QUERY_KEY });
    },
  });
}

export function useCreateControl() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { parentConsultationId: string; record: Partial<MedicalRecord>; prescriptions?: any[] }) => 
      MedicalRecordService.createControl(data.parentConsultationId, data.record as any, data.prescriptions || []),
    onError: (error) => {
      console.error('Error creating control:', error);
      toast.error('Erreur lors de la création du contrôle');
    },
    onSuccess: () => {
      toast.success('Contrôle créé avec succès');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CONSULTATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CONTROLS_QUERY_KEY });
    },
  });
}

export function useUpdateConsultation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MedicalRecord> }) =>
      MedicalRecordService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: CONSULTATIONS_QUERY_KEY });
      const previousConsultations = queryClient.getQueryData<MedicalRecord[]>(CONSULTATIONS_QUERY_KEY);
      
      queryClient.setQueryData<MedicalRecord[]>(CONSULTATIONS_QUERY_KEY, (old) =>
        old?.map((consultation) =>
          consultation.id === id
            ? { ...consultation, ...data, updated_at: new Date().toISOString() }
            : consultation
        )
      );
      
      return { previousConsultations };
    },
    onError: (error, _, context) => {
      console.error('Error updating consultation:', error);
      if (context?.previousConsultations) {
        queryClient.setQueryData(CONSULTATIONS_QUERY_KEY, context.previousConsultations);
      }
      toast.error('Erreur lors de la mise à jour de la consultation');
    },
    onSuccess: () => {
      toast.success('Consultation mise à jour avec succès');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CONSULTATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CONTROLS_QUERY_KEY });
    },
  });
}

export function useDeleteConsultation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => MedicalRecordService.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: CONSULTATIONS_QUERY_KEY });
      const previousConsultations = queryClient.getQueryData<MedicalRecord[]>(CONSULTATIONS_QUERY_KEY);
      
      queryClient.setQueryData<MedicalRecord[]>(CONSULTATIONS_QUERY_KEY, (old) =>
        old?.filter((consultation) => consultation.id !== id)
      );
      
      return { previousConsultations };
    },
    onError: (error, _, context) => {
      console.error('Error deleting consultation:', error);
      if (context?.previousConsultations) {
        queryClient.setQueryData(CONSULTATIONS_QUERY_KEY, context.previousConsultations);
      }
      toast.error('Erreur lors de la suppression de la consultation');
    },
    onSuccess: () => {
      toast.success('Consultation supprimée avec succès');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CONSULTATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CONTROLS_QUERY_KEY });
    },
  });
}
