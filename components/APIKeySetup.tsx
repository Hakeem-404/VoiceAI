import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Key, Eye, EyeOff, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import { claudeAPI } from '../services/claudeAPI';

interface APIKeySetupProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function APIKeySetup({ visible, onClose, onSuccess }: APIKeySetupProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  useEffect(() => {
    // Check if API key is already configured
    const status = claudeAPI.getAPIKeyStatus();
    if (status.configured) {
      setValidationStatus('valid');
    }
  }, []);

  const validateAPIKey = async (key: string) => {
    if (!key.trim()) {
      setValidationStatus('idle');
      return;
    }

    setIsValidating(true);
    
    try {
      // Initialize with the new key
      claudeAPI.initialize(key);
      
      // Test the API key with a simple request
      const testResponse = await claudeAPI.sendMessage(
        'Hello',
        {
          messages: [],
          mode: 'general-chat',
          sessionId: 'test',
          metadata: {
            startTime: new Date(),
            lastActivity: new Date(),
            messageCount: 0,
            totalTokens: 0
          }
        }
      );

      if (testResponse.error) {
        setValidationStatus('invalid');
        Alert.alert('Invalid API Key', 'The API key you entered is not valid. Please check and try again.');
      } else {
        setValidationStatus('valid');
        Alert.alert('Success!', 'Your Claude API key has been configured successfully.');
        onSuccess();
      }
    } catch (error) {
      setValidationStatus('invalid');
      Alert.alert('Validation Failed', 'Unable to validate the API key. Please check your internet connection and try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = () => {
    if (validationStatus === 'valid') {
      onClose();
    } else {
      validateAPIKey(apiKey);
    }
  };

  const getStatusIcon = () => {
    switch (validationStatus) {
      case 'valid':
        return <CheckCircle size={20} color="#10B981" />;
      case 'invalid':
        return <AlertCircle size={20} color="#EF4444" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (validationStatus) {
      case 'valid': return '#10B981';
      case 'invalid': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.header}
        >
          <Key size={32} color="white" />
          <Text style={styles.headerTitle}>Claude API Setup</Text>
          <Text style={styles.headerSubtitle}>
            Enter your Claude API key to start conversations
          </Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.instructions}>
            <Text style={styles.instructionTitle}>How to get your API key:</Text>
            <Text style={styles.instructionStep}>1. Visit console.anthropic.com</Text>
            <Text style={styles.instructionStep}>2. Sign in or create an account</Text>
            <Text style={styles.instructionStep}>3. Go to API Keys section</Text>
            <Text style={styles.instructionStep}>4. Create a new API key</Text>
            <Text style={styles.instructionStep}>5. Copy and paste it below</Text>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Claude API Key</Text>
            <View style={[styles.inputContainer, { borderColor: getStatusColor() }]}>
              <TextInput
                style={styles.textInput}
                value={apiKey}
                onChangeText={(text) => {
                  setApiKey(text);
                  setValidationStatus('idle');
                }}
                placeholder="sk-ant-api03-..."
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowKey(!showKey)}
              >
                {showKey ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
              {getStatusIcon()}
            </View>
            
            {validationStatus === 'invalid' && (
              <Text style={styles.errorText}>
                Invalid API key. Please check and try again.
              </Text>
            )}
            
            {validationStatus === 'valid' && (
              <Text style={styles.successText}>
                API key validated successfully!
              </Text>
            )}
          </View>

          <View style={styles.securityNote}>
            <AlertCircle size={16} color="#F59E0B" />
            <Text style={styles.securityText}>
              Your API key is stored securely on your device and never shared.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!apiKey.trim() || isValidating) && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={!apiKey.trim() || isValidating}
          >
            <Text style={styles.saveButtonText}>
              {isValidating ? 'Validating...' : validationStatus === 'valid' ? 'Done' : 'Validate & Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  instructions: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  instructionStep: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
    paddingLeft: 8,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 8,
  },
  successText: {
    fontSize: 14,
    color: '#10B981',
    marginTop: 8,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  securityText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
  },
  footer: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});