import { useUserPersistence } from './useUserPersistence';
import { useConversationPersistence } from './useConversationPersistence';
import { useProgressPersistence } from './useProgressPersistence';
import { useOfflineSupport } from './useOfflineSupport';

export function useDataPersistence() {
  const userPersistence = useUserPersistence();
  const conversationPersistence = useConversationPersistence();
  const progressPersistence = useProgressPersistence();
  const offlineSupport = useOfflineSupport();

  return {
    // User data
    user: userPersistence.user,
    userLoading: userPersistence.loading,
    userError: userPersistence.error,
    theme: userPersistence.theme,
    updatePreferences: userPersistence.updatePreferences,
    setTheme: userPersistence.setTheme,
    addRecentMode: userPersistence.addRecentMode,
    setFavoriteMode: userPersistence.setFavoriteMode,
    clearUserData: userPersistence.clearUserData,
    loadUserData: userPersistence.loadUserData,
    
    // Conversation data
    conversations: conversationPersistence.conversations,
    conversationsLoading: conversationPersistence.loading,
    conversationsError: conversationPersistence.error,
    createConversation: conversationPersistence.createConversation,
    addMessage: conversationPersistence.addMessage,
    updateConversation: conversationPersistence.updateConversation,
    deleteConversation: conversationPersistence.deleteConversation,
    toggleBookmark: conversationPersistence.toggleBookmark,
    getConversation: conversationPersistence.getConversation,
    searchConversations: conversationPersistence.searchConversations,
    loadConversations: conversationPersistence.loadConversations,
    
    // Progress data
    progress: progressPersistence.progress,
    progressLoading: progressPersistence.loading,
    progressError: progressPersistence.error,
    streakDays: progressPersistence.streakDays,
    updateProgressAfterConversation: progressPersistence.updateProgressAfterConversation,
    addAchievement: progressPersistence.addAchievement,
    getProgressForMode: progressPersistence.getProgressForMode,
    getAllAchievements: progressPersistence.getAllAchievements,
    loadProgress: progressPersistence.loadProgress,
    
    // Offline support
    isOnline: offlineSupport.isOnline,
    lastSyncTime: offlineSupport.lastSyncTime,
    pendingChanges: offlineSupport.pendingChanges,
    forceSync: offlineSupport.forceSync,
    getSyncStatus: offlineSupport.getSyncStatus,
    addPendingChange: offlineSupport.addPendingChange,
  };
}