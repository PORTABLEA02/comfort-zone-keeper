import { supabase } from '../lib/supabase';
import { Tables, TablesInsert, TablesUpdate } from '../integrations/supabase/types';
import { logger } from '../lib/logger';
import { queryClient } from '../lib/queryClient';
import { CONSULTATIONS_QUERY_KEY } from '../hooks/queries/useConsultations';

type ConsultationWorkflow = Tables<'consultation_workflows'>;
type ConsultationWorkflowInsert = TablesInsert<'consultation_workflows'>;
type ConsultationWorkflowUpdate = TablesUpdate<'consultation_workflows'>;

export class ConsultationWorkflowService {
  static async create(workflow: ConsultationWorkflowInsert): Promise<ConsultationWorkflow> {
    logger.log('🔍 ConsultationWorkflowService.create()');
    const { data: { user } } = await supabase.auth.getUser();
    
    const createdBy = user?.id || workflow.created_by;
    if (!createdBy) {
      throw new Error('Vous devez être connecté pour créer un workflow');
    }
    
    if (!workflow.patient_id) {
      throw new Error('L\'ID du patient est requis');
    }
    
    if (!workflow.invoice_id) {
      throw new Error('L\'ID de la facture est requis');
    }
    
    const { data, error } = await supabase
      .from('consultation_workflows')
      .insert({
        ...workflow,
        created_by: createdBy
      })
      .select()
      .single();

    if (error) {
      logger.error('❌ ConsultationWorkflowService.create():', error);
      throw error;
    }

    logger.log('✅ ConsultationWorkflowService.create():', data.id);
    return data;
  }

  static async update(id: string, updates: ConsultationWorkflowUpdate): Promise<ConsultationWorkflow> {
    logger.log('🔍 ConsultationWorkflowService.update():', id);
    
    if (updates.vital_signs_id && !updates.status) {
      updates.status = 'vitals-pending';
    }
    
    const { data, error } = await supabase
      .from('consultation_workflows')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('❌ ConsultationWorkflowService.update():', error);
      throw error;
    }

