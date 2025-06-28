import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import { getData, saveData, saveWithExpiration, getWithExpiration } from '../lib/asyncStorage';

// Cache directory
const CACHE_DIR = FileSystem.cacheDirectory || FileSystem.documentDirectory;

// Cache configuration
interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  maxAge: number; // Maximum age in milliseconds
  defaultTTL: number; // Default time-to-live in milliseconds
}

// Default cache configuration
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 50 * 1024 * 1024, // 50MB
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
};

// Cache entry metadata
interface CacheEntryMetadata {
  key: string;
  url?: string;
  size: number;
  createdAt: number;
  lastAccessed: number;
  expiresAt: number;
  contentType?: string;
  etag?: string;
}

// Cache statistics
interface CacheStats {
  totalSize: number;
  totalEntries: number;
  oldestEntry: number;
  newestEntry: number;
}

// LRU Cache implementation
class LRUCache {
  private config: CacheConfig;
  private metadata: Map<string, CacheEntryMetadata>;
  private stats: CacheStats;
  
  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.metadata = new Map();
    this.stats = {
      totalSize: 0,
      totalEntries: 0,
      oldestEntry: Date.now(),
      newestEntry: 0,
    };
    
    // Load cache metadata
    this.loadMetadata();
  }
  
  // Load cache metadata from storage
  private async loadMetadata() {
    try {
      const metadata = await getData<Record<string, CacheEntryMetadata>>('cache_metadata');
      if (metadata) {
        this.metadata = new Map(Object.entries(metadata));
        this.updateStats();
      }
    } catch (error) {
      console.error('Error loading cache metadata:', error);
    }
  }
  
  // Save cache metadata to storage
  private async saveMetadata() {
    try {
      const metadata = Object.fromEntries(this.metadata.entries());
      await saveData('cache_metadata', metadata);
    } catch (error) {
      console.error('Error saving cache metadata:', error);
    }
  }
  
  // Update cache statistics
  private updateStats() {
    let totalSize = 0;
    let oldestEntry = Date.now();
    let newestEntry = 0;
    
    for (const entry of this.metadata.values()) {
      totalSize += entry.size;
      oldestEntry = Math.min(oldestEntry, entry.createdAt);
      newestEntry = Math.max(newestEntry, entry.createdAt);
    }
    
    this.stats = {
      totalSize,
      totalEntries: this.metadata.size,
      oldestEntry,
      newestEntry,
    };
  }
  
  // Generate a cache key from a URL or data
  public async generateCacheKey(source: string | object): Promise<string> {
    if (typeof source === 'string') {
      // For URLs, hash the URL
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        source
      );
      return hash.substring(0, 16);
    } else {
      // For objects, hash the JSON string
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        JSON.stringify(source)
      );
      return hash.substring(0, 16);
    }
  }
  
  // Get the file path for a cache key
  private getCacheFilePath(key: string, extension?: string): string {
    const ext = extension ? `.${extension}` : '';
    return `${CACHE_DIR}cache/${key}${ext}`;
  }
  
  // Ensure cache directory exists
  private async ensureCacheDirectory(): Promise<void> {
    if (Platform.OS === 'web') return;
    
    const cacheDir = `${CACHE_DIR}cache/`;
    
    try {
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      }
    } catch (error) {
      console.error('Error ensuring cache directory:', error);
    }
  }
  
  // Cache a file from a URL
  public async cacheFile(
    url: string,
    options: {
      key?: string;
      ttl?: number;
      extension?: string;
      headers?: Record<string, string>;
      priority?: 'high' | 'normal' | 'low';
    } = {}
  ): Promise<string | null> {
    if (Platform.OS === 'web') {
      // For web, just return the URL
      return url;
    }
    
    try {
      await this.ensureCacheDirectory();
      
      // Generate or use provided key
      const key = options.key || await this.generateCacheKey(url);
      const filePath = this.getCacheFilePath(key, options.extension);
      
      // Check if file already exists in cache
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        const metadata = this.metadata.get(key);
        if (metadata) {
          // Update last accessed time
          metadata.lastAccessed = Date.now();
          this.metadata.set(key, metadata);
          this.saveMetadata();
          return filePath;
        }
      }
      
      // Download the file
      const downloadResult = await FileSystem.downloadAsync(url, filePath, {
        headers: options.headers,
        cache: true,
      });
      
      if (downloadResult.status !== 200) {
        console.error(`Failed to download file: ${downloadResult.status}`);
        return null;
      }
      
      // Get file info
      const downloadedFileInfo = await FileSystem.getInfoAsync(filePath);
      
      // Create metadata
      const now = Date.now();
      const ttl = options.ttl || this.config.defaultTTL;
      
      const metadata: CacheEntryMetadata = {
        key,
        url,
        size: downloadedFileInfo.size || 0,
        createdAt: now,
        lastAccessed: now,
        expiresAt: now + ttl,
        contentType: downloadResult.headers['content-type'],
        etag: downloadResult.headers['etag'],
      };
      
      // Add to metadata
      this.metadata.set(key, metadata);
      this.updateStats();
      this.saveMetadata();
      
      // Check if we need to clean up
      if (this.stats.totalSize > this.config.maxSize) {
        this.cleanCache();
      }
      
      return filePath;
    } catch (error) {
      console.error('Error caching file:', error);
      return null;
    }
  }
  
  // Cache data (text or JSON)
  public async cacheData(
    key: string,
    data: string | object,
    options: {
      ttl?: number;
      contentType?: string;
    } = {}
  ): Promise<boolean> {
    if (Platform.OS === 'web') {
      // For web, use AsyncStorage
      const ttl = options.ttl || this.config.defaultTTL;
      await saveWithExpiration(key, data, ttl);
      return true;
    }
    
    try {
      await this.ensureCacheDirectory();
      
      const filePath = this.getCacheFilePath(key);
      const content = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Write the file
      await FileSystem.writeAsStringAsync(filePath, content);
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      // Create metadata
      const now = Date.now();
      const ttl = options.ttl || this.config.defaultTTL;
      
      const metadata: CacheEntryMetadata = {
        key,
        size: fileInfo.size || content.length,
        createdAt: now,
        lastAccessed: now,
        expiresAt: now + ttl,
        contentType: options.contentType || 'application/json',
      };
      
      // Add to metadata
      this.metadata.set(key, metadata);
      this.updateStats();
      this.saveMetadata();
      
      // Check if we need to clean up
      if (this.stats.totalSize > this.config.maxSize) {
        this.cleanCache();
      }
      
      return true;
    } catch (error) {
      console.error('Error caching data:', error);
      return false;
    }
  }
  
  // Get cached data
  public async getCachedData<T>(key: string): Promise<T | null> {
    if (Platform.OS === 'web') {
      // For web, use AsyncStorage
      return await getWithExpiration<T>(key);
    }
    
    try {
      const metadata = this.metadata.get(key);
      if (!metadata) return null;
      
      // Check if expired
      if (Date.now() > metadata.expiresAt) {
        this.removeFromCache(key);
        return null;
      }
      
      const filePath = this.getCacheFilePath(key);
      
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        this.metadata.delete(key);
        this.saveMetadata();
        return null;
      }
      
      // Read the file
      const content = await FileSystem.readAsStringAsync(filePath);
      
      // Update last accessed time
      metadata.lastAccessed = Date.now();
      this.metadata.set(key, metadata);
      this.saveMetadata();
      
      // Parse if JSON
      if (metadata.contentType === 'application/json') {
        return JSON.parse(content) as T;
      }
      
      return content as unknown as T;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }
  
  // Get cached file path
  public async getCachedFilePath(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    
    try {
      const metadata = this.metadata.get(key);
      if (!metadata) return null;
      
      // Check if expired
      if (Date.now() > metadata.expiresAt) {
        this.removeFromCache(key);
        return null;
      }
      
      const filePath = this.getCacheFilePath(key);
      
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        this.metadata.delete(key);
        this.saveMetadata();
        return null;
      }
      
      // Update last accessed time
      metadata.lastAccessed = Date.now();
      this.metadata.set(key, metadata);
      this.saveMetadata();
      
      return filePath;
    } catch (error) {
      console.error('Error getting cached file path:', error);
      return null;
    }
  }
  
  // Remove an item from cache
  public async removeFromCache(key: string): Promise<boolean> {
    try {
      const metadata = this.metadata.get(key);
      if (!metadata) return true;
      
      if (Platform.OS !== 'web') {
        const filePath = this.getCacheFilePath(key);
        
        // Delete the file
        await FileSystem.deleteAsync(filePath, { idempotent: true });
      }
      
      // Remove from metadata
      this.metadata.delete(key);
      this.updateStats();
      this.saveMetadata();
      
      return true;
    } catch (error) {
      console.error('Error removing from cache:', error);
      return false;
    }
  }
  
  // Clean the cache (remove oldest entries)
  public async cleanCache(targetSize?: number): Promise<number> {
    if (Platform.OS === 'web') return 0;
    
    const target = targetSize || (this.config.maxSize * 0.8); // Default to 80% of max size
    
    if (this.stats.totalSize <= target) {
      return 0; // No need to clean
    }
    
    try {
      // Sort entries by last accessed time
      const entries = Array.from(this.metadata.entries())
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
      
      let removedCount = 0;
      let removedSize = 0;
      
      for (const [key, metadata] of entries) {
        // Remove the entry
        const filePath = this.getCacheFilePath(key);
        await FileSystem.deleteAsync(filePath, { idempotent: true });
        
        // Update stats
        removedSize += metadata.size;
        removedCount++;
        
        // Remove from metadata
        this.metadata.delete(key);
        
        // Check if we've removed enough
        if (this.stats.totalSize - removedSize <= target) {
          break;
        }
      }
      
      this.updateStats();
      this.saveMetadata();
      
      return removedCount;
    } catch (error) {
      console.error('Error cleaning cache:', error);
      return 0;
    }
  }
  
  // Clear expired entries
  public async clearExpired(): Promise<number> {
    if (Platform.OS === 'web') return 0;
    
    try {
      const now = Date.now();
      const expiredKeys: string[] = [];
      
      // Find expired entries
      for (const [key, metadata] of this.metadata.entries()) {
        if (now > metadata.expiresAt) {
          expiredKeys.push(key);
        }
      }
      
      // Remove expired entries
      for (const key of expiredKeys) {
        await this.removeFromCache(key);
      }
      
      return expiredKeys.length;
    } catch (error) {
      console.error('Error clearing expired cache:', error);
      return 0;
    }
  }
  
  // Clear all cache
  public async clearAll(): Promise<boolean> {
    if (Platform.OS === 'web') {
      // For web, clear relevant AsyncStorage keys
      // This would need to be implemented based on your caching strategy
      return true;
    }
    
    try {
      const cacheDir = `${CACHE_DIR}cache/`;
      
      // Delete the directory
      await FileSystem.deleteAsync(cacheDir, { idempotent: true });
      
      // Recreate the directory
      await this.ensureCacheDirectory();
      
      // Clear metadata
      this.metadata.clear();
      this.updateStats();
      this.saveMetadata();
      
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }
  
  // Get cache statistics
  public getStats(): CacheStats {
    return { ...this.stats };
  }
  
  // Check if an item exists in cache and is not expired
  public async hasValidCacheItem(key: string): Promise<boolean> {
    if (Platform.OS === 'web') {
      const data = await getWithExpiration(key);
      return data !== null;
    }
    
    const metadata = this.metadata.get(key);
    if (!metadata) return false;
    
    // Check if expired
    if (Date.now() > metadata.expiresAt) {
      this.removeFromCache(key);
      return false;
    }
    
    // Check if file exists
    const filePath = this.getCacheFilePath(key);
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    
    return fileInfo.exists;
  }
}

