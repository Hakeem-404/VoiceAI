import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from './useSupabase';
import * as supabaseService from '../services/supabaseService';

export function useVoiceProfiles() {
  const { user } = useSupabaseAuth();
  const [voiceProfiles, setVoiceProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load voice profiles
  const loadVoiceProfiles = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await supabaseService.getVoiceProfiles(user.id);
      setVoiceProfiles(data);
    } catch (err) {
      console.error('Failed to load voice profiles:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create voice profile
  const createVoiceProfile = useCallback(async (
    name: string,
    description: string,
    elevenlabsVoiceId: string,
    voiceSettings: any,
    isCustom: boolean = false
  ) => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await supabaseService.createVoiceProfile(
        user.id,
        name,
        description,
        elevenlabsVoiceId,
        voiceSettings,
        isCustom
      );
      
      // Update voice profiles list
      setVoiceProfiles(prev => [...prev, data]);
      
      return data;
    } catch (err) {
      console.error('Failed to create voice profile:', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update voice profile
  const updateVoiceProfile = useCallback(async (
    profileId: string,
    updates: any
  ) => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await supabaseService.updateVoiceProfile(
        profileId,
        updates
      );
      
      // Update voice profiles list
      setVoiceProfiles(prev => 
        prev.map(profile => profile.id === profileId ? data : profile)
      );
      
      return data;
    } catch (err) {
      console.error('Failed to update voice profile:', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Delete voice profile
  const deleteVoiceProfile = useCallback(async (profileId: string) => {
    if (!user) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      await supabaseService.deleteVoiceProfile(profileId);
      
      // Update voice profiles list
      setVoiceProfiles(prev => prev.filter(profile => profile.id !== profileId));
      
      return true;
    } catch (err) {
      console.error('Failed to delete voice profile:', err);
      setError(err as Error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Increment usage count
  const incrementUsageCount = useCallback(async (profileId: string) => {
    if (!user) return;
    
    try {
      const profile = voiceProfiles.find(p => p.id === profileId);
      if (!profile) return;
      
      await supabaseService.updateVoiceProfile(
        profileId,
        { usage_count: profile.usage_count + 1 }
      );
      
      // Update voice profiles list
      setVoiceProfiles(prev => 
        prev.map(p => p.id === profileId 
          ? { ...p, usage_count: p.usage_count + 1 } 
          : p
        )
      );
    } catch (err) {
      console.error('Failed to increment usage count:', err);
    }
  }, [user, voiceProfiles]);

  // Get voice profile for mode
  const getVoiceProfileForMode = useCallback((mode: string) => {
    // Find profile that matches the mode
    const profile = voiceProfiles.find(p => 
      p.voice_settings?.conversation_modes?.includes(mode)
    );
    
    // Return first profile if no match found
    return profile || voiceProfiles[0];
  }, [voiceProfiles]);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadVoiceProfiles();
    }
  }, [user, loadVoiceProfiles]);

  return {
    voiceProfiles,
    loading,
    error,
    loadVoiceProfiles,
    createVoiceProfile,
    updateVoiceProfile,
    deleteVoiceProfile,
    incrementUsageCount,
    getVoiceProfileForMode,
  };
}