    return data;
  }

  static async getById(id: string): Promise<ConsultationWorkflow | null> {
    logger.log('🔍 ConsultationWorkflowService.getById():', id);
    const { data, error } = await supabase
      .from('consultation_workflows')
      .select(`
        *,
        patient:patients(first_name, last_name, phone),
        invoice:invoices(id, total, status),
        vital_signs:vital_signs(*),
        doctor:profiles!doctor_id(first_name, last_name, speciality)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('❌ ConsultationWorkflowService.getById():', error);
      throw error;
    }

    return data || null;
  }

  static async getAll(): Promise<ConsultationWorkflow[]> {
    logger.log('🔍 ConsultationWorkflowService.getAll()');
    const { data, error } = await supabase
      .from('consultation_workflows')
      .select(`
        *,
        patient:patients(first_name, last_name, phone),
        invoice:invoices(id, total, status),
        vital_signs:vital_signs(*),
        doctor:profiles!doctor_id(first_name, last_name, speciality)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('❌ ConsultationWorkflowService.getAll():', error);
      throw error;
    }

    return data || [];
  }

  static async getByStatus(status: string): Promise<ConsultationWorkflow[]> {
    logger.log('🔍 ConsultationWorkflowService.getByStatus():', status);
    const { data, error } = await supabase
      .from('consultation_workflows')
      .select(`
        *,
        patient:patients(first_name, last_name, phone),
        invoice:invoices(id, total, status),
        vital_signs:vital_signs(*),
        doctor:profiles!doctor_id(first_name, last_name, speciality)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('❌ ConsultationWorkflowService.getByStatus():', error);
      throw error;
    }

    return data || [];
  }

  static async getByDoctor(doctorId: string): Promise<ConsultationWorkflow[]> {
    logger.log('🔍 ConsultationWorkflowService.getByDoctor():', doctorId);
    const { data, error } = await supabase
      .from('consultation_workflows')
      .select(`
        *,
        patient:patients(first_name, last_name, phone, blood_type, allergies),
        invoice:invoices(id, total, status),
        vital_signs:vital_signs(*)
      `)
      .eq('doctor_id', doctorId)
      .in('status', ['consultation-ready', 'in-progress'])
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('❌ ConsultationWorkflowService.getByDoctor():', error);
      throw error;
    }

    return data || [];
  }

  static async assignDoctor(workflowId: string, doctorId: string): Promise<ConsultationWorkflow> {
    logger.log('🔍 ConsultationWorkflowService.assignDoctor():', workflowId, doctorId);
    return this.update(workflowId, {
      doctor_id: doctorId,
      status: 'consultation-ready'
    });
  }

  static async startConsultation(workflowId: string): Promise<ConsultationWorkflow> {
    logger.log('🔍 ConsultationWorkflowService.startConsultation():', workflowId);
    return this.update(workflowId, {
      status: 'in-progress'
    });
  }

  static async completeConsultation(workflowId: string): Promise<ConsultationWorkflow> {
    logger.log('🔍 ConsultationWorkflowService.completeConsultation():', workflowId);
    
    const { data: workflow, error: workflowError } = await supabase
      .from('consultation_workflows')
      .select(`
        *,
        patient:patients(*),
        vital_signs:vital_signs(*),
        doctor:profiles!doctor_id(*)
      `)
      .eq('id', workflowId)
      .single();

    if (workflowError || !workflow) {
      logger.error('❌ ConsultationWorkflowService.completeConsultation():', workflowError);
      throw workflowError || new Error('Workflow non trouvé');
    }

    const consultationData: TablesInsert<'medical_records'> = {
      patient_id: workflow.patient_id,
      doctor_id: workflow.doctor_id!,
      date: new Date().toISOString().split('T')[0],
      type: workflow.consultation_type,
      reason: `Consultation ${workflow.consultation_type === 'general' ? 'générale' : 'spécialisée'} - Workflow ${workflow.id}`,
      symptoms: workflow.vital_signs ? this.formatVitalSignsAsSymptoms(workflow.vital_signs) : '',
      diagnosis: 'Diagnostic à compléter',
      treatment: 'Traitement à définir',
      notes: `Consultation créée automatiquement depuis le workflow ${workflow.id}.`
    };

    const { error: consultationError } = await supabase
      .from('medical_records')
      .insert(consultationData)
      .select()
      .single();

    if (consultationError) {
      logger.warn('⚠️ ConsultationWorkflowService.completeConsultation() medical_record:', consultationError);
    } else {
      // Invalider le cache des consultations pour que la nouvelle consultation soit visible immédiatement
      queryClient.invalidateQueries({ queryKey: CONSULTATIONS_QUERY_KEY });
      logger.log('✅ ConsultationWorkflowService.completeConsultation() - Cache consultations invalidé');
    }

    return this.update(workflowId, {
      status: 'completed'
    });
  }

  private static formatVitalSignsAsSymptoms(vitalSigns: any): string {
    const symptoms = [];
    
    if (vitalSigns.temperature) {
      if (vitalSigns.temperature > 37.5) {
        symptoms.push(`Fièvre (${vitalSigns.temperature}°C)`);
      } else if (vitalSigns.temperature < 36) {
        symptoms.push(`Hypothermie (${vitalSigns.temperature}°C)`);
      } else {
        symptoms.push(`Température normale (${vitalSigns.temperature}°C)`);
      }
    }
    
    if (vitalSigns.blood_pressure_systolic && vitalSigns.blood_pressure_diastolic) {
      const systolic = vitalSigns.blood_pressure_systolic;
      const diastolic = vitalSigns.blood_pressure_diastolic;
      
      if (systolic > 140 || diastolic > 90) {
        symptoms.push(`Hypertension (${systolic}/${diastolic} mmHg)`);
      } else if (systolic < 90 || diastolic < 60) {
        symptoms.push(`Hypotension (${systolic}/${diastolic} mmHg)`);
      } else {
        symptoms.push(`Tension artérielle normale (${systolic}/${diastolic} mmHg)`);
      }
    }
    
    if (vitalSigns.heart_rate) {
      if (vitalSigns.heart_rate > 100) {
        symptoms.push(`Tachycardie (${vitalSigns.heart_rate} bpm)`);
      } else if (vitalSigns.heart_rate < 60) {
        symptoms.push(`Bradycardie (${vitalSigns.heart_rate} bpm)`);
      } else {
        symptoms.push(`Fréquence cardiaque normale (${vitalSigns.heart_rate} bpm)`);
      }
    }
    
    if (vitalSigns.oxygen_saturation) {
      if (vitalSigns.oxygen_saturation < 95) {
        symptoms.push(`Désaturation (${vitalSigns.oxygen_saturation}%)`);
      } else {
        symptoms.push(`Saturation normale (${vitalSigns.oxygen_saturation}%)`);
      }
    }
    
    if (vitalSigns.weight && vitalSigns.height) {
      const heightInM = vitalSigns.height / 100;
      const bmi = vitalSigns.weight / (heightInM * heightInM);
      symptoms.push(`IMC: ${bmi.toFixed(1)} (Poids: ${vitalSigns.weight}kg, Taille: ${vitalSigns.height}cm)`);
    }
    
    if (vitalSigns.notes) {
      symptoms.push(`Notes: ${vitalSigns.notes}`);
    }
    
    return symptoms.length > 0 ? symptoms.join('. ') : 'Constantes vitales prises, aucune anomalie notable.';
  }

  static async getStats() {
    logger.log('🔍 ConsultationWorkflowService.getStats()');
    const { data: workflows, error } = await supabase
      .from('consultation_workflows')
      .select('status, created_at');

    if (error) {
      logger.error('❌ ConsultationWorkflowService.getStats():', error);
      throw error;
    }

    const today = new Date().toISOString().split('T')[0];
    const todayWorkflows = workflows?.filter(w => w.created_at && w.created_at.startsWith(today)) || [];

    return {
      total: workflows?.length || 0,
      today: todayWorkflows.length,
      paymentPending: workflows?.filter(w => w.status === 'payment-pending').length || 0,
      vitalsPending: workflows?.filter(w => w.status === 'vitals-pending').length || 0,
      doctorAssignment: workflows?.filter(w => w.status === 'doctor-assignment').length || 0,
      consultationReady: workflows?.filter(w => w.status === 'consultation-ready').length || 0,
      inProgress: workflows?.filter(w => w.status === 'in-progress').length || 0,
      completed: workflows?.filter(w => w.status === 'completed').length || 0
    };
  }

  static async getByInvoiceId(invoiceId: string): Promise<ConsultationWorkflow | null> {
    logger.log('🔍 ConsultationWorkflowService.getByInvoiceId():', invoiceId);
    const { data, error } = await supabase
      .from('consultation_workflows')
      .select(`
        *,
        patient:patients(first_name, last_name, phone),
        doctor:profiles!doctor_id(first_name, last_name, speciality),
        vital_signs:vital_signs(*)
      `)
      .eq('invoice_id', invoiceId)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('❌ ConsultationWorkflowService.getByInvoiceId():', error);
      throw error;
    }

    return data || null;
  }

  static async existsForInvoice(invoiceId: string): Promise<boolean> {
    logger.log('🔍 ConsultationWorkflowService.existsForInvoice():', invoiceId);
    const { data, error } = await supabase
      .from('consultation_workflows')
      .select('id')
      .eq('invoice_id', invoiceId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return false;
    }

    return !!data;
  }
}
