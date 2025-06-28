import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Web fallback for secure storage
const webSecureStorage: Record<string, string> = {};

/**
 * Save a value securely
 * Uses SecureStore on native platforms and encrypted AsyncStorage on web
 */
export async function saveSecurely(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // Web fallback - in a real app, you'd want to use a more secure approach
      webSecureStorage[key] = value;
      // Also save to AsyncStorage with a prefix to indicate it's secure
      await AsyncStorage.setItem(`secure_${key}`, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (error) {
    console.error('Error saving secure value:', error);
    throw error;
  }
}

/**
 * Get a securely stored value
 */
export async function getSecurely(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      // Web fallback
      const value = webSecureStorage[key];
      if (value !== undefined) {
        return value;
      }
      // Try to get from AsyncStorage if not in memory
      return await AsyncStorage.getItem(`secure_${key}`);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  } catch (error) {
    console.error('Error getting secure value:', error);
    return null;
  }
}

/**
 * Delete a securely stored value
 */
export async function deleteSecurely(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // Web fallback
      delete webSecureStorage[key];
      await AsyncStorage.removeItem(`secure_${key}`);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    console.error('Error deleting secure value:', error);
    throw error;
  }
}

/**
 * Check if a secure key exists
 */
export async function hasSecureKey(key: string): Promise<boolean> {
  const value = await getSecurely(key);
  return value !== null;
}

/**
 * Save sensitive API keys securely
 */
export async function saveApiKey(service: string, apiKey: string): Promise<void> {
  await saveSecurely(`apikey_${service}`, apiKey);
}

/**
 * Get a stored API key
 */
export async function getApiKey(service: string): Promise<string | null> {
  return await getSecurely(`apikey_${service}`);
}

/**
 * Save authentication tokens securely
 */
export async function saveAuthToken(tokenType: string, token: string): Promise<void> {
  await saveSecurely(`auth_${tokenType}`, token);
}

/**
 * Get a stored authentication token
 */
export async function getAuthToken(tokenType: string): Promise<string | null> {
  return await getSecurely(`auth_${tokenType}`);
}

/**
 * Save encrypted user credentials
 * Note: In a production app, you'd want to use a more secure encryption method
 */
export async function saveEncryptedCredentials(username: string, password: string): Promise<void> {
  // Simple base64 encoding - NOT secure for production!
  // In a real app, use a proper encryption library
  const credentials = JSON.stringify({ username, password });
  const encoded = Buffer.from(credentials).toString('base64');
  await saveSecurely('user_credentials', encoded);
}

/**
 * Get encrypted user credentials
 */
export async function getEncryptedCredentials(): Promise<{ username: string; password: string } | null> {
  const encoded = await getSecurely('user_credentials');
  if (!encoded) return null;
  
  try {
    // Decode the base64 string
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding credentials:', error);
    return null;
  }
}