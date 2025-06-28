import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import supabase, { subscribeToTable, performOptimisticUpdate } from '../lib/supabase';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as supabaseService from '../services/supabaseService';

export function useSupabaseAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch(error => {
      setError(error);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    } catch (error) {
      setError(error as Error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: { name }
        }
      });
      
      if (error) throw error;
      
      // Create user profile if sign up successful
      if (data.user) {
        try {
          await supabaseService.updateUserProfile(
            data.user.id,
            {
              email: data.user.email,
              name,
              created_at: new Date().toISOString(),
              last_active: new Date().toISOString()
            }
          );
        } catch (profileError) {
          console.error('Error creating user profile:', profileError);
          // Continue anyway since auth was successful
        }
      }
      
      return data;
    } catch (error) {
      setError(error as Error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      setError(error as Error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    user: session?.user || null,
  };
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [networkType, setNetworkType] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // For web, use navigator.onLine
      const updateOnlineStatus = () => setIsOnline(navigator.onLine);
      
      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);
      
      return () => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
      };
    } else {
      // For native platforms, use NetInfo
      const unsubscribe = NetInfo.addEventListener(state => {
        setIsOnline(state.isConnected ?? true);
        setNetworkType(state.type);
      });
      
      return () => unsubscribe();
    }
  }, []);

  return { isOnline, networkType };
}

export function useRealtimeSubscription<T>(
  table: string,
  column: string,
  value: string,
  initialData: T[] = []
) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Initial fetch
    const fetchData = async () => {
      try {
        const { data: initialData, error } = await supabase
          .from(table)
          .select('*')
          .eq(column, value);
          
        if (error) throw error;
        setData(initialData as T[]);
      } catch (error) {
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscription
    const subscription = subscribeToTable(table, column, value, (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      setData(currentData => {
        switch (eventType) {
          case 'INSERT':
            return [...currentData, newRecord as T];
          case 'UPDATE':
            return currentData.map(item => 
              (item as any).id === (newRecord as any).id ? newRecord as T : item
            );
          case 'DELETE':
            return currentData.filter(item => 
              (item as any).id !== (oldRecord as any).id
            );
          default:
            return currentData;
        }
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [table, column, value]);

  return { data, loading, error };
}