import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

/**
 * Save a value to AsyncStorage
 */
export async function saveData(key: string, value: any): Promise<void> {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error(`Error saving data for key ${key}:`, error);
    throw error;
  }
}

/**
 * Get a value from AsyncStorage
 */
export async function getData<T>(key: string): Promise<T | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error(`Error getting data for key ${key}:`, error);
    return null;
  }
}

/**
 * Remove a value from AsyncStorage
 */
export async function removeData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing data for key ${key}:`, error);
    throw error;
  }
}

/**
 * Clear all data from AsyncStorage
 */
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
}

/**
 * Get all keys from AsyncStorage
 */
export async function getAllKeys(): Promise<string[]> {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (error) {
    console.error('Error getting all keys:', error);
    return [];
  }
}

/**
 * Get multiple items from AsyncStorage
 */
export async function getMultipleData(keys: string[]): Promise<Record<string, any>> {
  try {
    const result: Record<string, any> = {};
    const pairs = await AsyncStorage.multiGet(keys);
    
    pairs.forEach(([key, value]) => {
      if (value) {
        result[key] = JSON.parse(value);
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error getting multiple data:', error);
    return {};
  }
}

/**
 * Save multiple items to AsyncStorage
 */
export async function saveMultipleData(data: Record<string, any>): Promise<void> {
  try {
    const pairs = Object.entries(data).map(([key, value]) => [
      key,
      JSON.stringify(value),
    ]);
    
    await AsyncStorage.multiSet(pairs as [string, string][]);
  } catch (error) {
    console.error('Error saving multiple data:', error);
    throw error;
  }
}

/**
 * Generate a cache key with hash for complex objects
 */
export async function generateCacheKey(prefix: string, data: any): Promise<string> {
  try {
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      stringData
    );
    return `${prefix}_${hash.substring(0, 10)}`;
  } catch (error) {
    console.error('Error generating cache key:', error);
    // Fallback to a timestamp-based key
    return `${prefix}_${Date.now()}`;
  }
}

/**
 * Save data with expiration
 */
export async function saveWithExpiration(key: string, value: any, expirationMs: number): Promise<void> {
  try {
    const item = {
      value,
      expiry: Date.now() + expirationMs,
    };
    await saveData(key, item);
  } catch (error) {
    console.error(`Error saving data with expiration for key ${key}:`, error);
    throw error;
  }
}

/**
 * Get data with expiration check
 */
export async function getWithExpiration<T>(key: string): Promise<T | null> {
  try {
    const item = await getData<{ value: T; expiry: number }>(key);
    
    if (!item) {
      return null;
    }
    
    // Check if the item has expired
    if (Date.now() > item.expiry) {
      // Item has expired, remove it
      await removeData(key);
      return null;
    }
    
    return item.value;
  } catch (error) {
    console.error(`Error getting data with expiration for key ${key}:`, error);
    return null;
  }
}

// Constants for common keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  AUTH_SESSION: 'auth_session',
  FEATURE_FLAGS: 'feature_flags',
  CACHE_POLICY: 'cache_policy',
  LAST_SYNC: 'last_sync',
  OFFLINE_MODE: 'offline_mode',
  NETWORK_PREFERENCES: 'network_preferences',
  RECENT_SEARCHES: 'recent_searches',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  APP_SETTINGS: 'app_settings',
};