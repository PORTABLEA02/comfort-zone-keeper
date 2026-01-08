import { supabase } from '../lib/supabase';
import { Tables, TablesInsert, TablesUpdate } from '../integrations/supabase/types';
import { logger } from '../lib/logger';

type Appointment = Tables<'appointments'>;
type AppointmentInsert = TablesInsert<'appointments'>;
type AppointmentUpdate = TablesUpdate<'appointments'>;

export class AppointmentService {
  static async getAll(): Promise<Appointment[]> {
    logger.log('🔍 AppointmentService.getAll()');
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(first_name, last_name, phone),
        doctor:profiles!doctor_id(first_name, last_name, speciality)
      `)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      logger.error('❌ AppointmentService.getAll():', error);
      throw error;
    }

    return data || [];
  }

  static async getById(id: string): Promise<Appointment | null> {
    logger.log('🔍 AppointmentService.getById():', id);
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(first_name, last_name, phone),
        doctor:profiles!doctor_id(first_name, last_name, speciality)
      `)
      .eq('id', id)
      .single();

    if (error) {
      logger.error('❌ AppointmentService.getById():', error);
      throw error;
    }

    return data;
  }

  static async getByDate(date: string): Promise<Appointment[]> {
    logger.log('🔍 AppointmentService.getByDate():', date);
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(first_name, last_name, phone),
        doctor:profiles!doctor_id(first_name, last_name, speciality)
      `)
      .eq('date', date)
      .order('time', { ascending: true });

    if (error) {
      logger.error('❌ AppointmentService.getByDate():', error);
      throw error;
    }

    return data || [];
  }

  static async getByDoctor(doctorId: string, date?: string): Promise<Appointment[]> {
    logger.log('🔍 AppointmentService.getByDoctor():', doctorId);
    let query = supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(first_name, last_name, phone)
      `)
      .eq('doctor_id', doctorId);

    if (date) {
      query = query.eq('date', date);
    }

    const { data, error } = await query
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      logger.error('❌ AppointmentService.getByDoctor():', error);
      throw error;
    }

    return data || [];
  }

  static async getByPatient(patientId: string): Promise<Appointment[]> {
    logger.log('🔍 AppointmentService.getByPatient():', patientId);
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        doctor:profiles!doctor_id(first_name, last_name, speciality)
      `)
      .eq('patient_id', patientId)
      .order('date', { ascending: false });

    if (error) {
      logger.error('❌ AppointmentService.getByPatient():', error);
      throw error;
    }

    return data || [];
  }

  static async create(appointment: AppointmentInsert): Promise<Appointment> {
    logger.log('🔍 AppointmentService.create()');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id) {
      throw new Error('Vous devez être connecté pour créer un rendez-vous');
    }
    
    if (!appointment.patient_id) {
      throw new Error('Veuillez sélectionner un patient');
    }
    
    if (!appointment.doctor_id) {
      throw new Error('Veuillez sélectionner un médecin');
    }
    
    if (!appointment.date || !appointment.time) {
      throw new Error('Veuillez spécifier la date et l\'heure du rendez-vous');
    }
    
    const isAvailable = await this.checkAvailability(
      appointment.doctor_id,
      appointment.date,
      appointment.time,
      appointment.duration || 30
    );
    
    if (!isAvailable) {
      throw new Error('Ce créneau n\'est pas disponible. Veuillez en choisir un autre.');
    }
    
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        ...appointment,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      logger.error('❌ AppointmentService.create():', error);
      throw error;
    }

    logger.log('✅ AppointmentService.create():', data.id);
    return data;
  }

  static async update(id: string, updates: AppointmentUpdate): Promise<Appointment> {
    logger.log('🔍 AppointmentService.update():', id);
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('❌ AppointmentService.update():', error);
      throw error;
    }

    return data;
  }

  static async delete(id: string): Promise<void> {
    logger.log('🔍 AppointmentService.delete():', id);
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('❌ AppointmentService.delete():', error);
      throw error;
    }
  }

  static async checkAvailability(
    doctorId: string, 
    date: string, 
    time: string, 
    duration: number,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    logger.log('🔍 AppointmentService.checkAvailability()');
    let query = supabase
      .from('appointments')
      .select('id, time, duration')
      .eq('doctor_id', doctorId)
      .eq('date', date)
      .neq('status', 'cancelled');

    if (excludeAppointmentId) {
      query = query.neq('id', excludeAppointmentId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('❌ AppointmentService.checkAvailability():', error);
      return false;
    }

    const requestedStart = new Date(`2000-01-01T${time}`);
    const requestedEnd = new Date(requestedStart.getTime() + duration * 60000);

    for (const appointment of data || []) {
      const existingStart = new Date(`2000-01-01T${appointment.time}`);
      const existingEnd = new Date(existingStart.getTime() + appointment.duration * 60000);

      if (requestedStart < existingEnd && requestedEnd > existingStart) {
        return false;
      }
    }

    return true;
  }

  static async getStats() {
    logger.log('🔍 AppointmentService.getStats()');
    const today = new Date().toISOString().split('T')[0];
    
    const { data: todayAppointments, error: todayError } = await supabase
      .from('appointments')
      .select('id, status')
      .eq('date', today);

    const { data: totalAppointments, error: totalError } = await supabase
      .from('appointments')
      .select('id, status');

    if (todayError || totalError) {
      logger.error('❌ AppointmentService.getStats():', todayError || totalError);
      throw todayError || totalError;
    }

    return {
      today: {
        total: todayAppointments?.length || 0,
        confirmed: todayAppointments?.filter(a => a.status === 'confirmed').length || 0,
        pending: todayAppointments?.filter(a => a.status === 'scheduled').length || 0,
        completed: todayAppointments?.filter(a => a.status === 'completed').length || 0
      },
      total: {
        all: totalAppointments?.length || 0,
        thisMonth: totalAppointments?.length || 0
      }
    };
  }
}
