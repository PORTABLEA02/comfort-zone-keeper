import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MedicineService } from '../../services/medicines';
import { Database } from '../../lib/database.types';

type Medicine = Database['public']['Tables']['medicines']['Row'];

export const MEDICINES_QUERY_KEY = ['medicines'];

export const useMedicines = () => {
  return useQuery({
    queryKey: MEDICINES_QUERY_KEY,
    queryFn: MedicineService.getAll,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreateMedicine = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Medicine>) => MedicineService.create(data as any),
    onMutate: async (newMedicine) => {
      await queryClient.cancelQueries({ queryKey: MEDICINES_QUERY_KEY });
      const previousMedicines = queryClient.getQueryData<Medicine[]>(MEDICINES_QUERY_KEY);
      
      const optimisticMedicine: Medicine = {
        id: `temp-${Date.now()}`,
        name: newMedicine.name || '',
        category: newMedicine.category || 'medication',
        manufacturer: newMedicine.manufacturer || '',
        batch_number: newMedicine.batch_number || '',
        expiry_date: newMedicine.expiry_date || '',
        current_stock: newMedicine.current_stock || 0,
        min_stock: newMedicine.min_stock || 0,
        unit_price: newMedicine.unit_price || 0,
        location: newMedicine.location || '',
        unit: newMedicine.unit || '',
        description: newMedicine.description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
      };
      
      queryClient.setQueryData<Medicine[]>(MEDICINES_QUERY_KEY, (old) =>
        old ? [optimisticMedicine, ...old] : [optimisticMedicine]
      );
      
      return { previousMedicines };
    },
    onError: (error, _, context) => {
      console.error('Error creating medicine:', error);
      if (context?.previousMedicines) {
        queryClient.setQueryData(MEDICINES_QUERY_KEY, context.previousMedicines);
      }
      toast.error('Erreur lors de la création du produit');
    },
    onSuccess: () => {
      toast.success('Produit créé avec succès');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MEDICINES_QUERY_KEY });
    },
  });
};

export const useUpdateMedicine = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Medicine> }) => 
      MedicineService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: MEDICINES_QUERY_KEY });
      const previousMedicines = queryClient.getQueryData<Medicine[]>(MEDICINES_QUERY_KEY);
      
      queryClient.setQueryData<Medicine[]>(MEDICINES_QUERY_KEY, (old) =>
        old?.map((medicine) =>
          medicine.id === id
            ? { ...medicine, ...data, updated_at: new Date().toISOString() }
            : medicine
        )
      );
      
      return { previousMedicines };
    },
    onError: (error, _, context) => {
      console.error('Error updating medicine:', error);
      if (context?.previousMedicines) {
        queryClient.setQueryData(MEDICINES_QUERY_KEY, context.previousMedicines);
      }
      toast.error('Erreur lors de la mise à jour du produit');
    },
    onSuccess: () => {
      toast.success('Produit mis à jour avec succès');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MEDICINES_QUERY_KEY });
    },
  });
};

export const useDeleteMedicine = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => MedicineService.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: MEDICINES_QUERY_KEY });
      const previousMedicines = queryClient.getQueryData<Medicine[]>(MEDICINES_QUERY_KEY);
      
      queryClient.setQueryData<Medicine[]>(MEDICINES_QUERY_KEY, (old) =>
        old?.filter((medicine) => medicine.id !== id)
      );
      
      return { previousMedicines };
    },
    onError: (error, _, context) => {
      console.error('Error deleting medicine:', error);
      if (context?.previousMedicines) {
        queryClient.setQueryData(MEDICINES_QUERY_KEY, context.previousMedicines);
      }
      toast.error('Erreur lors de la suppression du produit');
    },
    onSuccess: () => {
      toast.success('Produit supprimé avec succès');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MEDICINES_QUERY_KEY });
    },
  });
};
