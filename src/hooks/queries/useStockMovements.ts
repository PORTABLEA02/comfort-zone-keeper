import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '../../integrations/supabase/client';
import { Database } from '../../lib/database.types';
import { MEDICINES_QUERY_KEY } from './useMedicines';

type StockMovement = Database['public']['Tables']['stock_movements']['Row'];

export const STOCK_MOVEMENTS_QUERY_KEY = ['stock-movements'];

export const useStockMovements = (medicineId?: string) => {
  return useQuery<StockMovement[]>({
    queryKey: medicineId ? [...STOCK_MOVEMENTS_QUERY_KEY, medicineId] : STOCK_MOVEMENTS_QUERY_KEY,
    queryFn: async () => {
      let query = supabase
        .from('stock_movements')
        .select('*')
        .order('date', { ascending: false });
      
      if (medicineId) {
        query = query.eq('medicine_id', medicineId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as StockMovement[];
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
};

export const useCreateStockMovement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (movement: Omit<StockMovement, 'id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('stock_movements')
        .insert({
          ...movement,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async (newMovement) => {
      await queryClient.cancelQueries({ queryKey: STOCK_MOVEMENTS_QUERY_KEY });
      await queryClient.cancelQueries({ queryKey: MEDICINES_QUERY_KEY });
      
      const previousMovements = queryClient.getQueryData<StockMovement[]>(STOCK_MOVEMENTS_QUERY_KEY);
      const previousMedicines = queryClient.getQueryData<any[]>(MEDICINES_QUERY_KEY);
      
      const optimisticMovement: StockMovement = {
        id: `temp-${Date.now()}`,
        medicine_id: newMovement.medicine_id,
        type: newMovement.type,
        quantity: newMovement.quantity,
        reason: newMovement.reason,
        reference: newMovement.reference || null,
        date: newMovement.date,
        user_id: newMovement.user_id,
        created_at: new Date().toISOString(),
      };
      
      // Update stock movements list
      queryClient.setQueryData<StockMovement[]>(STOCK_MOVEMENTS_QUERY_KEY, (old) =>
        old ? [optimisticMovement, ...old] : [optimisticMovement]
      );
      
      // Optimistically update medicine stock
      if (previousMedicines) {
        queryClient.setQueryData<any[]>(MEDICINES_QUERY_KEY, (old) =>
          old?.map((medicine) => {
            if (medicine.id === newMovement.medicine_id) {
              const stockChange = newMovement.type === 'in' ? newMovement.quantity : -newMovement.quantity;
              return {
                ...medicine,
                current_stock: medicine.current_stock + stockChange,
                updated_at: new Date().toISOString(),
              };
            }
            return medicine;
          })
        );
      }
      
      return { previousMovements, previousMedicines };
    },
    onError: (error, _, context) => {
      console.error('Error creating stock movement:', error);
      if (context?.previousMovements) {
        queryClient.setQueryData(STOCK_MOVEMENTS_QUERY_KEY, context.previousMovements);
      }
      if (context?.previousMedicines) {
        queryClient.setQueryData(MEDICINES_QUERY_KEY, context.previousMedicines);
      }
      toast.error('Erreur lors de l\'enregistrement du mouvement de stock');
    },
    onSuccess: () => {
      toast.success('Mouvement de stock enregistré avec succès');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: STOCK_MOVEMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MEDICINES_QUERY_KEY });
    },
  });
};
