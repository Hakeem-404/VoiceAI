import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export function useFrameworkReady() {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Simple framework readiness check
    const checkFrameworkReady = async () => {
      try {
        // Add any framework initialization checks here
        if (Platform.OS === 'web') {
          // Web is typically ready immediately
          setIsReady(true);
        } else {
          // For native, you might want to check for native modules
          setIsReady(true);
        }
      } catch (error) {
        console.error('Framework readiness check failed:', error);
        setIsReady(true); // Still proceed
      }
    };
    
    checkFrameworkReady();
  }, []);
  
  return isReady;