// Create and export a singleton instance
export const cacheManager = new LRUCache();

// API response caching
export const cacheApiResponse = async (
  url: string,
  response: any,
  ttl?: number
): Promise<void> => {
  try {
    const key = await cacheManager.generateCacheKey(url);
    await cacheManager.cacheData(key, response, {
      ttl,
      contentType: 'application/json',
    });
  } catch (error) {
    console.error('Error caching API response:', error);
  }
};

// Get cached API response
export const getCachedApiResponse = async <T>(url: string): Promise<T | null> => {
  try {
    const key = await cacheManager.generateCacheKey(url);
    return await cacheManager.getCachedData<T>(key);
  } catch (error) {
    console.error('Error getting cached API response:', error);
    return null;
  }
};

// Cache an image
export const cacheImage = async (
  imageUrl: string,
  options?: {
    ttl?: number;
    headers?: Record<string, string>;
  }
): Promise<string | null> => {
  try {
    // Extract file extension
    const extension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
    
    // Generate key from URL
    const key = await cacheManager.generateCacheKey(imageUrl);
    
    // Cache the image
    return await cacheManager.cacheFile(imageUrl, {
      key,
      extension,
      ttl: options?.ttl,
      headers: options?.headers,
    });
  } catch (error) {
    console.error('Error caching image:', error);
    return null;
  }
};

