import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../src/lib/supabase';

export interface UserProfile {
  id: string;
  rol: string;
  nombre?: string;
  email?: string;
  [key: string]: any;
}

interface AuthContextType {
  session: Session | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  setDevRole: (rol: string) => void;
  cambiarRolDev: (nuevoRol: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  userProfile: null,
  isLoading: true,
  setDevRole: () => {},
  cambiarRolDev: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const cambiarRolDev = (nuevoRol: string) => {
    setUserProfile((prev) => ({
      ...(prev || { id: 'dev-user', nombre: 'Usuario', apellidos: 'Prueba', email: 'dev@abogatech.com' }),
      rol: nuevoRol,
    }));
  };

  const setDevRole = cambiarRolDev;

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error.message);
        setUserProfile(null);
      } else {
        setUserProfile(data as UserProfile);
      }
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (isMounted) {
          setSession(currentSession);
          if (currentSession?.user) {
            await fetchUserProfile(currentSession.user.id);
          } else {
            setUserProfile(null);
          }
        }
      } catch (err) {
        console.error('Error initializing auth session:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);
      if (newSession?.user) {
        setIsLoading(true);
        await fetchUserProfile(newSession.user.id);
        setIsLoading(false);
      } else {
        setUserProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, userProfile, isLoading, setDevRole, cambiarRolDev }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
