import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, Settings, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useSettingsStore } from '@/src/stores/settingsStore';
import { voiceService } from '@/src/services/voiceService';

interface PermissionHandlerProps {
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
}

export function PermissionHandler({
  onPermissionGranted,
  onPermissionDenied,
}: PermissionHandlerProps) {
  const { colors } = useTheme();
  const { permissions, updatePermissions } = useSettingsStore();
  const [showModal, setShowModal] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [canRetry, setCanRetry] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    setIsChecking(true);
    try {
      const status = await voiceService.checkPermissions();
      updatePermissions({ microphone: status });
      
      if (status === 'granted') {
        onPermissionGranted();
      } else {
        setShowModal(true);
        if (status === 'denied') {
          setCanRetry(false);
        }
      }
    } catch (error) {
      console.error('Permission check failed:', error);
      updatePermissions({ microphone: 'denied' });
      setShowModal(true);
      setCanRetry(false);
    } finally {
      setIsChecking(false);
    }
  };

  const requestPermission = async () => {
    if (isRequesting) return;
    
    setIsRequesting(true);
    try {
      const granted = await voiceService.requestPermissions();
      
      if (granted) {
        updatePermissions({ microphone: 'granted' });
        setShowModal(false);
        onPermissionGranted();
      } else {
        updatePermissions({ microphone: 'denied' });
        setCanRetry(false);
        
        if (Platform.OS !== 'web') {
          Alert.alert(
            'Permission Denied',
            'Microphone access was denied. You can enable it in Settings or continue with text-only mode.',
            [
              { text: 'Settings', onPress: openSettings },
              { text: 'Text Only', onPress: handleTextOnlyMode },
            ]
          );
        }
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      updatePermissions({ microphone: 'denied' });
      setCanRetry(false);
      
      Alert.alert(
        'Permission Error',
        'Failed to request microphone permission. Please try again or use text-only mode.',
        [
          { text: 'Retry', onPress: () => setCanRetry(true) },
          { text: 'Text Only', onPress: handleTextOnlyMode },
        ]
      );
    } finally {
      setIsRequesting(false);
    }
  };

  const testRecording = async () => {
    try {
      const success = await voiceService.testRecording();
      if (success) {
        Alert.alert('Success', 'Recording test completed successfully!');
        onPermissionGranted();
      } else {
        Alert.alert('Test Failed', 'Recording test failed. Please check your microphone settings.');
      }
    } catch (error) {
      console.error('Recording test failed:', error);
      Alert.alert('Test Error', 'Failed to test recording functionality.');
    }
  };

  const openSettings = () => {
    if (Platform.OS !== 'web') {
      Linking.openSettings();
    } else {
      Alert.alert(
        'Browser Settings',
        'Please check your browser settings to allow microphone access for this site.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleTextOnlyMode = () => {
    setShowModal(false);
    onPermissionDenied();
  };

  const handleRetry = () => {
    setCanRetry(true);
    checkPermissions();
  };

  if (isChecking) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.loadingIcon}
        >
          <Mic size={32} color="white" />
        </LinearGradient>
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Checking microphone permissions...
        </Text>
        <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>
          This may take a moment
        </Text>
      </View>
    );
  }

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.iconContainer}
          >
            {permissions.microphone === 'denied' ? (
              <AlertTriangle size={32} color="white" />
            ) : (
              <Mic size={32} color="white" />
            )}
          </LinearGradient>

          <Text style={[styles.title, { color: colors.text }]}>
            {permissions.microphone === 'denied'
              ? 'Microphone Access Required'
              : 'Enable Voice Features'}
          </Text>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {permissions.microphone === 'denied'
              ? Platform.OS === 'web'
                ? 'Voice conversations require microphone access. Please allow microphone access in your browser settings or continue with text-only mode.'
                : 'Voice conversations require microphone access. You can enable this in your device settings or continue with text-only mode.'
              : 'To use voice conversations, we need access to your microphone. Your voice data is processed securely and never stored permanently.'}
          </Text>

          {Platform.OS === 'web' && (
            <View style={[styles.webNotice, { backgroundColor: colors.warning + '20' }]}>
              <Text style={[styles.webNoticeText, { color: colors.warning }]}>
                💡 Browser may show a permission popup. Please click "Allow" to enable voice features.
              </Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            {permissions.microphone === 'denied' && !canRetry ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.primaryButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={openSettings}
                >
                  <Settings size={20} color="white" />
                  <Text style={styles.primaryButtonText}>
                    {Platform.OS === 'web' ? 'Browser Settings' : 'Open Settings'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.secondaryButton,
                    { backgroundColor: colors.secondary },
                  ]}
                  onPress={handleRetry}
                >
                  <RefreshCw size={20} color="white" />
                  <Text style={styles.primaryButtonText}>Try Again</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.tertiaryButton,
                    { borderColor: colors.border },
                  ]}
                  onPress={handleTextOnlyMode}
                >
                  <Text style={[styles.tertiaryButtonText, { color: colors.text }]}>
                    Continue with Text Only
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.primaryButton,
                    { backgroundColor: colors.primary },
                    isRequesting && styles.disabledButton,
                  ]}
                  onPress={requestPermission}
                  disabled={isRequesting}
                >
                  <CheckCircle size={20} color="white" />
                  <Text style={styles.primaryButtonText}>
                    {isRequesting ? 'Requesting...' : 'Allow Microphone'}
                  </Text>
                </TouchableOpacity>

                {permissions.microphone === 'granted' && (
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.secondaryButton,
                      { backgroundColor: colors.secondary },
                    ]}
                    onPress={testRecording}
                  >
                    <Mic size={20} color="white" />
                    <Text style={styles.primaryButtonText}>Test Recording</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.tertiaryButton,
                    { borderColor: colors.border },
                  ]}
                  onPress={handleTextOnlyMode}
                >
                  <Text style={[styles.tertiaryButtonText, { color: colors.text }]}>
                    Maybe Later
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  webNotice: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  webNoticeText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  secondaryButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  tertiaryButton: {
    borderWidth: 1,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tertiaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});