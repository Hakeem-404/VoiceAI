import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { storageService } from '../services/storageService';
import { syncService } from '../services/syncService';

export function useOfflineSupport() {
  const [isOnline, setIsOnline] = useState(true);
  const [isInitialSync, setIsInitialSync] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useState(0);

  // Initialize network monitoring
  useEffect(() => {
    const initNetworkMonitoring = async () => {
      if (Platform.OS !== 'web') {
        // For native platforms, use NetInfo
        const unsubscribe = NetInfo.addEventListener(state => {
          setIsOnline(state.isConnected ?? false);
        });
        
        // Get initial state
        const state = await NetInfo.fetch();
        setIsOnline(state.isConnected ?? false);
        
        return () => unsubscribe();
      } else {
        // For web, use navigator.onLine
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        setIsOnline(navigator.onLine);
        
        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
      }
    };
    
    initNetworkMonitoring();
  }, []);

  // Load last sync time
  useEffect(() => {
    const loadLastSync = async () => {
      try {
        const timestamp = await storageService.getLastSync();
        if (timestamp > 0) {
          setLastSyncTime(new Date(timestamp));
          setIsInitialSync(false);
        }
      } catch (error) {
        console.error('Failed to load last sync time:', error);
      }
    };
    
    loadLastSync();
  }, []);

  // Sync when coming online
  useEffect(() => {
    if (isOnline) {
      const syncData = async () => {
        try {
          await syncService.syncAll();
          setLastSyncTime(new Date());
          setPendingChanges(0);
        } catch (error) {
          console.error('Failed to sync data:', error);
        }
      };
      
      syncData();
    }
  }, [isOnline]);

  // Force sync
  const forceSync = useCallback(async () => {
    if (!isOnline) {
      return { success: false, error: 'Device is offline' };
    }
    
    try {
      await syncService.syncAll();
      setLastSyncTime(new Date());
      setPendingChanges(0);
      return { success: true };
    } catch (error) {
      console.error('Failed to force sync:', error);
      return { success: false, error: 'Sync failed' };
    }
  }, [isOnline]);

  // Get sync status
  const getSyncStatus = useCallback(() => {
    return {
      isOnline,
      lastSyncTime,
      pendingChanges,
      isInitialSync,
    };
  }, [isOnline, lastSyncTime, pendingChanges, isInitialSync]);

  // Add pending change
  const addPendingChange = useCallback(() => {
    setPendingChanges(prev => prev + 1);
  }, []);

  return {
    isOnline,
    lastSyncTime,
    pendingChanges,
    forceSync,
    getSyncStatus,
    addPendingChange,
  };
}