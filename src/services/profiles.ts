import { supabase } from '../lib/supabase';
import { Tables, TablesUpdate } from '../integrations/supabase/types';
import { logger } from '../lib/logger';

type Profile = Tables<'profiles'>;
type ProfileUpdate = TablesUpdate<'profiles'>;

export class ProfileService {
  static async getAll(): Promise<Profile[]> {
    logger.log('🔍 ProfileService.getAll()');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('first_name', { ascending: true });

    if (error) {
      logger.error('❌ ProfileService.getAll():', error);
      throw error;
    }

    return data || [];
  }

  static async getByRole(role: 'admin' | 'doctor' | 'secretary' | 'nurse'): Promise<Profile[]> {
    logger.log('🔍 ProfileService.getByRole():', role);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', role)
      .eq('is_active', true)
      .order('first_name', { ascending: true });

    if (error) {
      logger.error('❌ ProfileService.getByRole():', error);
      throw error;
    }

    return data || [];
  }

  static async getById(id: string): Promise<Profile | null> {
    logger.log('🔍 ProfileService.getById():', id);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logger.error('❌ ProfileService.getById():', error);
      return null;
    }

    return data;
  }

  static async update(id: string, updates: ProfileUpdate): Promise<Profile> {
    logger.log('🔍 ProfileService.update():', id);
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('❌ ProfileService.update():', error);
      throw error;
    }

    return data;
  }

  static async getDoctors(): Promise<Profile[]> {
    logger.log('🔍 ProfileService.getDoctors()');
    return this.getByRole('doctor');
  }

  static async getStats() {
    logger.log('🔍 ProfileService.getStats()');
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('role, is_active');

    if (error) {
      logger.error('❌ ProfileService.getStats():', error);
      throw error;
    }

    const total = profiles?.length || 0;
    const active = profiles?.filter(p => p.is_active).length || 0;
    const doctors = profiles?.filter(p => p.role === 'doctor').length || 0;
    const admins = profiles?.filter(p => p.role === 'admin').length || 0;
    const secretaries = profiles?.filter(p => p.role === 'secretary').length || 0;
    const nurses = profiles?.filter(p => p.role === 'nurse').length || 0;
    return {
      total,
      active,
      inactive: total - active,
      doctors,
      admins,
      secretaries,
      nurses
    };
  }
}
