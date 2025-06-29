import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useDataPersistence } from '@/src/hooks/useDataPersistence';
import { spacing, typography } from '@/src/constants/colors';

interface OfflineIndicatorProps {
  showForceSync?: boolean;
}

export function OfflineIndicator({ showForceSync = false }: OfflineIndicatorProps) {
  const { colors } = useTheme();
  const { isOnline, lastSyncTime, pendingChanges, forceSync } = useDataPersistence();
  
  if (isOnline && pendingChanges === 0) {
    return null;
  }
  
  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - lastSyncTime.getTime();
    
    // Less than a minute
    if (diff < 60 * 1000) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    // More than a day
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };
  
  const handleForceSync = async () => {
    if (isOnline) {
      await forceSync();
    }
  };
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: isOnline ? colors.warning + '20' : colors.error + '20' }
    ]}>
      {isOnline ? (
        <Wifi size={16} color={colors.warning} />
      ) : (
        <WifiOff size={16} color={colors.error} />
      )}
      
      <View style={styles.textContainer}>
        <Text style={[
          styles.title,
          { color: isOnline ? colors.warning : colors.error }
        ]}>
          {isOnline ? 'Syncing Pending Changes' : 'You\'re Offline'}
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {isOnline
            ? `${pendingChanges} change${pendingChanges !== 1 ? 's' : ''} pending. Last sync: ${formatLastSync()}`
            : 'Changes will be saved when you reconnect'
          }
        </Text>
      </View>
      
      {showForceSync && isOnline && pendingChanges > 0 && (
        <TouchableOpacity
          style={[styles.syncButton, { backgroundColor: colors.warning }]}
          onPress={handleForceSync}
        >
          <RefreshCw size={14} color="white" />
          <Text style={styles.syncButtonText}>Sync Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    margin: spacing.md,
  },
  textContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 4,
    gap: spacing.xs / 2,
  },
  syncButtonText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: 'white',
  },
});