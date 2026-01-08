import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export type TreatmentSessionStatus = 'pending' | 'completed' | 'cancelled' | 'missed';

export interface TreatmentSession {
  id: string;
  medical_record_id: string;
  patient_id: string;
  session_number: number;
  total_sessions: number | null;
  scheduled_date: string;
  performed_date: string | null;
  status: TreatmentSessionStatus;
  treatment_type: string;
  treatment_notes: string | null;
  observations: string | null;
  performed_by: string | null;
  vital_signs_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string;
}

export interface TreatmentSessionInsert {
  medical_record_id: string;
  patient_id: string;
  session_number?: number;
  total_sessions?: number | null;
  scheduled_date: string;
  treatment_type: string;
  treatment_notes?: string | null;
  created_by: string;
}

export interface TreatmentSessionUpdate {
  performed_date?: string | null;
  status?: TreatmentSessionStatus;
  treatment_notes?: string | null;
  observations?: string | null;
  performed_by?: string | null;
  vital_signs_id?: string | null;
}

export class TreatmentSessionsService {
  static async getAll(): Promise<TreatmentSession[]> {
    logger.log('🔍 TreatmentSessionsService.getAll()');
    const { data, error } = await supabase
      .from('treatment_sessions')
      .select('*')
      .order('scheduled_date', { ascending: true });

    if (error) {
      logger.error('❌ TreatmentSessionsService.getAll():', error);
      throw error;
    }

    return (data || []) as TreatmentSession[];
  }

  static async getByPatient(patientId: string): Promise<TreatmentSession[]> {
    logger.log('🔍 TreatmentSessionsService.getByPatient():', patientId);
    const { data, error } = await supabase
      .from('treatment_sessions')
      .select('*')
      .eq('patient_id', patientId)
      .order('scheduled_date', { ascending: true });

    if (error) {
      logger.error('❌ TreatmentSessionsService.getByPatient():', error);
      throw error;
    }

    return (data || []) as TreatmentSession[];
  }

  static async getByMedicalRecord(medicalRecordId: string): Promise<TreatmentSession[]> {
    logger.log('🔍 TreatmentSessionsService.getByMedicalRecord():', medicalRecordId);
    const { data, error } = await supabase
      .from('treatment_sessions')
      .select('*')
      .eq('medical_record_id', medicalRecordId)
      .order('session_number', { ascending: true });

    if (error) {
      logger.error('❌ TreatmentSessionsService.getByMedicalRecord():', error);
      throw error;
    }

    return (data || []) as TreatmentSession[];
  }

  static async getPending(): Promise<TreatmentSession[]> {
    logger.log('🔍 TreatmentSessionsService.getPending()');
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('treatment_sessions')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_date', today)
      .order('scheduled_date', { ascending: true });

    if (error) {
      logger.error('❌ TreatmentSessionsService.getPending():', error);
      throw error;
    }

    return (data || []) as TreatmentSession[];
  }

  static async getTodaySessions(): Promise<TreatmentSession[]> {
    logger.log('🔍 TreatmentSessionsService.getTodaySessions()');
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('treatment_sessions')
      .select('*')
      .eq('scheduled_date', today)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('❌ TreatmentSessionsService.getTodaySessions():', error);
      throw error;
    }