// Get cached image path
export const getCachedImagePath = async (imageUrl: string): Promise<string | null> => {
  try {
    const key = await cacheManager.generateCacheKey(imageUrl);
    return await cacheManager.getCachedFilePath(key);
  } catch (error) {
    console.error('Error getting cached image path:', error);
    return null;
  }
};

// Cache audio file
export const cacheAudio = async (
  audioUrl: string,
  options?: {
    ttl?: number;
    headers?: Record<string, string>;
  }
): Promise<string | null> => {
  try {
    // Extract file extension
    const extension = audioUrl.split('.').pop()?.split('?')[0] || 'm4a';
    
    // Generate key from URL
    const key = await cacheManager.generateCacheKey(audioUrl);
    
    // Cache the audio file
    return await cacheManager.cacheFile(audioUrl, {
      key,
      extension,
      ttl: options?.ttl,
      headers: options?.headers,
    });
  } catch (error) {
    console.error('Error caching audio:', error);
    return null;
  }
};

// Get cached audio path
export const getCachedAudioPath = async (audioUrl: string): Promise<string | null> => {
  try {
    const key = await cacheManager.generateCacheKey(audioUrl);
    return await cacheManager.getCachedFilePath(key);
  } catch (error) {
    console.error('Error getting cached audio path:', error);
    return null;
  }
};

// Initialize cache service
export const initializeCacheService = async (): Promise<void> => {
  try {
    // Clear expired cache entries
    await cacheManager.clearExpired();
    
    // Ensure cache size is within limits
    if (Platform.OS !== 'web') {
      const stats = cacheManager.getStats();
      if (stats.totalSize > DEFAULT_CACHE_CONFIG.maxSize) {
        await cacheManager.cleanCache();
      }
    }
  } catch (error) {
    console.error('Error initializing cache service:', error);
  }
};

// Initialize the cache service when this module is imported
initializeCacheService().catch(error => {
  console.error('Cache service initialization error:', error);
});