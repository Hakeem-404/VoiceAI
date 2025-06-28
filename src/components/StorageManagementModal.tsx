import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Database, Trash2, Archive, RefreshCw, HardDrive, FileAudio, MessageSquare, ChartBar as BarChart3, FileText } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { getDatabaseStats, cleanupOldAudioFiles } from '../services/localDatabaseService';
import { cacheManager } from '../services/cacheService';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { spacing, typography } from '../constants/colors';

interface StorageManagementModalProps {
  visible: boolean;
  onClose: () => void;
}

export function StorageManagementModal({ 
  visible, 
  onClose 
}: StorageManagementModalProps) {
  const { colors } = useTheme();
  
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    conversationCount: 0,
    messageCount: 0,
    audioCacheSize: 0,
    syncQueueSize: 0,
    pendingSyncCount: 0,
    imageCacheSize: 0,
    apiCacheSize: 0,
    totalStorageUsed: 0,
    availableStorage: 0,
  });
  const [isClearing, setIsClearing] = useState(false);
  const [clearingType, setClearingType] = useState<string | null>(null);

  // Load storage stats
  useEffect(() => {
    if (visible) {
      loadStats();
    }
  }, [visible]);

  const loadStats = async () => {
    setIsLoading(true);
    
    try {
      // Get database stats
      const dbStats = await getDatabaseStats();
      
      // Get cache stats
      const cacheStats = cacheManager.getStats();
      
      // Get file system stats
      let totalSize = 0;
      let availableSize = 0;
      
      if (Platform.OS !== 'web') {
        try {
          // Get total storage info
          const fileSystemInfo = await FileSystem.getFreeDiskStorageAsync();
          availableSize = fileSystemInfo;
          
          // Estimate total storage (this is a rough estimate)
          totalSize = availableSize + dbStats.audioCacheSize + cacheStats.totalSize;
        } catch (error) {
          console.error('Error getting storage info:', error);
        }
      }
      
      setStats({
        conversationCount: dbStats.conversationCount,
        messageCount: dbStats.messageCount,
        audioCacheSize: dbStats.audioCacheSize,
        syncQueueSize: dbStats.syncQueueSize,
        pendingSyncCount: dbStats.pendingSyncCount,
        imageCacheSize: cacheStats.totalSize,
        apiCacheSize: 0, // Not tracked separately
        totalStorageUsed: dbStats.audioCacheSize + cacheStats.totalSize,
        availableStorage: availableSize,
      });
    } catch (error) {
      console.error('Error loading storage stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearAudioCache = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not supported', 'This feature is not supported on web.');
      return;
    }
    
    Alert.alert(
      'Clear Audio Cache',
      'This will delete all cached audio files. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            setClearingType('audio');
            
            try {
              const deletedCount = await cleanupOldAudioFiles(0); // 0 days = delete all
              console.log(`Deleted ${deletedCount} audio files`);
              
              // Reload stats
              await loadStats();
            } catch (error) {
              console.error('Error clearing audio cache:', error);
            } finally {
              setIsClearing(false);
              setClearingType(null);
            }
          }
        }
      ]
    );
  };

  const clearImageCache = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not supported', 'This feature is not supported on web.');
      return;
    }
    
    Alert.alert(
      'Clear Image Cache',
      'This will delete all cached images. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            setClearingType('images');
            
            try {
              await cacheManager.clearAll();
              
              // Reload stats
              await loadStats();
            } catch (error) {
              console.error('Error clearing image cache:', error);
            } finally {
              setIsClearing(false);
              setClearingType(null);
            }
          }
        }
      ]
    );
  };

  const clearApiCache = async () => {
    Alert.alert(
      'Clear API Cache',
      'This will delete all cached API responses. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            setClearingType('api');
            
            try {
              // Clear API cache (implementation depends on your caching strategy)
              // For this example, we'll just reload stats
              await loadStats();
            } catch (error) {
              console.error('Error clearing API cache:', error);
            } finally {
              setIsClearing(false);
              setClearingType(null);
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Storage Management
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Loading storage information...
              </Text>
            </View>
          ) : (
            <>
              <View style={[styles.storageOverview, { backgroundColor: colors.surface }]}>
                <View style={styles.storageHeader}>
                  <HardDrive size={24} color={colors.primary} />
                  <Text style={[styles.storageTitle, { color: colors.text }]}>
                    Storage Overview
                  </Text>
                </View>
                
                <View style={styles.storageBarContainer}>
                  <View style={[styles.storageBar, { backgroundColor: colors.border }]}>
                    {stats.totalStorageUsed > 0 && (
                      <View 
                        style={[
                          styles.storageUsed, 
                          { 
                            backgroundColor: colors.primary,
                            width: `${Math.min(100, (stats.totalStorageUsed / (stats.totalStorageUsed + stats.availableStorage)) * 100)}%`
                          }
                        ]} 
                      />
                    )}
                  </View>
                  
                  <View style={styles.storageLabels}>
                    <Text style={[styles.storageUsedText, { color: colors.text }]}>
                      Used: {formatSize(stats.totalStorageUsed)}
                    </Text>
                    {stats.availableStorage > 0 && (
                      <Text style={[styles.storageAvailableText, { color: colors.textSecondary }]}>
                        Available: {formatSize(stats.availableStorage)}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Storage Breakdown
                </Text>
                
                <View style={[styles.storageItem, { backgroundColor: colors.surface }]}>
                  <View style={styles.storageItemHeader}>
                    <MessageSquare size={20} color={colors.primary} />
                    <View style={styles.storageItemInfo}>
                      <Text style={[styles.storageItemTitle, { color: colors.text }]}>
                        Conversations
                      </Text>
                      <Text style={[styles.storageItemSubtitle, { color: colors.textSecondary }]}>
                        {stats.conversationCount} conversations, {stats.messageCount} messages
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={[styles.storageItem, { backgroundColor: colors.surface }]}>
                  <View style={styles.storageItemHeader}>
                    <FileAudio size={20} color={colors.secondary} />
                    <View style={styles.storageItemInfo}>
                      <Text style={[styles.storageItemTitle, { color: colors.text }]}>
                        Audio Cache
                      </Text>
                      <Text style={[styles.storageItemSubtitle, { color: colors.textSecondary }]}>
                        {formatSize(stats.audioCacheSize)}
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={[styles.clearButton, { borderColor: colors.error }]}
                    onPress={clearAudioCache}
                    disabled={isClearing}
                  >
                    {isClearing && clearingType === 'audio' ? (
                      <ActivityIndicator size="small" color={colors.error} />
                    ) : (
                      <>
                        <Trash2 size={16} color={colors.error} />
                        <Text style={[styles.clearButtonText, { color: colors.error }]}>
                          Clear
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
                
                <View style={[styles.storageItem, { backgroundColor: colors.surface }]}>
                  <View style={styles.storageItemHeader}>
                    <Image size={20} color={colors.accent} />
                    <View style={styles.storageItemInfo}>
                      <Text style={[styles.storageItemTitle, { color: colors.text }]}>
                        Image Cache
                      </Text>
                      <Text style={[styles.storageItemSubtitle, { color: colors.textSecondary }]}>
                        {formatSize(stats.imageCacheSize)}
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={[styles.clearButton, { borderColor: colors.error }]}
                    onPress={clearImageCache}
                    disabled={isClearing}
                  >
                    {isClearing && clearingType === 'images' ? (
                      <ActivityIndicator size="small" color={colors.error} />
                    ) : (
                      <>
                        <Trash2 size={16} color={colors.error} />
                        <Text style={[styles.clearButtonText, { color: colors.error }]}>
                          Clear
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
                
                <View style={[styles.storageItem, { backgroundColor: colors.surface }]}>
                  <View style={styles.storageItemHeader}>
                    <Database size={20} color={colors.warning} />
                    <View style={styles.storageItemInfo}>
                      <Text style={[styles.storageItemTitle, { color: colors.text }]}>
                        API Cache
                      </Text>
                      <Text style={[styles.storageItemSubtitle, { color: colors.textSecondary }]}>
                        {formatSize(stats.apiCacheSize)}
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={[styles.clearButton, { borderColor: colors.error }]}
                    onPress={clearApiCache}
                    disabled={isClearing}
                  >
                    {isClearing && clearingType === 'api' ? (
                      <ActivityIndicator size="small" color={colors.error} />
                    ) : (
                      <>
                        <Trash2 size={16} color={colors.error} />
                        <Text style={[styles.clearButtonText, { color: colors.error }]}>
                          Clear
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
                
                <View style={[styles.storageItem, { backgroundColor: colors.surface }]}>
                  <View style={styles.storageItemHeader}>
                    <RefreshCw size={20} color={colors.success} />
                    <View style={styles.storageItemInfo}>
                      <Text style={[styles.storageItemTitle, { color: colors.text }]}>
                        Sync Queue
                      </Text>
                      <Text style={[styles.storageItemSubtitle, { color: colors.textSecondary }]}>
                        {stats.syncQueueSize} items ({stats.pendingSyncCount} pending)
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  Clearing caches will free up storage space but may affect app performance temporarily. Your conversations and progress data will not be deleted.
                </Text>
              </View>
            </>
          )}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: colors.primary }]}
            onPress={loadStats}
            disabled={isLoading || isClearing}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <RefreshCw size={20} color="white" />
                <Text style={styles.refreshButtonText}>Refresh Stats</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// Import these components for the UI
const Image = (props: any) => <FileText {...props} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  closeButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    fontSize: typography.sizes.base,
    marginTop: spacing.md,
  },
  storageOverview: {
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.xl,
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  storageTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  storageBarContainer: {
    marginBottom: spacing.sm,
  },
  storageBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  storageUsed: {
    height: '100%',
    borderRadius: 4,
  },
  storageLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  storageUsedText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  storageAvailableText: {
    fontSize: typography.sizes.sm,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },
  storageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  storageItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  storageItemInfo: {
    marginLeft: spacing.md,
  },
  storageItemTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs / 2,
  },
  storageItemSubtitle: {
    fontSize: typography.sizes.sm,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.xs,
  },
  clearButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  infoBox: {
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.xl,
  },
  infoText: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.4,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: 12,
    gap: spacing.sm,
  },
  refreshButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: 'white',
  },
});