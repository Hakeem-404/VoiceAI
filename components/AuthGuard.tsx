import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSupabaseAuth } from '@/src/hooks/useSupabase';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing, typography } from '@/src/constants/colors';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  fallbackRoute?: string;
}

export function AuthGuard({ 
  children, 
  requireAuth = true,
  fallbackRoute = '/auth/welcome'
}: AuthGuardProps) {
  const { session, loading } = useSupabaseAuth();
  const { colors } = useTheme();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      const hasAuth = !!session;
      
      if (requireAuth && !hasAuth) {
        // User needs to be authenticated but isn't
        router.replace(fallbackRoute);
      } else if (!requireAuth && hasAuth) {
        // User is authenticated but page doesn't require auth
        router.replace('/(tabs)');
      } else {
        // Auth state matches requirement
        setIsChecking(false);
      }
    }
  }, [session, loading, requireAuth, fallbackRoute]);

  if (loading || isChecking) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Checking authentication...
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.base,
  },
});