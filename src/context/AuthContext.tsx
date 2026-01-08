import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, getUserProfile, AuthUser } from '../lib/supabase';
import { logger } from '../lib/logger';

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, userData: {
    firstName: string;
    lastName: string;
    role: 'admin' | 'doctor' | 'secretary' | 'nurse';
    phone: string;
    speciality?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let profileLoaded = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return;

      setSession(currentSession);

      if (event === 'SIGNED_OUT' || !currentSession) {
        setSession(null);
        setUser(null);
        profileLoaded = false;
        setLoading(false);
        return;
      }

      // Only load profile on SIGNED_IN, not on TOKEN_REFRESHED
      if (event === 'SIGNED_IN' && currentSession?.user && !profileLoaded) {
        profileLoaded = true;
        setTimeout(async () => {
          if (!mounted) return;
          const profile = await getUserProfile(currentSession.user.id);
          if (mounted && profile) {
            setUser(profile);
          }
          if (mounted) setLoading(false);
        }, 0);
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (!mounted) return;

      if (existingSession?.user) {
        setSession(existingSession);
        if (!profileLoaded) {
          profileLoaded = true;
          const profile = await getUserProfile(existingSession.user.id);
          if (mounted && profile) {
            setUser(profile);
          }
        }
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const trimmedEmail = email?.trim();
      if (!trimmedEmail || !password) {
        logger.error('❌ AuthContext.login() - Email ou mot de passe manquant');
        return false;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        logger.error('❌ AuthContext.login():', error.message);
        return false;
      }

      if (!data.user || !data.session) {
        logger.error('❌ AuthContext.login() - Session ou utilisateur manquant');
        return false;
      }

      setSession(data.session);
      const profile = await getUserProfile(data.user.id);

      if (!profile) {
        logger.error('❌ AuthContext.login() - Profil non trouvé:', data.user.id);
        return false;
      }

      setUser(profile);
      return true;
    } catch (error) {
      logger.error('❌ AuthContext.login() exception:', error);
      return false;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userData: {
      firstName: string;
      lastName: string;
      role: 'admin' | 'doctor' | 'secretary' | 'nurse';
      phone: string;
      speciality?: string;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: userData.role,
            phone: userData.phone,
            speciality: userData.speciality
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email.trim(),
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: userData.role,
            phone: userData.phone,
            speciality: userData.speciality,
            is_active: true
          });

        if (profileError) {
          return { success: false, error: 'Erreur lors de la création du profil' };
        }

        return { success: true };
      }

      return { success: false, error: 'Erreur lors de la création du compte' };
    } catch {
      return { success: false, error: 'Erreur lors de la création du compte' };
    }
  };

  const logout = async (): Promise<void> => {
    setSession(null);
    setUser(null);
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    isAuthenticated: !!user && !!session,
    login,
    signUp,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
