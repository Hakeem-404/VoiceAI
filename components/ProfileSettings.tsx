import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Camera, Mail, X, CircleCheck as CheckCircle, Upload, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useSupabaseAuth } from '@/src/hooks/useSupabase';
import { useDataPersistence } from '@/src/hooks/useDataPersistence';
import * as supabaseService from '@/src/services/supabaseService';
import { spacing, typography } from '@/src/constants/colors';
import supabase from '@/src/lib/supabase';

interface ProfileSettingsProps {
  visible: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
}

export function ProfileSettings({ visible, onClose, onProfileUpdated }: ProfileSettingsProps) {
  const { colors, isDark } = useTheme();
  const { user, session } = useSupabaseAuth();
  const { updatePreferences } = useDataPersistence();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form validation
  const [nameError, setNameError] = useState<string | null>(null);

  // Sync form state with user data
  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.name || '');
      setEmail(user.email || '');
      setAvatarUrl(user.user_metadata?.avatar_url || '');
      setAvatarVersion(0); // Reset version when component loads
      console.log('ProfileSettings: User data synced, avatarUrl:', user.user_metadata?.avatar_url);
    }
  }, [user]);
  
  // Debug avatar state changes
  useEffect(() => {
    console.log('ProfileSettings: avatarUrl changed to:', avatarUrl);
  }, [avatarUrl]);
  
  useEffect(() => {
    console.log('ProfileSettings: avatarVersion changed to:', avatarVersion);
  }, [avatarVersion]);
  
  const validateName = (name: string) => {
    if (!name.trim()) {
      setNameError('Name is required');
      return false;
    }
    if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    }
    setNameError(null);
    return true;
  };
  
  const handleUpdateProfile = async () => {
    // Reset states
    setError(null);
    setSuccess(false);
    
    // Validate form
    const isNameValid = validateName(name);
    
    if (!isNameValid) {
      return;
    }
    
    setLoading(true);
    
    try {
      if (!user) throw new Error('User not authenticated');
      
      // Update user metadata
      const { error: updateError } = await supabaseService.updateUserProfile(
        user.id,
        { name }
      );
      
      if (updateError) throw updateError;
      
      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { name }
      });
      
      // Update local user data
      if (user) {
        await updatePreferences(user.id, { name });
      }
      
      if (authError) throw authError;
      
      setSuccess(true);
      
      // Notify parent component of successful update
      if (onProfileUpdated) {
        onProfileUpdated();
      }
      
      // Reset after a delay
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUploadAvatar = async (useCamera = false) => {
    if (!user) {
      setError('You must be logged in to upload an avatar');
      return;
    }
    
    try {
      let file;
      
      if (Platform.OS === 'web') {
        // For web, create a file input and trigger it
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        // Create a promise to handle the file selection
        const filePromise = new Promise<File | null>((resolve) => {
          input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            console.log('File selected:', files);
            resolve(files ? files[0] : null);
          };
          
          // Handle cancellation
          input.oncancel = () => {
            console.log('File selection cancelled');
            resolve(null);
          };
        });
        
        // Trigger the file input
        input.click();
        
        // Wait for file selection
        file = await filePromise;
        
        if (!file) {
          console.log('No file selected');
          return;
        }
        
        console.log('File selected for upload:', file.name, file.size, file.type);
      } else {
        // For native, we would use expo-image-picker
        // For now, just show an alert
        alert('On native platforms, this would open the image picker or camera');
        return;
      }
      
      // Show loading state
      setLoading(true);
      
      console.log('Starting avatar upload for user:', user.id);
      
      // Use the existing uploadAvatar service
      let publicUrl;
      try {
        publicUrl = await supabaseService.uploadAvatar(user.id, file);
        console.log('Upload completed, public URL:', publicUrl);
      } catch (uploadError) {
        console.error('Upload failed:', uploadError);
        throw uploadError;
      }
      
      if (!publicUrl) {
        console.error('Upload completed but no public URL returned');
        throw new Error('Failed to upload avatar - no public URL returned');
      }
      
      // Update auth metadata to ensure immediate visibility
      console.log('Updating auth metadata with avatar URL:', publicUrl);
      const { error: authError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });
      
      if (authError) {
        console.warn('Failed to update auth metadata:', authError);
        // Don't throw here as the upload was successful
      } else {
        console.log('Auth metadata updated successfully');
        
        // Refresh the session to ensure UI updates
        console.log('Refreshing session...');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.warn('Failed to refresh session:', sessionError);
        } else {
          console.log('Session refreshed successfully');
        }
      }
      
      // Update local state
      console.log('Updating local state with avatar URL:', publicUrl);
      console.log('Current avatarVersion before update:', avatarVersion);
      setAvatarUrl(publicUrl);
      setAvatarVersion(prev => {
        const newVersion = prev + 1;
        console.log('New avatarVersion:', newVersion);
        return newVersion;
      });
      setSuccess(true);
      
      // Notify parent component of successful update
      if (onProfileUpdated) {
        console.log('Calling onProfileUpdated callback');
        onProfileUpdated();
      }
      
      // Reset success after a delay
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload avatar';
      setError(errorMessage);
      console.error('Avatar upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1E293B', '#0F172A'] : ['#F8FAFC', '#E2E8F0']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Profile Settings
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {avatarUrl ? (
                <Image
                  source={{ 
                    uri: avatarUrl + (avatarUrl.includes('?') ? '&' : '?') + `v=${avatarVersion}` 
                  }}
                  style={styles.avatar}
                  onLoad={() => {
                    const imageUrl = avatarUrl + (avatarUrl.includes('?') ? '&' : '?') + `v=${avatarVersion}`;
                    console.log('Avatar image loaded successfully:', imageUrl);
                  }}
                  onError={(error) => console.error('Avatar image failed to load:', error.nativeEvent)}
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                  <User size={40} color="white" />
                </View>
              )}
              <TouchableOpacity
                style={[styles.cameraButton, { backgroundColor: colors.primary }]}
                onPress={handleUploadAvatar}
              >
                <Camera size={16} color="white" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: colors.primary + '20' }]}
              onPress={handleUploadAvatar}
            >
              <Upload size={16} color={colors.primary} />
              <Text style={[styles.uploadButtonText, { color: colors.primary }]}>
                Upload Photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Success Message */}
          {success && (
            <View style={[styles.successContainer, { backgroundColor: colors.success + '20' }]}>
              <CheckCircle size={20} color={colors.success} />
              <Text style={[styles.successText, { color: colors.success }]}>
                Profile updated successfully!
              </Text>
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
              <AlertCircle size={20} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Full Name
              </Text>
              <View style={[
                styles.inputContainer,
                { 
                  borderColor: nameError ? colors.error : colors.border,
                  backgroundColor: colors.surface
                }
              ]}>
                <User size={20} color={nameError ? colors.error : colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.textTertiary}
                  value={name}
                  onChangeText={setName}
                  onBlur={() => validateName(name)}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
              {nameError && (
                <Text style={[styles.fieldError, { color: colors.error }]}>
                  {nameError}
                </Text>
              )}
            </View>

            {/* Email Input (Disabled) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Email
              </Text>
              <View style={[
                styles.inputContainer,
                { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface + '80'
                }
              ]}>
                <Mail size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.textSecondary }]}
                  value={email}
                  editable={false}
                />
              </View>
              <Text style={[styles.helperText, { color: colors.textTertiary }]}>
                Email cannot be changed
              </Text>
            </View>

            {/* Update Button */}
            <TouchableOpacity
              style={[
                styles.updateButton,
                { backgroundColor: colors.primary },
                loading && styles.disabledButton
              ]}
              onPress={handleUpdateProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.updateButtonText}>
                  Update Profile
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Account Info */}
          <View style={[styles.accountInfo, { backgroundColor: colors.surface }]}>
            <Text style={[styles.accountInfoTitle, { color: colors.text }]}>
              Account Information
            </Text>
            <View style={styles.accountInfoItem}>
              <Text style={[styles.accountInfoLabel, { color: colors.textSecondary }]}>
                Account Type
              </Text>
              <Text style={[styles.accountInfoValue, { color: colors.text }]}>
                {user?.user_metadata?.subscription_tier || 'Free'}
              </Text>
            </View>
            <View style={styles.accountInfoItem}>
              <Text style={[styles.accountInfoLabel, { color: colors.textSecondary }]}>
                Member Since
              </Text>
              <Text style={[styles.accountInfoValue, { color: colors.text }]}>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: spacing.md,
  },
  closeButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    gap: spacing.xs,
  },
  uploadButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  successText: {
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.base,
    marginLeft: spacing.sm,
  },
  fieldError: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  helperText: {
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  updateButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  disabledButton: {
    opacity: 0.7,
  },
  updateButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: 'white',
  },
  accountInfo: {
    padding: spacing.lg,
    borderRadius: 16,
    marginTop: spacing.xl,
  },
  accountInfoTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },
  accountInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  accountInfoLabel: {
    fontSize: typography.sizes.base,
  },
  accountInfoValue: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
});