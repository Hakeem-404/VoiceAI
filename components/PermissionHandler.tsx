import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, Settings, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { useTheme } from '@/src/hooks/useTheme';
import { useSettingsStore } from '@/src/stores/settingsStore';

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

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web permissions are handled by browser
        updatePermissions({ microphone: 'granted' });
        onPermissionGranted();
        return;
      }

      const { status } = await Audio.getPermissionsAsync();
      
      if (status === 'granted') {
        updatePermissions({ microphone: 'granted' });
        onPermissionGranted();
      } else if (status === 'denied') {
        updatePermissions({ microphone: 'denied' });
        setShowModal(true);
      } else {
        updatePermissions({ microphone: 'undetermined' });
        setShowModal(true);
      }
    } catch (error) {
      console.error('Permission check failed:', error);
      updatePermissions({ microphone: 'denied' });
      setShowModal(true);
    } finally {
      setIsChecking(false);
    }
  };

  const requestPermission = async () => {
    try {
      if (Platform.OS === 'web') {
        onPermissionGranted();
        return;
      }

      const { status } = await Audio.requestPermissionsAsync();
      
      if (status === 'granted') {
        updatePermissions({ microphone: 'granted' });
        setShowModal(false);
        onPermissionGranted();
      } else {
        updatePermissions({ microphone: 'denied' });
        onPermissionDenied();
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      updatePermissions({ microphone: 'denied' });
      onPermissionDenied();
    }
  };

  const openSettings = () => {
    if (Platform.OS !== 'web') {
      Linking.openSettings();
    }
  };

  const handleTextOnlyMode = () => {
    setShowModal(false);
    onPermissionDenied();
  };

  if (isChecking) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Mic size={48} color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Checking permissions...
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
              ? 'Voice conversations require microphone access. You can enable this in your device settings or continue with text-only mode.'
              : 'To use voice conversations, we need access to your microphone. Your voice data is processed securely and never stored.'}
          </Text>

          <View style={styles.buttonContainer}>
            {permissions.microphone === 'denied' ? (
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
                  <Text style={styles.primaryButtonText}>Open Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.secondaryButton,
                    { borderColor: colors.border },
                  ]}
                  onPress={handleTextOnlyMode}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
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
                  ]}
                  onPress={requestPermission}
                >
                  <CheckCircle size={20} color="white" />
                  <Text style={styles.primaryButtonText}>Allow Microphone</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.secondaryButton,
                    { borderColor: colors.border },
                  ]}
                  onPress={handleTextOnlyMode}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
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
  loadingText: {
    fontSize: 16,
    marginTop: 16,
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
    marginBottom: 24,
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
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});