import { supabase } from '../lib/supabase';
import { Tables, TablesInsert, TablesUpdate } from '../integrations/supabase/types';
import { logger } from '../lib/logger';

type Medicine = Tables<'medicines'>;
type MedicineInsert = TablesInsert<'medicines'>;
type MedicineUpdate = TablesUpdate<'medicines'>;
type StockMovement = Tables<'stock_movements'>;
type StockMovementInsert = TablesInsert<'stock_movements'>;

export class MedicineService {
  static async getAll(): Promise<Medicine[]> {
    logger.log('🔍 MedicineService.getAll()');
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      logger.error('❌ MedicineService.getAll():', error);
      throw error;
    }

    return data || [];
  }

  static async getByCategory(category: string): Promise<Medicine[]> {
    logger.log('🔍 MedicineService.getByCategory():', category);
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .eq('category', category as any)
      .order('name', { ascending: true });

    if (error) {
      logger.error('❌ MedicineService.getByCategory():', error);
      throw error;
    }

    return data || [];
  }

  static async getLowStock(): Promise<Medicine[]> {
    logger.log('🔍 MedicineService.getLowStock()');
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .filter('current_stock', 'lte', 'min_stock')
      .order('current_stock', { ascending: true });

    if (error) {
      logger.error('❌ MedicineService.getLowStock():', error);
      throw error;
    }

    return data || [];
  }

  static async getExpiringSoon(days: number = 90): Promise<Medicine[]> {
    logger.log('🔍 MedicineService.getExpiringSoon():', days);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .lte('expiry_date', futureDate.toISOString().split('T')[0])
      .gte('expiry_date', new Date().toISOString().split('T')[0])
      .order('expiry_date', { ascending: true });

    if (error) {
      logger.error('❌ MedicineService.getExpiringSoon():', error);
      throw error;
    }

    return data || [];
  }

  static async create(medicine: MedicineInsert): Promise<Medicine> {
    logger.log('🔍 MedicineService.create()');
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('medicines')
      .insert({
        ...medicine,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) {
      logger.error('❌ MedicineService.create():', error);
      throw error;
    }

    logger.log('✅ MedicineService.create():', data.id);
    return data;
  }

  static async update(id: string, updates: MedicineUpdate): Promise<Medicine> {
    logger.log('🔍 MedicineService.update():', id);
    const { data, error } = await supabase
      .from('medicines')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('❌ MedicineService.update():', error);
      throw error;
    }

    return data;
  }

  static async delete(id: string): Promise<void> {
    logger.log('🔍 MedicineService.delete():', id);
    const { error } = await supabase
      .from('medicines')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('❌ MedicineService.delete():', error);
      throw error;
    }
  }

  static async search(query: string): Promise<Medicine[]> {
    logger.log('🔍 MedicineService.search():', query);
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .or(`name.ilike.%${query}%,manufacturer.ilike.%${query}%,description.ilike.%${query}%`)
      .order('name', { ascending: true });

    if (error) {
      logger.error('❌ MedicineService.search():', error);
      throw error;
    }

    return data || [];
  }

  static async addStockMovement(movement: StockMovementInsert): Promise<StockMovement> {
    logger.log('🔍 MedicineService.addStockMovement()');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id) {
      throw new Error('Vous devez être connecté pour effectuer cette action');
    }
    
    const { data, error } = await supabase
      .from('stock_movements')
      .insert({
        ...movement,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      logger.error('❌ MedicineService.addStockMovement():', error);
      throw error;
    }

    return data;
  }

  static async getStockMovements(medicineId?: string): Promise<StockMovement[]> {
    logger.log('🔍 MedicineService.getStockMovements()');
    let query = supabase
      .from('stock_movements')
      .select(`
        *,
        medicine:medicines(name),
        user:profiles!user_id(first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (medicineId) {
      query = query.eq('medicine_id', medicineId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('❌ MedicineService.getStockMovements():', error);
      throw error;
    }

    return data || [];
  }

  static async getInventoryStats() {
    logger.log('🔍 MedicineService.getInventoryStats()');
    const { data: medicines, error } = await supabase
      .from('medicines')
      .select('*');

    if (error) {
      logger.error('❌ MedicineService.getInventoryStats():', error);
      throw error;
    }

    const totalItems = medicines?.length || 0;
    const lowStockItems = medicines?.filter(m => m.current_stock <= m.min_stock).length || 0;
    const totalValue = medicines?.reduce((sum, m) => sum + (m.current_stock * m.unit_price), 0) || 0;
    
    const expiringSoon = medicines?.filter(m => {
      const daysToExpiry = Math.ceil(
        (new Date(m.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
      );
      return daysToExpiry <= 90 && daysToExpiry > 0;
    }).length || 0;

    return {
      totalItems,
      lowStockItems,
      expiringSoon,
      totalValue
    };
  }
}
