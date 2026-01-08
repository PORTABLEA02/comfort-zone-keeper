import { supabase } from '../lib/supabase';
import { Tables } from '../integrations/supabase/types';
import { logger } from '../lib/logger';

type Profile = Tables<'profiles'>;

interface CreateStaffData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'doctor' | 'secretary' | 'nurse';
  phone: string;
  speciality?: string;
  department?: string;
  hireDate?: string;
  salary?: number;
  workSchedule?: string;
  emergencyContact?: string;
  address?: string;
}

export class StaffService {
  static async createStaff(staffData: CreateStaffData): Promise<Profile> {
    logger.log('🔍 StaffService.createStaff():', staffData.email, staffData.role);
    
    try {
      const emailExists = await this.checkEmailExists(staffData.email);
      if (emailExists) {
        throw new Error('Cet email est déjà utilisé par un autre membre du personnel');
      }
      
      const apiUrl = 'https://dybmskhpgvbvcnunswjs.supabase.co/functions/v1/create-staff';
      
      const headers = {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5Ym1za2hwZ3ZidmNudW5zd2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTYyNzUsImV4cCI6MjA2OTQ3MjI3NX0.tBTqWogX7fz_rTy_Dabq5NEfieJMre9u4C_GwqkGozc',
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(staffData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('❌ StaffService.createStaff() response:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.details || errorData.error || `Erreur HTTP ${response.status}`);
        } catch (parseError) {
          throw new Error(`Erreur du serveur (${response.status}): ${errorText}`);
        }
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.details || result.error || 'Échec de la création du personnel');
      }

      logger.log('✅ StaffService.createStaff():', result.data.id);
      
      const profile: Profile = {
        id: result.data.id,
        email: result.data.email,
        first_name: result.data.firstName,
        last_name: result.data.lastName,
        role: result.data.role,
        phone: result.data.phone,
        speciality: result.data.speciality,
        department: result.data.department,
        hire_date: result.data.hireDate || new Date().toISOString().split('T')[0],
        salary: result.data.salary || null,
        work_schedule: result.data.workSchedule || 'Temps plein',
        emergency_contact: result.data.emergencyContact || null,
        address: result.data.address || null,
        is_active: result.data.isActive,
        created_at: result.data.createdAt,
        updated_at: result.data.createdAt
      };

      return profile;
    } catch (error) {
      logger.error('❌ StaffService.createStaff() exception:', error);
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion internet et réessayez.');
      }
      
      throw error;
    }
  }

  static async checkEmailExists(email: string): Promise<boolean> {
    logger.log('🔍 StaffService.checkEmailExists():', email);
    
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('email', email.trim().toLowerCase())

    if (error) {
      logger.error('❌ StaffService.checkEmailExists():', error);
      return false;
    }

    return (count || 0) > 0;
  }

  static generateTemporaryPassword(): string {
    const adjectives = ['Secure', 'Strong', 'Safe', 'Quick', 'Smart'];
    const numbers = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    return `${adjective}${numbers}`;
  }

  static generateEmail(firstName: string, lastName: string): string {
    const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
    const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
    const domain = 'clinic.local';
    return `${cleanFirst}.${cleanLast}@${domain}`;
  }
}
