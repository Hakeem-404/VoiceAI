import { useEffect, useState } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useUserStore } from '@/src/stores/userStore';
import { useSupabaseAuth } from '@/src/hooks/useSupabase';
import { updateAuthState } from '@/src/services/syncService';

// Keep the splash screen visible until we're ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  // Initialize database and services
  useEffect(() => {
  const initializeApp = async () => {
    try {
      if (Platform.OS !== 'web') {
        // Only initialize database and services on native platforms
        const { initDatabase } = await import('@/src/lib/database');
        const { initializeSyncService } = await import('@/src/services/syncService');
        const { initializeCacheService } = await import('@/src/services/cacheService');
        
        await initDatabase();
        await initializeSyncService();
        await initializeCacheService();
      }
      
      console.log('App initialization complete');
    } catch (error) {
      console.error('App initialization error:', error);
    }
  };
  
  SplashScreen.preventAutoHideAsync();
  
  export default function RootLayout() {
    useFrameworkReady();
    
    const { session, loading, user } = useSupabaseAuth();
    const { setUser, setTheme } = useUserStore();
    const [appIsReady, setAppIsReady] = useState(false);
    
    // Update auth state for sync service
    useEffect(() => {
      updateAuthState({ user, session });
    }, [user, session]);
    
    useEffect(() => {
      initializeApp();
    }, []);
  
  const { session, loading, user } = useSupabaseAuth();
  const { setUser, setTheme } = useUserStore();
  const [appIsReady, setAppIsReady] = useState(false);
  
  useEffect(() => {
    // Initialize user data when auth is ready
    if (!loading) {
      if (user) {
        // Create a basic user object for the store
        // In a real app, you'd fetch full user profile here
        const userData = {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || '',
          preferences: {
            theme: 'system' as const,
            voiceSettings: {
              selectedVoice: 'en-US-Standard-A',
              speed: 1.0,
              pitch: 1.0,
              volume: 0.8,
            },
            notifications: {
              practiceReminders: true,
              dailyGoals: true,
              achievements: false,
            },
            language: 'en-US',
            favoriteMode: null,
            recentModes: [],
          },
          subscription: {
            tier: 'free' as const,
            expiresAt: undefined,
            features: [],
          },
          createdAt: new Date(),
        };
        
        setUser(userData);
      }
      setAppIsReady(true);
    }
  }, [loading, user, setUser]);

  useEffect(() => {
    if (appIsReady) {
      // Hide the splash screen once we're ready
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {session ? (
          <> // User is signed in
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="interview-prep" options={{ presentation: 'modal' }} />
          </>
        ) : (
          <> // User is not signed in
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </>
        )}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}