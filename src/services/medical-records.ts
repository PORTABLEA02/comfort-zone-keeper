import { supabase } from '../lib/supabase';
import { Tables, TablesInsert, TablesUpdate } from '../integrations/supabase/types';
import { logger } from '../lib/logger';

type MedicalRecord = Tables<'medical_records'>;
type MedicalRecordInsert = TablesInsert<'medical_records'>;
type MedicalRecordUpdate = TablesUpdate<'medical_records'>;
type Prescription = Tables<'prescriptions'>;
type PrescriptionInsert = TablesInsert<'prescriptions'>;

export class MedicalRecordService {
  static async getAll(): Promise<MedicalRecord[]> {
    logger.log('🔍 MedicalRecordService.getAll()');
    const { data, error } = await supabase
      .from('medical_records')
      .select(`
        *,
        patient:patients(first_name, last_name, phone),
        doctor:profiles!doctor_id(first_name, last_name, speciality),
        prescriptions(*)
      `)
      .order('date', { ascending: false });

    if (error) {
      logger.error('❌ MedicalRecordService.getAll():', error);
      throw error;
    }

    return data || [];
  }

  static async getById(id: string): Promise<MedicalRecord | null> {
    logger.log('🔍 MedicalRecordService.getById():', id);
    const { data, error } = await supabase
      .from('medical_records')
      .select(`
        *,
        patient:patients(first_name, last_name, phone),
        doctor:profiles!doctor_id(first_name, last_name, speciality),
        prescriptions(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      logger.error('❌ MedicalRecordService.getById():', error);
      throw error;
    }

    return data;
  }

  static async getByPatient(patientId: string): Promise<MedicalRecord[]> {
    logger.log('🔍 MedicalRecordService.getByPatient():', patientId);
    const { data, error } = await supabase
      .from('medical_records')
      .select(`
        *,
        doctor:profiles!doctor_id(first_name, last_name, speciality),
        prescriptions(*)
      `)
      .eq('patient_id', patientId)
      .order('date', { ascending: false });

    if (error) {
      logger.error('❌ MedicalRecordService.getByPatient():', error);
      throw error;
    }

    return data || [];
  }

  static async getByDoctor(doctorId: string): Promise<MedicalRecord[]> {
    logger.log('🔍 MedicalRecordService.getByDoctor():', doctorId);
    const { data, error } = await supabase
      .from('medical_records')
      .select(`
        *,
        patient:patients(first_name, last_name, phone),
        prescriptions(*)
      `)
      .eq('doctor_id', doctorId)
      .order('date', { ascending: false });

    if (error) {
      logger.error('❌ MedicalRecordService.getByDoctor():', error);
      throw error;
    }

    return data || [];
  }

  static async create(
    recordData: MedicalRecordInsert,
    prescriptions: Omit<PrescriptionInsert, 'medical_record_id'>[] = []
  ): Promise<MedicalRecord> {
    logger.log('🔍 MedicalRecordService.create()');
    const { data: record, error: recordError } = await supabase
      .from('medical_records')
      .insert(recordData)
      .select()
      .single();

    if (recordError) {
      logger.error('❌ MedicalRecordService.create():', recordError);
      throw recordError;
    }

    if (prescriptions.length > 0) {
      const { error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert(
          prescriptions.map(prescription => ({
            ...prescription,
            medical_record_id: record.id
          }))
        );

      if (prescriptionError) {
        logger.error('❌ MedicalRecordService.create() prescriptions:', prescriptionError);
      }
    }

    logger.log('✅ MedicalRecordService.create():', record.id);
    return record;
  }

  static async update(id: string, updates: MedicalRecordUpdate): Promise<MedicalRecord> {
    logger.log('🔍 MedicalRecordService.update():', id);
    const { data, error } = await supabase
      .from('medical_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('❌ MedicalRecordService.update():', error);
      throw error;
    }

    return data;
  }

  static async delete(id: string): Promise<void> {
    logger.log('🔍 MedicalRecordService.delete():', id);
    const { error } = await supabase
      .from('medical_records')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('❌ MedicalRecordService.delete():', error);
      throw error;
    }
  }

  static async addPrescription(medicalRecordId: string, prescription: Omit<PrescriptionInsert, 'medical_record_id'>): Promise<Prescription> {
    logger.log('🔍 MedicalRecordService.addPrescription():', medicalRecordId);
    const { data, error } = await supabase
      .from('prescriptions')
      .insert({
        ...prescription,
        medical_record_id: medicalRecordId
      })
      .select()
      .single();

    if (error) {
      logger.error('❌ MedicalRecordService.addPrescription():', error);
      throw error;
    }

    return {
      ...data,
      created_at: data.created_at || new Date().toISOString()
    };
  }

  static async deletePrescription(prescriptionId: string): Promise<void> {
    logger.log('🔍 MedicalRecordService.deletePrescription():', prescriptionId);
    const { error } = await supabase
      .from('prescriptions')
      .delete()
      .eq('id', prescriptionId);

    if (error) {
      logger.error('❌ MedicalRecordService.deletePrescription():', error);
      throw error;
    }
  }

  static async search(query: string): Promise<MedicalRecord[]> {
    logger.log('🔍 MedicalRecordService.search():', query);
    const { data, error } = await supabase
      .from('medical_records')
      .select(`
        *,
        patient:patients(first_name, last_name, phone),
        doctor:profiles!doctor_id(first_name, last_name, speciality),
        prescriptions(*)
      `)
      .or(`reason.ilike.%${query}%,diagnosis.ilike.%${query}%,symptoms.ilike.%${query}%`)
      .order('date', { ascending: false });

    if (error) {
      logger.error('❌ MedicalRecordService.search():', error);
      throw error;
    }

    return data || [];
  }

  // === MÉTHODES POUR LES CONTRÔLES ===

  static async getControlsForConsultation(consultationId: string): Promise<MedicalRecord[]> {
    logger.log('🔍 MedicalRecordService.getControlsForConsultation():', consultationId);
    const { data, error } = await supabase
      .from('medical_records')
      .select(`
        *,
        patient:patients(first_name, last_name, phone),
        doctor:profiles!doctor_id(first_name, last_name, speciality),
        prescriptions(*)
      `)
      .eq('parent_consultation_id', consultationId)
      .eq('is_control', true)
      .order('date', { ascending: false });

    if (error) {
      logger.error('❌ MedicalRecordService.getControlsForConsultation():', error);
      throw error;
    }

    return data || [];
  }

  static async createControl(
    parentConsultationId: string,
    recordData: Partial<MedicalRecordInsert> & Pick<MedicalRecordInsert, 'patient_id' | 'doctor_id' | 'date' | 'type' | 'reason' | 'diagnosis'>,
    prescriptions: Omit<PrescriptionInsert, 'medical_record_id'>[] = []
  ): Promise<MedicalRecord> {
    logger.log('🔍 MedicalRecordService.createControl() for parent:', parentConsultationId);
    logger.log('📝 Control data with vitals:', { 
      symptoms: recordData.symptoms?.substring(0, 50),
      physical_examination: recordData.physical_examination?.substring(0, 50)
    });
    
    const controlData: MedicalRecordInsert = {
      ...recordData,
      is_control: true,
      parent_consultation_id: parentConsultationId,
      symptoms: recordData.symptoms || null,
      physical_examination: recordData.physical_examination || null,
      notes: recordData.notes || null,
      previous_treatment: recordData.previous_treatment || null
    };

    const { data: record, error: recordError } = await supabase
      .from('medical_records')
      .insert(controlData)
      .select()
      .single();

    if (recordError) {
      logger.error('❌ MedicalRecordService.createControl():', recordError);
      throw recordError;
    }

    if (prescriptions.length > 0) {
      const { error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert(
          prescriptions.map(prescription => ({
            ...prescription,
            medical_record_id: record.id
          }))
        );

      if (prescriptionError) {
        logger.error('❌ MedicalRecordService.createControl() prescriptions:', prescriptionError);
      }
    }

    logger.log('✅ MedicalRecordService.createControl():', record.id);
    return record;
  }

  static async getParentConsultation(controlId: string): Promise<MedicalRecord | null> {
    logger.log('🔍 MedicalRecordService.getParentConsultation():', controlId);
    
    // D'abord récupérer le contrôle pour obtenir parent_consultation_id
    const { data: control, error: controlError } = await supabase
      .from('medical_records')
      .select('parent_consultation_id')
      .eq('id', controlId)
      .single();

    if (controlError || !control?.parent_consultation_id) {
      logger.error('❌ MedicalRecordService.getParentConsultation():', controlError);
      return null;
    }

    // Récupérer la consultation parente
    return this.getById(control.parent_consultation_id);
  }

  static async getPendingControlsForDoctor(doctorId: string): Promise<MedicalRecord[]> {
    logger.log('🔍 MedicalRecordService.getPendingControlsForDoctor():', doctorId);
    const { data, error } = await supabase
      .from('medical_records')
      .select(`
        *,
        patient:patients(first_name, last_name, phone, blood_type, allergies),
        doctor:profiles!doctor_id(first_name, last_name, speciality),
        parent:medical_records!parent_consultation_id(reason, diagnosis)
      `)
      .eq('is_control', true)
      .eq('doctor_id', doctorId)
      .eq('diagnosis', 'En attente de la consultation de contrôle')
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('❌ MedicalRecordService.getPendingControlsForDoctor():', error);
      throw error;
    }

    return data || [];
  }
}
