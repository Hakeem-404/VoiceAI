import { useEffect, useState } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useUserStore } from '@/src/stores/userStore';
import { useSupabaseAuth } from '@/src/hooks/useSupabase';

// Keep the splash screen visible until we're ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  
  const { loadAnalytics } = useUserStore();
  const { session, loading } = useSupabaseAuth();
  const [appIsReady, setAppIsReady] = useState(false);
  
  useEffect(() => {
    // Initialize user data and analytics
    loadAnalytics();
    
    // Prepare app
    async function prepare() {
      try {
        // Wait for auth to be ready
        if (!loading) {
          // Any other initialization can go here
          setAppIsReady(true);
        }
      } catch (e) {
        console.warn('Error during app initialization:', e);
        setAppIsReady(true);
      }
    }

    prepare();
  }, [loading]);

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