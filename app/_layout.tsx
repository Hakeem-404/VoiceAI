import { useEffect, useState } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useUserStore } from '@/src/stores/userStore';
import { useSupabaseAuth } from '@/src/hooks/useSupabase';

// Initialize services conditionally
const initializeApp = async () => {
  try {
    if (Platform.OS !== 'web') {
      // Only initialize database and services on native platforms
      const { initDatabase } = await import('@/src/lib/database');
      const { initializeSyncService, updateAuthState } = await import('@/src/services/syncService');
      const { initializeCacheService } = await import('@/src/services/cacheService');
      
      await initDatabase();
      await initializeSyncService();
      await initializeCacheService();
    } else {
      // For web, just initialize cache service
      const { initializeCacheService } = await import('@/src/services/cacheService');
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
  
  // Update auth state for sync service (only on native)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      import('@/src/services/syncService').then(({ updateAuthState }) => {
        updateAuthState({ user, session });
      });
    }
  }, [user, session]);
  
  useEffect(() => {
    initializeApp();
  }, []);
  
  useEffect(() => {
    if (!loading) {
      if (user) {
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
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="interview-prep" options={{ presentation: 'modal' }} />
          </>
        ) : (
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