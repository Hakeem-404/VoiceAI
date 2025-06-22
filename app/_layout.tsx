import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useUserStore } from '@/src/stores/userStore';

export default function RootLayout() {
  useFrameworkReady();
  
  const { loadAnalytics } = useUserStore();
  
  useEffect(() => {
    // Initialize user data and analytics
    loadAnalytics();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}