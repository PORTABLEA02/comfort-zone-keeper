import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { InvoiceService } from '../../services/invoices';
import { Database } from '../../lib/database.types';

// Types avec cast temporaire pour le nouveau type 'treatment'
type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  invoice_type?: 'ordinary' | 'general-consultation' | 'gynecological-consultation' | 'treatment' | null;
};
type InvoiceInsert = Omit<Database['public']['Tables']['invoices']['Insert'], 'invoice_type'> & {
  invoice_type?: 'ordinary' | 'general-consultation' | 'gynecological-consultation' | 'treatment' | null;
};
type InvoiceUpdate = Omit<Database['public']['Tables']['invoices']['Update'], 'invoice_type'> & {
  invoice_type?: 'ordinary' | 'general-consultation' | 'gynecological-consultation' | 'treatment' | null;
};
type PaymentInsert = Database['public']['Tables']['payments']['Insert'];

export const INVOICES_QUERY_KEY = ['invoices'];

export function useInvoices() {
  return useQuery({
    queryKey: INVOICES_QUERY_KEY,
    queryFn: () => InvoiceService.getAll(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ invoice, items }: { 
      invoice: InvoiceInsert; 
      items: Array<Omit<Database['public']['Tables']['invoice_items']['Insert'], 'invoice_id'>>
    }) => InvoiceService.create(invoice as any, items),
    onMutate: async ({ invoice }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: INVOICES_QUERY_KEY });
      
      // Snapshot previous value
      const previousInvoices = queryClient.getQueryData<Invoice[]>(INVOICES_QUERY_KEY);
      
      // Optimistically update
      const tempId = `temp-${Date.now()}`;
      const optimisticInvoice: Invoice = {
        id: tempId,
        patient_id: invoice.patient_id!,
        date: invoice.date!,
        subtotal: invoice.subtotal || 0,
        tax: invoice.tax || 0,
        total: invoice.total || 0,
        status: invoice.status || 'pending',
        payment_method: invoice.payment_method || null,
        paid_at: invoice.paid_at || null,
        invoice_type: (invoice.invoice_type || 'ordinary') as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null
      };
      
      queryClient.setQueryData<Invoice[]>(
        INVOICES_QUERY_KEY,
        (old) => old ? [optimisticInvoice, ...old] : [optimisticInvoice]
      );
      
      return { previousInvoices };
    },
    onError: (error: any, _variables, context) => {
      // Rollback on error
      if (context?.previousInvoices) {
        queryClient.setQueryData(INVOICES_QUERY_KEY, context.previousInvoices);
      }
      console.error('Error creating invoice:', error);
      toast.error(error.message || 'Erreur lors de la création de la facture');
    },
    onSuccess: () => {
      toast.success('Facture créée avec succès');
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: InvoiceUpdate }) =>
      InvoiceService.update(id, data as any),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: INVOICES_QUERY_KEY });
      
      // Snapshot previous value
      const previousInvoices = queryClient.getQueryData<Invoice[]>(INVOICES_QUERY_KEY);
      
      // Optimistically update
      queryClient.setQueryData<Invoice[]>(
        INVOICES_QUERY_KEY,
        (old) => old ? old.map(invoice => 
          invoice.id === id 
            ? { ...invoice, ...data, updated_at: new Date().toISOString() } as Invoice
            : invoice
        ) : []
      );
      
      return { previousInvoices };
    },
    onError: (error: any, _variables, context) => {
      // Rollback on error
      if (context?.previousInvoices) {
        queryClient.setQueryData(INVOICES_QUERY_KEY, context.previousInvoices);
      }
      console.error('Error updating invoice:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour de la facture');
    },
    onSuccess: () => {
      toast.success('Facture mise à jour avec succès');
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
    },
  });
}

export function useAddPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (paymentData: PaymentInsert) => InvoiceService.addPayment(paymentData),
    onMutate: async (paymentData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: INVOICES_QUERY_KEY });
      
      // Snapshot previous value
      const previousInvoices = queryClient.getQueryData<Invoice[]>(INVOICES_QUERY_KEY);
      
      // Optimistically update invoice status
      queryClient.setQueryData<Invoice[]>(
        INVOICES_QUERY_KEY,
        (old) => old ? old.map(invoice => 
          invoice.id === paymentData.invoice_id
            ? { 
                ...invoice, 
                status: 'paid' as const,
                payment_method: paymentData.payment_method,
                paid_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            : invoice
        ) : []
      );
      
      return { previousInvoices };
    },
    onError: (error: any, _variables, context) => {
      // Rollback on error
      if (context?.previousInvoices) {
        queryClient.setQueryData(INVOICES_QUERY_KEY, context.previousInvoices);
      }
      console.error('Error adding payment:', error);
      toast.error(error.message || 'Erreur lors de l\'enregistrement du paiement');
    },
    onSuccess: () => {
      toast.success('Paiement enregistré avec succès');
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
      // Invalider aussi le cache du dashboard pour mettre à jour les stats
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Invalider le cache des workflows de consultation car un paiement peut créer un workflow
      queryClient.invalidateQueries({ queryKey: ['consultation-workflows'] });
    },
  });
}
