import { supabase } from '../lib/supabase';
import { Tables, TablesInsert, TablesUpdate } from '../integrations/supabase/types';
import { logger } from '../lib/logger';

type Patient = Tables<'patients'>;
type PatientInsert = TablesInsert<'patients'>;
type PatientUpdate = TablesUpdate<'patients'>;

export class PatientService {
  static async getAll(): Promise<Patient[]> {
    logger.log('🔍 PatientService.getAll()');
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('first_name', { ascending: true });

    if (error) {
      logger.error('❌ PatientService.getAll():', error);
      throw error;
    }

    logger.log('✅ PatientService.getAll():', data?.length || 0);
    return data || [];
  }

  static async getById(id: string): Promise<Patient | null> {
    logger.log('🔍 PatientService.getById():', id);
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logger.error('❌ PatientService.getById():', error);
      return null;
    }

    return data;
  }

  static async create(patient: PatientInsert): Promise<Patient> {
    logger.log('🔍 PatientService.create()');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id) {
      throw new Error('Vous devez être connecté pour créer un patient');
    }
    
    if (!patient.first_name?.trim() || !patient.last_name?.trim()) {
      throw new Error('Le nom et le prénom sont requis');
    }
    
    if (!patient.phone?.trim()) {
      throw new Error('Le numéro de téléphone est requis');
    }
    
    const { data, error } = await supabase
      .from('patients')
      .insert({
        ...patient,
        first_name: patient.first_name.trim(),
        last_name: patient.last_name.trim(),
        phone: patient.phone.trim(),
        email: patient.email?.trim() || null,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      logger.error('❌ PatientService.create():', error);
      if (error.code === '23505') {
        throw new Error('Un patient avec ces informations existe déjà');
      }
      throw error;
    }

    logger.log('✅ PatientService.create():', data.id);
    return data;
  }

  static async update(id: string, updates: PatientUpdate): Promise<Patient> {
    logger.log('🔍 PatientService.update():', id);
    const { data, error } = await supabase
      .from('patients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('❌ PatientService.update():', error);
      throw error;
    }

    return data;
  }

  static async delete(id: string): Promise<void> {
    logger.log('🔍 PatientService.delete():', id);
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('❌ PatientService.delete():', error);
      throw error;
    }
  }

  static async search(query: string): Promise<Patient[]> {
    logger.log('🔍 PatientService.search():', query);
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('first_name', { ascending: true });

    if (error) {
      logger.error('❌ PatientService.search():', error);
      throw error;
    }

    return data || [];
  }

  static async getWithMedicalHistory(patientId: string) {
    logger.log('🔍 PatientService.getWithMedicalHistory():', patientId);
    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        medical_records (
          *,
          prescriptions (*),
          profiles:doctor_id (first_name, last_name, speciality)
        )
      `)
      .eq('id', patientId)
      .single();

    if (error) {
      logger.error('❌ PatientService.getWithMedicalHistory():', error);
      throw error;
    }

    return data;
  }
}
