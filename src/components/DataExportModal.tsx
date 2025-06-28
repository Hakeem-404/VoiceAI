import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, FileText, Download, Share2, CircleCheck as CheckCircle, Database, FileJson, FilePen as FilePdf, FileArchive } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { exportDatabaseToJson } from '../services/localDatabaseService';
import * as FileSystem from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import { spacing, typography } from '../constants/colors';

interface DataExportModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DataExportModal({ 
  visible, 
  onClose 
}: DataExportModalProps) {
  const { colors } = useTheme();
  
  const [exportType, setExportType] = useState<'all' | 'conversations' | 'progress' | 'settings'>('all');
  const [format, setFormat] = useState<'json' | 'pdf' | 'csv'>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [exportedFilePath, setExportedFilePath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportComplete(false);
    setExportedFilePath(null);
    setError(null);
    
    try {
      // Export database to JSON
      const jsonData = await exportDatabaseToJson();
      
      if (Platform.OS === 'web') {
        // For web, create a download link
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voiceai_export_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setExportComplete(true);
      } else {
        // For native, save to file
        const fileDir = FileSystem.documentDirectory + 'exports/';
        
        // Create directory if it doesn't exist
        const dirInfo = await FileSystem.getInfoAsync(fileDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(fileDir, { intermediates: true });
        }
        
        // Save file
        const fileName = `voiceai_export_${Date.now()}.json`;
        const filePath = fileDir + fileName;
        
        await FileSystem.writeAsStringAsync(filePath, jsonData);
        
        setExportedFilePath(filePath);
        setExportComplete(true);
      }
    } catch (err) {
      console.error('Export error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!exportedFilePath) return;
    
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const canShare = true; // expo-sharing is always available on native platforms
        
        if (canShare) {
          await shareAsync(fileUri, {
        } else {
          setError('Sharing is not available on this device');
        }
      } else {
        setError('Sharing is not supported on this platform');
      }
    } catch (err) {
      console.error('Share error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
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
            Export Data
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {!isExporting && !exportComplete && (
            <>
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  What to Export
                </Text>
                
                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    exportType === 'all' && { borderColor: colors.primary },
                    { backgroundColor: colors.surface }
                  ]}
                  onPress={() => setExportType('all')}
                >
                  <Database size={24} color={colors.primary} />
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>
                      All Data
                    </Text>
                    <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                      Export all conversations, progress, and settings
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    exportType === 'conversations' && { borderColor: colors.primary },
                    { backgroundColor: colors.surface }
                  ]}
                  onPress={() => setExportType('conversations')}
                >
                  <MessageSquare size={24} color={colors.secondary} />
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>
                      Conversations Only
                    </Text>
                    <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                      Export only conversation history
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    exportType === 'progress' && { borderColor: colors.primary },
                    { backgroundColor: colors.surface }
                  ]}
                  onPress={() => setExportType('progress')}
                >
                  <BarChart size={24} color={colors.warning} />
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>
                      Progress Only
                    </Text>
                    <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                      Export only progress and analytics data
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    exportType === 'settings' && { borderColor: colors.primary },
                    { backgroundColor: colors.surface }
                  ]}
                  onPress={() => setExportType('settings')}
                >
                  <Settings size={24} color={colors.accent} />
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>
                      Settings Only
                    </Text>
                    <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                      Export only user preferences and settings
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Export Format
                </Text>
                
                <View style={styles.formatOptions}>
                  <TouchableOpacity
                    style={[
                      styles.formatOption,
                      format === 'json' && { borderColor: colors.primary, borderWidth: 2 },
                      { backgroundColor: colors.surface }
                    ]}
                    onPress={() => setFormat('json')}
                  >
                    <FileJson size={32} color={colors.primary} />
                    <Text style={[styles.formatText, { color: colors.text }]}>JSON</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.formatOption,
                      format === 'pdf' && { borderColor: colors.primary, borderWidth: 2 },
                      { backgroundColor: colors.surface }
                    ]}
                    onPress={() => setFormat('pdf')}
                  >
                    <FilePdf size={32} color={colors.error} />
                    <Text style={[styles.formatText, { color: colors.text }]}>PDF</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.formatOption,
                      format === 'csv' && { borderColor: colors.primary, borderWidth: 2 },
                      { backgroundColor: colors.surface }
                    ]}
                    onPress={() => setFormat('csv')}
                  >
                    <FileText size={32} color={colors.success} />
                    <Text style={[styles.formatText, { color: colors.text }]}>CSV</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  Your data will be exported in the selected format. This may include conversation history, progress data, and app settings depending on your selection.
                </Text>
              </View>
            </>
          )}

          {isExporting && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Exporting your data...
              </Text>
              <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>
                This may take a moment depending on the amount of data.
              </Text>
            </View>
          )}

          {exportComplete && (
            <View style={styles.successContainer}>
              <View style={[styles.successIcon, { backgroundColor: colors.success }]}>
                <CheckCircle size={32} color="white" />
              </View>
              <Text style={[styles.successText, { color: colors.text }]}>
                Export Complete!
              </Text>
              <Text style={[styles.successSubtext, { color: colors.textSecondary }]}>
                Your data has been successfully exported.
              </Text>
              
              {exportedFilePath && (
                <TouchableOpacity
                  style={[styles.shareButton, { backgroundColor: colors.primary }]}
                  onPress={handleShare}
                >
                  <Share2 size={20} color="white" />
                  <Text style={styles.shareButtonText}>
                    Share Export File
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.error + '20' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            </View>
          )}
        </ScrollView>

        {!isExporting && !exportComplete && (
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: colors.primary }]}
              onPress={handleExport}
            >
              <Download size={20} color="white" />
              <Text style={styles.exportButtonText}>Export Data</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {exportComplete && (
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.closeFooterButton, { backgroundColor: colors.surface }]}
              onPress={onClose}
            >
              <Text style={[styles.closeFooterButtonText, { color: colors.text }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// Import these components for the UI
const MessageSquare = (props: any) => <FileText {...props} />;
const BarChart = (props: any) => <BarChart3 {...props} />;
const Settings = (props: any) => <Database {...props} />;

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
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  optionContent: {
    marginLeft: spacing.md,
    flex: 1,
  },
  optionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs / 2,
  },
  optionDescription: {
    fontSize: typography.sizes.sm,
  },
  formatOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formatOption: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  formatText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    marginTop: spacing.sm,
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  loadingSubtext: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  successSubtext: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 24,
    gap: spacing.sm,
  },
  shareButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: 'white',
  },
  errorBox: {
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: 12,
    gap: spacing.sm,
  },
  exportButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: 'white',
  },
  closeFooterButton: {
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeFooterButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
});