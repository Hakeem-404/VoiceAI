import { useState, useEffect, useCallback } from 'react';
import { 
  addOfflineListener, 
  getOfflineStatus, 
  prepareOfflineData, 
  setOfflineMode 
} from '../services/offlineManager';
import { useSupabaseAuth } from './useSupabase';
import { OfflineStatus } from '../services/offlineManager';

export function useOfflineMode() {
  const { user } = useSupabaseAuth();
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>(getOfflineStatus());
  const [isPreparingData, setIsPreparingData] = useState(false);
  const [preparationProgress, setPreparationProgress] = useState(0);
  const [preparationError, setPreparationError] = useState<string | null>(null);

  // Listen for offline status changes
  useEffect(() => {
    const unsubscribe = addOfflineListener((status) => {
      setOfflineStatus(status);
    });
    
    return unsubscribe;
  }, []);

  // Enable offline mode
  const enableOfflineMode = useCallback(async () => {
    try {
      // First prepare offline data if user is logged in
      if (user) {
        setIsPreparingData(true);
        setPreparationProgress(0);
        setPreparationError(null);
        
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setPreparationProgress(prev => {
            const newProgress = prev + 5;
            return newProgress > 90 ? 90 : newProgress;
          });
        }, 500);
        
        // Prepare data
        const success = await prepareOfflineData(user.id);
        
        clearInterval(progressInterval);
        
        if (success) {
          setPreparationProgress(100);
          // Enable offline mode
          await setOfflineMode(true);
        } else {
          setPreparationError('Failed to prepare offline data');
          setPreparationProgress(0);
        }
      } else {
        // Just enable offline mode without preparing data
        await setOfflineMode(true);
      }
    } catch (error) {
      setPreparationError(error instanceof Error ? error.message : 'Unknown error');
      console.error('Error enabling offline mode:', error);
    } finally {
      setIsPreparingData(false);
    }
  }, [user]);

  // Disable offline mode
  const disableOfflineMode = useCallback(async () => {
    try {
      await setOfflineMode(false);
    } catch (error) {
      console.error('Error disabling offline mode:', error);
    }
  }, []);

  // Toggle offline mode
  const toggleOfflineMode = useCallback(async () => {
    if (offlineStatus.isOfflineMode) {
      await disableOfflineMode();
    } else {
      await enableOfflineMode();
    }
  }, [offlineStatus.isOfflineMode, enableOfflineMode, disableOfflineMode]);

  return {
    isOnline: offlineStatus.isOnline,
    isOfflineMode: offlineStatus.isOfflineMode,
    networkType: offlineStatus.networkType,
    lastSyncTime: offlineStatus.lastSyncTime,
    pendingOperations: offlineStatus.pendingOperations,
    isPreparingData,
    preparationProgress,
    preparationError,
    enableOfflineMode,
    disableOfflineMode,
    toggleOfflineMode,
  };
}