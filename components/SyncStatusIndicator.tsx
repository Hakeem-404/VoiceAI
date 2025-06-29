import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { RefreshCw, Check, AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useOfflineSupport } from '@/src/hooks/useOfflineSupport';
import { spacing, typography } from '@/src/constants/colors';

interface SyncStatusIndicatorProps {
  compact?: boolean;
}

export function SyncStatusIndicator({ compact = false }: SyncStatusIndicatorProps) {
  const { colors } = useTheme();
  const { isOnline, lastSyncTime, pendingChanges, forceSync } = useOfflineSupport();
  
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  
  const rotateAnim = useState(new Animated.Value(0))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];
  
  // Show indicator when there are pending changes or when syncing
  useEffect(() => {
    if (pendingChanges > 0 || syncState === 'syncing') {
      setVisible(true);
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (syncState === 'success' || syncState === 'error') {
      // Keep visible for a moment, then fade out
      setTimeout(() => {
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setVisible(false);
        });
      }, 3000);
    } else {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
      });
    }
  }, [pendingChanges, syncState, opacityAnim]);
  
  // Rotate animation for syncing state
  useEffect(() => {
    if (syncState === 'syncing') {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.setValue(0);
    }
  }, [syncState, rotateAnim]);
  
  const handleSync = async () => {
    if (!isOnline || syncState === 'syncing') return;
    
    setSyncState('syncing');
    
    try {
      const result = await forceSync();
      
      if (result.success) {
        setSyncState('success');
      } else {
        setSyncState('error');
        setErrorMessage(result.error || 'Sync failed');
      }
    } catch (error) {
      setSyncState('error');
      setErrorMessage('Sync failed');
    }
    
    // Reset to idle after a delay
    setTimeout(() => {
      setSyncState('idle');
      setErrorMessage(null);
    }, 3000);
  };
  
  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never synced';
    
    const now = new Date();
    const diff = now.getTime() - lastSyncTime.getTime();
    
    // Less than a minute
    if (diff < 60 * 1000) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes}m ago`;
    }
    
    // Less than a day
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours}h ago`;
    }
    
    // Format as date
    return lastSyncTime.toLocaleDateString();
  };
  
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  if (!visible) return null;
  
  if (compact) {
    return (
      <Animated.View style={[
        styles.compactContainer,
        { opacity: opacityAnim }
      ]}>
        <TouchableOpacity
          style={[
            styles.compactButton,
            { backgroundColor: colors.surface }
          ]}
          onPress={handleSync}
          disabled={!isOnline || syncState === 'syncing'}
        >
          {syncState === 'syncing' ? (
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <RefreshCw size={16} color={colors.primary} />
            </Animated.View>
          ) : syncState === 'success' ? (
            <Check size={16} color={colors.success} />
          ) : syncState === 'error' ? (
            <AlertCircle size={16} color={colors.error} />
          ) : (
            <RefreshCw size={16} color={colors.primary} />
          )}
          
          {pendingChanges > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{pendingChanges}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }
  
  return (
    <Animated.View style={[
      styles.container,
      { 
        backgroundColor: colors.surface,
        opacity: opacityAnim,
      }
    ]}>
      <View style={styles.content}>
        {syncState === 'syncing' ? (
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <RefreshCw size={16} color={colors.primary} />
          </Animated.View>
        ) : syncState === 'success' ? (
          <Check size={16} color={colors.success} />
        ) : syncState === 'error' ? (
          <AlertCircle size={16} color={colors.error} />
        ) : (
          <RefreshCw size={16} color={colors.primary} />
        )}
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            {syncState === 'syncing'
              ? 'Syncing...'
              : syncState === 'success'
              ? 'Sync complete'
              : syncState === 'error'
              ? 'Sync failed'
              : pendingChanges > 0
              ? `${pendingChanges} pending change${pendingChanges !== 1 ? 's' : ''}`
              : 'All changes synced'}
          </Text>
          
          {syncState !== 'syncing' && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {syncState === 'error'
                ? errorMessage || 'An error occurred'
                : `Last sync: ${formatLastSync()}`}
            </Text>
          )}
        </View>
      </View>
      
      {(pendingChanges > 0 || syncState === 'error') && isOnline && syncState !== 'syncing' && (
        <TouchableOpacity
          style={[styles.syncButton, { backgroundColor: colors.primary }]}
          onPress={handleSync}
        >
          <Text style={styles.syncButtonText}>Sync Now</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    margin: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
  },
  syncButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 4,
  },
  syncButtonText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: 'white',
  },
  compactContainer: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    zIndex: 100,
  },
  compactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: 'white',
  },
});