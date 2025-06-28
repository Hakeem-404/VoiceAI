import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Wifi, WifiOff, Download, RefreshCw, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useOfflineMode } from '../hooks/useOfflineMode';
import { useTheme } from '../hooks/useTheme';
import { spacing, typography } from '../constants/colors';

interface OfflineModeToggleProps {
  compact?: boolean;
  showDetails?: boolean;
}

export function OfflineModeToggle({ 
  compact = false, 
  showDetails = false 
}: OfflineModeToggleProps) {
  const { colors } = useTheme();
  const { 
    isOnline,
    isOfflineMode,
    pendingOperations,
    isPreparingData,
    preparationProgress,
    preparationError,
    toggleOfflineMode,
    enableOfflineMode
  } = useOfflineMode();

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Switch
          value={isOfflineMode}
          onValueChange={toggleOfflineMode}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={isOfflineMode ? colors.background : colors.textSecondary}
          disabled={isPreparingData}
        />
        {isOfflineMode ? (
          <WifiOff size={16} color={colors.primary} />
        ) : (
          <Wifi size={16} color={colors.textSecondary} />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          {isOfflineMode ? (
            <WifiOff size={20} color={colors.primary} />
          ) : (
            <Wifi size={20} color={colors.textSecondary} />
          )}
          <Text style={[styles.title, { color: colors.text }]}>
            Offline Mode
          </Text>
        </View>
        
        <Switch
          value={isOfflineMode}
          onValueChange={toggleOfflineMode}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={isOfflineMode ? colors.background : colors.textSecondary}
          disabled={isPreparingData}
        />
      </View>
      
      {showDetails && (
        <View style={styles.detailsContainer}>
          {isPreparingData ? (
            <>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      backgroundColor: colors.primary,
                      width: `${preparationProgress}%`
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                Preparing offline data...
              </Text>
            </>
          ) : isOfflineMode ? (
            <>
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                You're in offline mode. All changes will be synced when you go back online.
              </Text>
              {pendingOperations > 0 && (
                <View style={styles.pendingContainer}>
                  <RefreshCw size={14} color={colors.warning} />
                  <Text style={[styles.pendingText, { color: colors.warning }]}>
                    {pendingOperations} change{pendingOperations === 1 ? '' : 's'} pending sync
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                Enable offline mode to use the app without an internet connection.
              </Text>
              {!isOnline && (
                <View style={styles.offlineWarning}>
                  <AlertCircle size={14} color={colors.error} />
                  <Text style={[styles.warningText, { color: colors.error }]}>
                    You're currently offline. Enable offline mode to continue using the app.
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.prepareButton, { backgroundColor: colors.primary }]}
                onPress={enableOfflineMode}
                disabled={isPreparingData}
              >
                <Download size={16} color="white" />
                <Text style={styles.prepareButtonText}>
                  Prepare Offline Data
                </Text>
              </TouchableOpacity>
            </>
          )}
          
          {preparationError && (
            <View style={styles.errorContainer}>
              <AlertCircle size={14} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>
                {preparationError}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  detailsContainer: {
    marginTop: spacing.md,
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
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.4,
  },
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  pendingText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  warningText: {
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  prepareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    gap: spacing.sm,
  },
  prepareButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: 'white',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    flex: 1,
  },
});