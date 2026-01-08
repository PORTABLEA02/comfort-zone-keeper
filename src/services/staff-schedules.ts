import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type StaffSchedule = Database['public']['Tables']['staff_schedules']['Row'];
type StaffScheduleInsert = Database['public']['Tables']['staff_schedules']['Insert'];
type StaffScheduleUpdate = Database['public']['Tables']['staff_schedules']['Update'];

export class StaffScheduleService {
  // Récupérer tous les plannings
  static async getAll(): Promise<StaffSchedule[]> {
    console.log('🔍 StaffScheduleService.getAll() - Début de la récupération des plannings');
    const { data, error } = await supabase
      .from('staff_schedules')
      .select(`
        *,
        staff:profiles!staff_id(first_name, last_name, role, department, speciality)
      `)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('❌ StaffScheduleService.getAll() - Erreur lors de la récupération des plannings:', error);
      throw error;
    }

    console.log('✅ StaffScheduleService.getAll() - Plannings récupérés avec succès:', data?.length || 0, 'plannings');
    return (data || []).map(schedule => ({ ...schedule, status: schedule.status || 'scheduled' })) as StaffSchedule[];
  }

  // Récupérer les plannings par date
  static async getByDate(date: string): Promise<StaffSchedule[]> {
    console.log('🔍 StaffScheduleService.getByDate() - Récupération des plannings pour la date:', date);
    const { data, error } = await supabase
      .from('staff_schedules')
      .select(`
        *,
        staff:profiles!staff_id(first_name, last_name, role, department, speciality)
      `)
      .eq('date', date)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('❌ StaffScheduleService.getByDate() - Erreur lors de la récupération des plannings par date:', error);
      throw error;
    }

    console.log('✅ StaffScheduleService.getByDate() - Plannings récupérés pour', date, ':', data?.length || 0, 'plannings');
    return (data || []).map(schedule => ({ ...schedule, status: schedule.status || 'scheduled' })) as StaffSchedule[];
  }

  // Récupérer les plannings d'une semaine
  static async getByWeek(startDate: string): Promise<StaffSchedule[]> {
    console.log('🔍 StaffScheduleService.getByWeek() - Récupération des plannings pour la semaine du:', startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    const { data, error } = await supabase
      .from('staff_schedules')
      .select(`
        *,
        staff:profiles!staff_id(first_name, last_name, role, department, speciality)
      `)
      .gte('date', startDate)
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('❌ StaffScheduleService.getByWeek() - Erreur lors de la récupération des plannings de la semaine:', error);
      throw error;
    }

    console.log('✅ StaffScheduleService.getByWeek() - Plannings de la semaine récupérés:', data?.length || 0, 'plannings');
    return (data || []).map(schedule => ({ ...schedule, status: schedule.status || 'scheduled' })) as StaffSchedule[];
  }

  // Récupérer les plannings d'un membre du personnel
  static async getByStaff(staffId: string, startDate?: string, endDate?: string): Promise<StaffSchedule[]> {
    console.log('🔍 StaffScheduleService.getByStaff() - Récupération des plannings du personnel:', staffId);
    let query = supabase
      .from('staff_schedules')
      .select(`
        *,
        staff:profiles!staff_id(first_name, last_name, role, department, speciality)
      `)
      .eq('staff_id', staffId);

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('❌ StaffScheduleService.getByStaff() - Erreur lors de la récupération des plannings du personnel:', error);
      throw error;
    }

    console.log('✅ StaffScheduleService.getByStaff() - Plannings du personnel récupérés:', data?.length || 0, 'plannings');
    return (data || []).map(schedule => ({ ...schedule, status: schedule.status || 'scheduled' })) as StaffSchedule[];
  }

  // Créer un nouveau planning
  static async create(schedule: StaffScheduleInsert): Promise<StaffSchedule> {
    console.log('🔍 StaffScheduleService.create() - Création d\'un nouveau planning:', schedule);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('staff_schedules')
      .insert({
        ...schedule,
        created_by: user?.id
      })
      .select(`
        *,
        staff:profiles!staff_id(first_name, last_name, role, department, speciality)
      `)
      .single();

    if (error) {
      console.error('❌ StaffScheduleService.create() - Erreur lors de la création du planning:', error);
      throw error;
    }

    console.log('✅ StaffScheduleService.create() - Planning créé avec succès:', data.id);
    return { ...data, status: data.status || 'scheduled' } as StaffSchedule;
  }

  // Mettre à jour un planning
  static async update(id: string, updates: StaffScheduleUpdate): Promise<StaffSchedule> {
    console.log('🔍 StaffScheduleService.update() - Mise à jour du planning ID:', id);
    const { data, error } = await supabase
      .from('staff_schedules')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        staff:profiles!staff_id(first_name, last_name, role, department, speciality)
      `)
      .single();

    if (error) {
      console.error('❌ StaffScheduleService.update() - Erreur lors de la mise à jour du planning:', error);
      throw error;
    }

    console.log('✅ StaffScheduleService.update() - Planning mis à jour avec succès:', data.id);
    return { ...data, status: data.status || 'scheduled' } as StaffSchedule;
  }

  // Supprimer un planning
  static async delete(id: string): Promise<void> {
    console.log('🔍 StaffScheduleService.delete() - Suppression du planning ID:', id);
    const { error } = await supabase
      .from('staff_schedules')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ StaffScheduleService.delete() - Erreur lors de la suppression du planning:', error);
      throw error;
    }
    
    console.log('✅ StaffScheduleService.delete() - Planning supprimé avec succès:', id);
  }

  // Vérifier les conflits d'horaires
  static async checkConflicts(
    staffId: string, 
    date: string, 
    startTime: string, 
    endTime: string,
    excludeScheduleId?: string
  ): Promise<boolean> {
    console.log('🔍 StaffScheduleService.checkConflicts() - Vérification des conflits pour:', { staffId, date, startTime, endTime });
    
    let query = supabase
      .from('staff_schedules')
      .select('id, start_time, end_time')
      .eq('staff_id', staffId)
      .eq('date', date)
      .neq('status', 'absent');

    if (excludeScheduleId) {
      query = query.neq('id', excludeScheduleId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ StaffScheduleService.checkConflicts() - Erreur lors de la vérification des conflits:', error);
      return false;
    }

    // Vérifier les chevauchements d'horaires
    const requestedStart = new Date(`2000-01-01T${startTime}`);
    const requestedEnd = new Date(`2000-01-01T${endTime}`);

    for (const schedule of data || []) {
      const existingStart = new Date(`2000-01-01T${schedule.start_time}`);
      const existingEnd = new Date(`2000-01-01T${schedule.end_time}`);

      // Vérifier le chevauchement
      if (requestedStart < existingEnd && requestedEnd > existingStart) {
        console.log('❌ StaffScheduleService.checkConflicts() - Conflit détecté avec le planning:', schedule.id);
        return true;
      }
    }

    console.log('✅ StaffScheduleService.checkConflicts() - Aucun conflit détecté');
    return false;
  }

  // Récupérer les statistiques des plannings
  static async getStats() {
    console.log('🔍 StaffScheduleService.getStats() - Récupération des statistiques des plannings');
    const today = new Date().toISOString().split('T')[0];
    
    const { data: schedules, error } = await supabase
      .from('staff_schedules')
      .select('status, date, shift');

    if (error) {
      console.error('❌ StaffScheduleService.getStats() - Erreur lors de la récupération des statistiques:', error);
      throw error;
    }

    const todaySchedules = schedules?.filter(s => s.date === today) || [];
    
    const stats = {
      total: schedules?.length || 0,
      today: todaySchedules.length,
      scheduled: schedules?.filter(s => s.status === 'scheduled').length || 0,
      confirmed: schedules?.filter(s => s.status === 'confirmed').length || 0,
      completed: schedules?.filter(s => s.status === 'completed').length || 0,
      absent: schedules?.filter(s => s.status === 'absent').length || 0,
      todayConfirmed: todaySchedules.filter(s => s.status === 'confirmed').length,
      todayPending: todaySchedules.filter(s => s.status === 'scheduled').length
    };

    console.log('✅ StaffScheduleService.getStats() - Statistiques des plannings récupérées:', stats);
    return stats;
  }
}