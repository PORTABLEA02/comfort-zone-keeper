import { supabase } from '../lib/supabase';
import { Tables, TablesInsert, TablesUpdate } from '../integrations/supabase/types';

type MedicalService = Tables<'medical_services'>;
type MedicalServiceInsert = TablesInsert<'medical_services'>;
type MedicalServiceUpdate = TablesUpdate<'medical_services'>;

export class MedicalServiceService {
  // Récupérer tous les services médicaux
  static async getAll(): Promise<MedicalService[]> {
    console.log('🔍 MedicalServiceService.getAll() - Début de la récupération des services médicaux');
    const { data, error } = await supabase
      .from('medical_services')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ MedicalServiceService.getAll() - Erreur lors de la récupération des services médicaux:', error);
      throw error;
    }

    console.log('✅ MedicalServiceService.getAll() - Services médicaux récupérés avec succès:', data?.length || 0, 'services');
    return data || [];
  }

  // Récupérer les services par catégorie
  static async getByCategory(category: string): Promise<MedicalService[]> {
    console.log('🔍 MedicalServiceService.getByCategory() - Récupération des services de la catégorie:', category);
    const { data, error } = await supabase
      .from('medical_services')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ MedicalServiceService.getByCategory() - Erreur lors de la récupération des services par catégorie:', error);
      throw error;
    }

    console.log('✅ MedicalServiceService.getByCategory() - Services de la catégorie récupérés:', data?.length || 0, 'services');
    return data || [];
  }

  // Récupérer les services par département
  static async getByDepartment(department: string): Promise<MedicalService[]> {
    console.log('🔍 MedicalServiceService.getByDepartment() - Récupération des services du département:', department);
    const { data, error } = await supabase
      .from('medical_services')
      .select('*')
      .eq('department', department)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ MedicalServiceService.getByDepartment() - Erreur lors de la récupération des services par département:', error);
      throw error;
    }

    console.log('✅ MedicalServiceService.getByDepartment() - Services du département récupérés:', data?.length || 0, 'services');
    return data || [];
  }

  // Créer un nouveau service médical
  static async create(service: MedicalServiceInsert): Promise<MedicalService> {
    console.log('🔍 MedicalServiceService.create() - Création d\'un nouveau service médical:', service.name);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('medical_services')
      .insert({
        ...service,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('❌ MedicalServiceService.create() - Erreur lors de la création du service médical:', error);
      throw error;
    }

    console.log('✅ MedicalServiceService.create() - Service médical créé avec succès:', data.id, data.name);
    return data;
  }

  // Mettre à jour un service médical
  static async update(id: string, updates: MedicalServiceUpdate): Promise<MedicalService> {
    console.log('🔍 MedicalServiceService.update() - Mise à jour du service médical ID:', id);
    const { data, error } = await supabase
      .from('medical_services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ MedicalServiceService.update() - Erreur lors de la mise à jour du service médical:', error);
      throw error;
    }

    console.log('✅ MedicalServiceService.update() - Service médical mis à jour avec succès:', data.id, data.name);
    return data;
  }

  // Supprimer un service médical (suppression logique)
  static async delete(id: string): Promise<void> {
    console.log('🔍 MedicalServiceService.delete() - Suppression logique du service médical ID:', id);
    const { error } = await supabase
      .from('medical_services')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('❌ MedicalServiceService.delete() - Erreur lors de la suppression du service médical:', error);
      throw error;
    }
    
    console.log('✅ MedicalServiceService.delete() - Service médical désactivé avec succès:', id);
  }

  // Rechercher des services médicaux
  static async search(query: string): Promise<MedicalService[]> {
    console.log('🔍 MedicalServiceService.search() - Recherche de services médicaux avec la requête:', query);
    const { data, error } = await supabase
      .from('medical_services')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,department.ilike.%${query}%`)
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ MedicalServiceService.search() - Erreur lors de la recherche de services médicaux:', error);
      throw error;
    }

    console.log('✅ MedicalServiceService.search() - Recherche terminée:', data?.length || 0, 'services trouvés');
    return data || [];
  }

  // Récupérer les services compatibles avec un médecin
  static async getCompatibleServices(doctorId: string): Promise<MedicalService[]> {
    console.log('🔍 MedicalServiceService.getCompatibleServices() - Récupération des services compatibles pour le médecin:', doctorId);
    
    // Récupérer d'abord les informations du médecin
    const { data: doctor, error: doctorError } = await supabase
      .from('profiles')
      .select('speciality')
      .eq('id', doctorId)
      .single();

    if (doctorError) {
      console.error('❌ MedicalServiceService.getCompatibleServices() - Erreur lors de la récupération du médecin:', doctorError);
      throw doctorError;
    }

    // Récupérer les services compatibles
    const { data, error } = await supabase
      .from('medical_services')
      .select('*')
      .eq('is_active', true)
      .or(`requires_doctor.eq.false,doctor_speciality.is.null,doctor_speciality.ilike.%${doctor?.speciality || ''}%`)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ MedicalServiceService.getCompatibleServices() - Erreur lors de la récupération des services compatibles:', error);
      throw error;
    }

    console.log('✅ MedicalServiceService.getCompatibleServices() - Services compatibles récupérés:', data?.length || 0, 'services');
    return data || [];
  }

  // Récupérer les statistiques des services
  static async getStats() {
    console.log('🔍 MedicalServiceService.getStats() - Récupération des statistiques des services médicaux');
    const { data: services, error } = await supabase
      .from('medical_services')
      .select('category, base_price, is_active');

    if (error) {
      console.error('❌ MedicalServiceService.getStats() - Erreur lors de la récupération des statistiques:', error);
      throw error;
    }

    const totalServices = services?.length || 0;
    const activeServices = services?.filter(s => s.is_active).length || 0;
    const averagePrice = services?.reduce((sum, s) => sum + s.base_price, 0) / Math.max(1, totalServices) || 0;
    
    const categoryCounts = services?.reduce((acc, service) => {
      acc[service.category] = (acc[service.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const stats = {
      totalServices,
      activeServices,
      inactiveServices: totalServices - activeServices,
      averagePrice,
      categoryCounts
    };
    
    console.log('✅ MedicalServiceService.getStats() - Statistiques des services médicaux récupérées:', stats);
    return stats;
  }
}