    return (data || []) as TreatmentSession[];
  }

  static async getUpcoming(): Promise<TreatmentSession[]> {
    logger.log('🔍 TreatmentSessionsService.getUpcoming()');
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('treatment_sessions')
      .select('*')
      .eq('status', 'pending')
      .gte('scheduled_date', today)
      .order('scheduled_date', { ascending: true })
      .limit(50);

    if (error) {
      logger.error('❌ TreatmentSessionsService.getUpcoming():', error);
      throw error;
    }

    return (data || []) as TreatmentSession[];
  }

  static async create(session: TreatmentSessionInsert): Promise<TreatmentSession> {
    logger.log('🔍 TreatmentSessionsService.create()');
    const { data, error } = await supabase
      .from('treatment_sessions')
      .insert(session)
      .select()
      .single();

    if (error) {
      logger.error('❌ TreatmentSessionsService.create():', error);
      throw error;
    }

    logger.log('✅ TreatmentSessionsService.create():', data.id);
    return data as TreatmentSession;
  }

  static async createMultiple(sessions: TreatmentSessionInsert[]): Promise<TreatmentSession[]> {
    logger.log('🔍 TreatmentSessionsService.createMultiple():', sessions.length);
    const { data, error } = await supabase
      .from('treatment_sessions')
      .insert(sessions)
      .select();

    if (error) {
      logger.error('❌ TreatmentSessionsService.createMultiple():', error);
      throw error;
    }

    logger.log('✅ TreatmentSessionsService.createMultiple():', data?.length);
    return (data || []) as TreatmentSession[];
  }

  static async update(id: string, updates: TreatmentSessionUpdate): Promise<TreatmentSession> {
    logger.log('🔍 TreatmentSessionsService.update():', id);
    const { data, error } = await supabase
      .from('treatment_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('❌ TreatmentSessionsService.update():', error);
      throw error;
    }

    logger.log('✅ TreatmentSessionsService.update():', data.id);
    return data as TreatmentSession;
  }

  static async markAsCompleted(
    id: string, 
    performedBy: string, 
    vitalSignsId?: string,
    notes?: string,
    observations?: string
  ): Promise<TreatmentSession> {
    logger.log('🔍 TreatmentSessionsService.markAsCompleted():', id);
    const { data, error } = await supabase
      .from('treatment_sessions')
      .update({
        status: 'completed',
        performed_date: new Date().toISOString(),
        performed_by: performedBy,
        vital_signs_id: vitalSignsId || null,
        treatment_notes: notes || null,
        observations: observations || null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('❌ TreatmentSessionsService.markAsCompleted():', error);
      throw error;
    }

    logger.log('✅ TreatmentSessionsService.markAsCompleted():', data.id);
    return data as TreatmentSession;
  }

  static async markAsMissed(id: string, notes?: string): Promise<TreatmentSession> {
    logger.log('🔍 TreatmentSessionsService.markAsMissed():', id);
    const { data, error } = await supabase
      .from('treatment_sessions')
      .update({
        status: 'missed',
        observations: notes || 'Patient absent'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('❌ TreatmentSessionsService.markAsMissed():', error);
      throw error;
    }

    return data as TreatmentSession;
  }

  static async cancel(id: string, reason?: string): Promise<TreatmentSession> {
    logger.log('🔍 TreatmentSessionsService.cancel():', id);
    const { data, error } = await supabase
      .from('treatment_sessions')
      .update({
        status: 'cancelled',
        observations: reason || 'Séance annulée'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('❌ TreatmentSessionsService.cancel():', error);
      throw error;
    }

    return data as TreatmentSession;
  }

  static async delete(id: string): Promise<void> {
    logger.log('🔍 TreatmentSessionsService.delete():', id);
    const { error } = await supabase
      .from('treatment_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('❌ TreatmentSessionsService.delete():', error);
      throw error;
    }
  }

  static async getStats(): Promise<{
    todayTotal: number;
    todayCompleted: number;
    todayPending: number;
    weekPending: number;
  }> {
    logger.log('🔍 TreatmentSessionsService.getStats()');
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const [todayData, weekData] = await Promise.all([
      supabase
        .from('treatment_sessions')
        .select('status')
        .eq('scheduled_date', today),
      supabase
        .from('treatment_sessions')
        .select('id')
        .eq('status', 'pending')
        .gte('scheduled_date', today)
        .lte('scheduled_date', nextWeekStr)
    ]);

    const todaySessions = todayData.data || [];
    return {
      todayTotal: todaySessions.length,
      todayCompleted: todaySessions.filter(s => s.status === 'completed').length,
      todayPending: todaySessions.filter(s => s.status === 'pending').length,
      weekPending: weekData.data?.length || 0
    };
  }
}
