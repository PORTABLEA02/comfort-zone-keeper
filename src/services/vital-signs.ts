import { supabase } from '../lib/supabase';
import { Tables, TablesInsert, TablesUpdate } from '../integrations/supabase/types';
import { logger } from '../lib/logger';

type VitalSigns = Tables<'vital_signs'>;
type VitalSignsInsert = TablesInsert<'vital_signs'>;
type VitalSignsUpdate = TablesUpdate<'vital_signs'>;

export class VitalSignsService {
  static async getByPatient(patientId: string): Promise<VitalSigns[]> {
    logger.log('🔍 VitalSignsService.getByPatient():', patientId);
    const { data, error } = await supabase
      .from('vital_signs')
      .select(`
        *,
        recorded_by_profile:profiles!recorded_by(first_name, last_name)
      `)
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: false });

    if (error) {
      logger.error('❌ VitalSignsService.getByPatient():', error);
      throw error;
    }

    return data || [];
  }

  static async getLatestByPatient(patientId: string): Promise<VitalSigns | null> {
    logger.log('🔍 VitalSignsService.getLatestByPatient():', patientId);
    const { data, error } = await supabase
      .from('vital_signs')
      .select('*')
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('❌ VitalSignsService.getLatestByPatient():', error);
      throw error;
    }

    return data || null;
  }

  static async create(vitalSigns: VitalSignsInsert): Promise<VitalSigns> {
    logger.log('🔍 VitalSignsService.create()');
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('vital_signs')
      .insert({
        ...vitalSigns,
        recorded_by: user?.id || vitalSigns.recorded_by
      })
      .select()
      .single();

    if (error) {
      logger.error('❌ VitalSignsService.create():', error);
      throw error;
    }

    logger.log('✅ VitalSignsService.create():', data.id);
    return data;
  }

  static async update(id: string, updates: VitalSignsUpdate): Promise<VitalSigns> {
    logger.log('🔍 VitalSignsService.update():', id);
    const { data, error } = await supabase
      .from('vital_signs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('❌ VitalSignsService.update():', error);
      throw error;
    }

    return data;
  }

  static async delete(id: string): Promise<void> {
    logger.log('🔍 VitalSignsService.delete():', id);
    const { error } = await supabase
      .from('vital_signs')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('❌ VitalSignsService.delete():', error);
      throw error;
    }
  }

  static calculateBMI(weight: number, height: number): number {
    if (weight <= 0 || height <= 0) return 0;
    const heightInMeters = height / 100;
    return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
  }

  static interpretBMI(bmi: number): string {
    if (bmi < 18.5) return 'Insuffisance pondérale';
    if (bmi < 25) return 'Poids normal';
    if (bmi < 30) return 'Surpoids';
    return 'Obésité';
  }

  static interpretBloodPressure(systolic: number, diastolic: number): string {
    if (systolic < 90 || diastolic < 60) return 'Hypotension';
    if (systolic < 120 && diastolic < 80) return 'Normale';
    if (systolic < 130 && diastolic < 80) return 'Élevée';
    if (systolic < 140 || diastolic < 90) return 'Hypertension stade 1';
    return 'Hypertension stade 2';
  }
}
