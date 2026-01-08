// Re-export from the auto-generated client for consistency
export { supabase } from '../integrations/supabase/client';
import { supabase } from '../integrations/supabase/client';

// Type pour les rôles utilisateur
export type UserRole = 'admin' | 'doctor' | 'secretary' | 'nurse';

// Types pour l'authentification
export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  speciality?: string;
  phone: string;
  isActive: boolean;
};

// Fonction pour obtenir le profil utilisateur complet
export async function getUserProfile(userId: string): Promise<AuthUser | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.error('Error fetching user profile:', error?.message);
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      role: data.role,
      firstName: data.first_name,
      lastName: data.last_name,
      speciality: data.speciality || undefined,
      phone: data.phone,
      isActive: data.is_active ?? true
    };
  } catch (error) {
    console.error('Exception in getUserProfile:', error);
    return null;
  }
}

// Fonction pour vérifier les permissions
export function hasPermission(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

// Fonction pour obtenir les utilisateurs par rôle
export async function getUsersByRole(role?: 'admin' | 'doctor' | 'secretary' | 'nurse') {
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('is_active', true)
    .order('first_name');

  if (role) {
    query = query.eq('role', role);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching users by role:', error.message);
    throw error;
  }

  return data;
}

// Fonction pour vérifier si un email existe déjà
export async function checkEmailExists(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .single();

  if (error && error.code !== 'PGRST116') {
    return false;
  }

  return !!data;
}

// Fonction pour réinitialiser le mot de passe
export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Erreur lors de la réinitialisation' };
  }
}
