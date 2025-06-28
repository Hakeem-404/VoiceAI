import { useEffect, useState } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from '@/src/lib/database';
import { initializeSyncService } from '@/src/services/syncService';
import { initializeCacheService } from '@/src/services/cacheService';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useUserStore } from '@/src/stores/userStore';
import { useSupabaseAuth } from '@/src/hooks/useSupabase';

// Keep the splash screen visible until we're ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  // Initialize database and services
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize SQLite database
        await initDatabase();
        
        // Initialize sync service
        // await initializeSyncService();
        
        // Initialize cache service
        await initializeCacheService();
        
        console.log('App initialization complete');
      } catch (error) {
        console.error('App initialization error:', error);
        // Don't let initialization errors prevent the app from loading
      }
    };
    
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

  // Temporarily bypass loading state to see if tabs appear
  // if (!appIsReady) {
  //   return null;
  // }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {session ? (
          // User is signed in
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="interview-prep" options={{ presentation: 'modal' }} />
          </>
        ) : (
          // User is not signed in
          <>
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