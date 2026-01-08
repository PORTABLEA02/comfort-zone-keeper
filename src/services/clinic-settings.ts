import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export interface ClinicSettings {
  id?: string;
  clinic_name: string;
  address: string;
  phone: string;
  email: string;
  website: string | null;
  timezone: string;
  language: string;
  currency: string;
  working_hours_start: string;
  working_hours_end: string;
  lunch_start: string;
  lunch_end: string;
  working_days: string[];
  created_at?: string | null;
  updated_at?: string | null;
}

export class ClinicSettingsService {
  static async getSettings(): Promise<ClinicSettings | null> {
    logger.log('🔍 ClinicSettingsService.getSettings()');
    
    const { data, error } = await supabase
      .from('clinic_settings')
      .select('*')
      .limit(1);

    if (error) {
      logger.error('❌ ClinicSettingsService.getSettings():', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data[0];
  }

  static async createDefaultSettings(): Promise<ClinicSettings> {
    throw new Error('Aucun paramètre de clinique configuré. Veuillez configurer les paramètres via l\'interface d\'administration.');
  }

  static async updateSettings(settings: Partial<ClinicSettings>): Promise<ClinicSettings> {
    logger.log('🔍 ClinicSettingsService.updateSettings()');
    
    const { data: existingSettings } = await supabase
      .from('clinic_settings')
      .select('id')
      .limit(1);

    if (!existingSettings || existingSettings.length === 0) {
      const emptySettings = {
        clinic_name: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        timezone: 'Africa/Porto-Novo',
        language: 'fr',
        currency: 'FCFA',
        working_hours_start: '08:00',
        working_hours_end: '18:00',
        lunch_start: '12:00',
        lunch_end: '14:00',
        working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      };
      
      const { data, error } = await supabase
        .from('clinic_settings')
        .insert(emptySettings)
        .select()
        .single();

      if (error) {
        logger.error('❌ ClinicSettingsService.updateSettings() insert:', error);
        throw error;
      }

      return data;
    }

    const { data, error } = await supabase
      .from('clinic_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSettings[0].id)
      .select()
      .single();

    if (error) {
      logger.error('❌ ClinicSettingsService.updateSettings():', error);
      throw error;
    }

    return data;
  }

  static async resetToDefaults(): Promise<ClinicSettings> {
    logger.log('🔍 ClinicSettingsService.resetToDefaults()');
    
    const existingSettings = await this.getSettings();
    
    if (!existingSettings) {
      const emptySettings = {
        clinic_name: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        timezone: 'Africa/Porto-Novo',
        language: 'fr',
        currency: 'FCFA',
        working_hours_start: '08:00',
        working_hours_end: '18:00',
        lunch_start: '12:00',
        lunch_end: '14:00',
        working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      };
      
      const { data, error } = await supabase
        .from('clinic_settings')
        .insert(emptySettings)
        .select()
        .single();

      if (error) {
        logger.error('❌ ClinicSettingsService.resetToDefaults():', error);
        throw error;
      }

      return data;
    }
    
    return await this.updateSettings({
      clinic_name: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      timezone: 'Africa/Porto-Novo',
      language: 'fr',
      currency: 'FCFA',
      working_hours_start: '08:00',
      working_hours_end: '18:00',
      lunch_start: '12:00',
      lunch_end: '14:00',
      working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    });
  }
}
