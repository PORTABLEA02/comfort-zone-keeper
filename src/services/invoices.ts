import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { logger } from '../lib/logger';

// Les types sont castés car la migration du nouveau type 'treatment' n'est pas encore synchronisée
type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  invoice_type?: 'ordinary' | 'general-consultation' | 'gynecological-consultation' | 'treatment' | null;
};
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
type InvoiceUpdate = Database['public']['Tables']['invoices']['Update'];
type InvoiceItemInsert = Database['public']['Tables']['invoice_items']['Insert'];
type Payment = Database['public']['Tables']['payments']['Row'];
type PaymentInsert = Database['public']['Tables']['payments']['Insert'];

export class InvoiceService {
  static async getAll(): Promise<Invoice[]> {
    logger.log('🔍 InvoiceService.getAll()');
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        patient:patients(first_name, last_name, phone),
        invoice_items(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('❌ InvoiceService.getAll():', error);
      throw error;
    }

    return (data || []) as Invoice[];
  }

  static async getById(id: string): Promise<Invoice | null> {
    logger.log('🔍 InvoiceService.getById():', id);
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        patient:patients(first_name, last_name, phone, email, address),
        invoice_items(*),
        payments(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      logger.error('❌ InvoiceService.getById():', error);
      return null;
    }

    return data as Invoice;
  }

  static async create(
    invoiceData: InvoiceInsert, 
    items: Omit<InvoiceItemInsert, 'invoice_id'>[]
  ): Promise<Invoice> {
    logger.log('🔍 InvoiceService.create()');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id) {
      throw new Error('Vous devez être connecté pour créer une facture');
    }
    
    if (!invoiceData.patient_id) {
      throw new Error('Veuillez sélectionner un patient');
    }
    
    if (!items || items.length === 0) {
      throw new Error('Veuillez ajouter au moins un élément à la facture');
    }
    
    const invoiceId = await this.generateInvoiceId();
    
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        ...invoiceData,
        id: invoiceId,
        invoice_type: invoiceData.invoice_type || 'ordinary',
        created_by: user?.id
      })
      .select()
      .single();

    if (invoiceError) {
      logger.error('❌ InvoiceService.create():', invoiceError);
      throw invoiceError;
    }

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(
        items.map(item => ({
          ...item,
          invoice_id: invoiceId
        }))
      );

    if (itemsError) {
      logger.error('❌ InvoiceService.create() items:', itemsError);
      throw itemsError;
    }

    if (invoiceData.status === 'paid') {
      try {
        await this.addPayment({
          invoice_id: invoiceId,
          amount: invoiceData.total || 0,
          payment_method: 'cash',
          payment_date: new Date().toISOString().split('T')[0],
          reference: `Paiement automatique - ${invoiceId}`,
          notes: 'Paiement enregistré automatiquement lors de la création de la facture'
        });
      } catch (paymentError) {
        logger.warn('⚠️ InvoiceService.create() auto-payment:', paymentError);
      }
    }

    logger.log('✅ InvoiceService.create():', invoice.id);
    return invoice as Invoice;
  }

  static async update(id: string, updates: InvoiceUpdate): Promise<Invoice> {
    logger.log('🔍 InvoiceService.update():', id);
    
    const { data: currentInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) {
      logger.error('❌ InvoiceService.update() fetch:', fetchError);
      throw fetchError;
    }

    if (currentInvoice?.status === 'paid') {
      throw new Error('Cette facture ne peut pas être modifiée car elle a déjà été payée.');
    }
    
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('❌ InvoiceService.update():', error);
      throw error;
    }

    return data as Invoice;
  }

  static async delete(id: string): Promise<void> {
    logger.log('🔍 InvoiceService.delete():', id);
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('❌ InvoiceService.delete():', error);
      throw error;
    }
  }

  static async addPayment(payment: PaymentInsert): Promise<Payment> {
    logger.log('🔍 InvoiceService.addPayment()');
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('payments')
      .insert({
        ...payment,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) {
      logger.error('❌ InvoiceService.addPayment():', error);
      throw error;
    }

    const { data: invoice } = await supabase
      .from('invoices')
      .select('total')
      .eq('id', payment.invoice_id)
      .single();

    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('invoice_id', payment.invoice_id);

    const totalPaid = (payments || []).reduce((sum, p) => sum + p.amount, 0);
    
    if (invoice && totalPaid >= invoice.total) {
      await supabase
        .from('invoices')
        .update({ 
          status: 'paid', 
          payment_method: payment.payment_method,
          paid_at: new Date().toISOString()
        })
        .eq('id', payment.invoice_id);
    }

    return {
      ...data,
      created_at: data.created_at || new Date().toISOString()
    };
  }

  static async generateInvoiceId(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    const { data, error } = await supabase
      .from('invoices')
      .select('id')
      .like('id', `INV-${year}-${month}%`)
      .order('id', { ascending: false })
      .limit(1);

    if (error) {
      logger.error('❌ InvoiceService.generateInvoiceId():', error);
    }
    
    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastId = data[0].id;
      const lastNumber = parseInt(lastId.slice(-3)) || 0;
      nextNumber = lastNumber + 1;
    }

    return `INV-${year}-${month}${String(nextNumber).padStart(3, '0')}`;
  }

  static async getBillingStats() {
    logger.log('🔍 InvoiceService.getBillingStats()');
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('total, status, created_at');

    if (error) {
      logger.error('❌ InvoiceService.getBillingStats():', error);
      throw error;
    }

    const totalRevenue = invoices?.reduce((sum, inv) => sum + inv.total, 0) || 0;
    const paidAmount = invoices?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0) || 0;
    const pendingAmount = invoices?.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.total, 0) || 0;
    const overdueAmount = invoices?.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.total, 0) || 0;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = invoices?.filter(inv => {
      if (!inv.created_at) return false;
      const invDate = new Date(inv.created_at);
      return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
    }).reduce((sum, inv) => sum + inv.total, 0) || 0;

    return {
      totalRevenue,
      paidAmount,
      pendingAmount,
      overdueAmount,
      monthlyRevenue,
      totalInvoices: invoices?.length || 0,
      paidInvoices: invoices?.filter(inv => inv.status === 'paid').length || 0
    };
  }
}
