import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Wifi, WifiOff, RefreshCw, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Clock } from 'lucide-react-native';
import { addSyncListener, processSyncQueue, SyncStatus } from '../services/syncService';
import { useTheme } from '../hooks/useTheme';
import { spacing, typography } from '../constants/colors';

interface SyncStatusIndicatorProps {
  compact?: boolean;
  showDetails?: boolean;
  onPress?: () => void;
}

export function SyncStatusIndicator({ 
  compact = false, 
  showDetails = false,
  onPress
}: SyncStatusIndicatorProps) {
  const { colors } = useTheme();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    pendingOperations: 0,
    syncProgress: 0
  });

  useEffect(() => {
    const unsubscribe = addSyncListener((status) => {
      setSyncStatus(status);
    });
    
    return unsubscribe;
  }, []);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (syncStatus.isOnline && !syncStatus.isSyncing && syncStatus.pendingOperations > 0) {
      processSyncQueue(true);
    }
  };

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) {
      return <WifiOff size={compact ? 16 : 20} color={colors.error} />;
    }
    
    if (syncStatus.isSyncing) {
      return (
        <View style={styles.spinnerContainer}>
          <RefreshCw size={compact ? 16 : 20} color={colors.primary} />
        </View>
      );
    }
    
    if (syncStatus.pendingOperations > 0) {
      return <Clock size={compact ? 16 : 20} color={colors.warning} />;
    }
    
    return <CheckCircle size={compact ? 16 : 20} color={colors.success} />;
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) {
      return 'Offline';
    }
    
    if (syncStatus.isSyncing) {
      return 'Syncing...';
    }
    
    if (syncStatus.pendingOperations > 0) {
      return `${syncStatus.pendingOperations} pending`;
    }
    
    return 'Synced';
  };

  const getStatusColor = () => {
    if (!syncStatus.isOnline) {
      return colors.error;
    }
    
    if (syncStatus.isSyncing) {
      return colors.primary;
    }
    
    if (syncStatus.pendingOperations > 0) {
      return colors.warning;
    }
    
    return colors.success;
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, { backgroundColor: colors.surface }]}
        onPress={handlePress}
        disabled={syncStatus.isSyncing}
      >
        {getStatusIcon()}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.surface }
      ]}
      onPress={handlePress}
      disabled={syncStatus.isSyncing}
    >
      <View style={styles.statusRow}>
        {getStatusIcon()}
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>
      
      {showDetails && (
        <View style={styles.detailsContainer}>
          {syncStatus.isSyncing && (
            <>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      backgroundColor: colors.primary,
                      width: `${syncStatus.syncProgress}%`
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                {syncStatus.currentOperation || 'Syncing data...'}
              </Text>
            </>
          )}
          
          {!syncStatus.isSyncing && syncStatus.lastSyncTime && (
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              Last sync: {formatLastSyncTime(syncStatus.lastSyncTime)}
            </Text>
          )}
          
          {!syncStatus.isOnline && (
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              Changes will sync when you're back online
            </Text>
          )}
          
          {syncStatus.error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={14} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>
                {syncStatus.error}
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const formatLastSyncTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) {
    return 'Just now';
  }
  
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  }
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }
  
  return date.toLocaleDateString();
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  compactContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  detailsContainer: {
    marginTop: spacing.sm,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginVertical: spacing.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  detailText: {
    fontSize: typography.sizes.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  errorText: {
    fontSize: typography.sizes.xs,
    flex: 1,
  },
  spinnerContainer: {
    transform: [{ rotate: '0deg' }],
    animationName: 'spin',
    animationDuration: '1s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
  },
});