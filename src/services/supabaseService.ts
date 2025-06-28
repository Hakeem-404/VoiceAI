import supabase, { performOptimisticUpdate } from '../lib/supabase';
import { Database } from '../types/supabase';
import { DocumentAnalysis } from '../types';

// User-related functions
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) throw error;
  return data;
};

export const updateUserProfile = async (
  userId: string, 
  updates: Partial<Database['public']['Tables']['users']['Update']>
) => {
  // First check if user exists
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();
    
  if (checkError && checkError.code !== 'PGRST116') {
    // Error other than "not found"
    throw checkError;
  }
  
  if (!existingUser) {
    // User doesn't exist, create it
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        ...updates
      })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
  
  // User exists, update it
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const updateUserPreferences = async (
  userId: string,
  preferences: any
) => {
  return performOptimisticUpdate<Database['public']['Tables']['users']['Row']>(
    'users',
    { id: userId },
    { preferences }
  );
};

// Conversation-related functions
export const getConversations = async (
  userId: string,
  limit = 20,
  offset = 0,
  filters?: {
    mode?: string;
    isBookmarked?: boolean;
    startDate?: string;
    endDate?: string;
  }
) => {
  let query = supabase
    .from('conversations')
    .select('*, messages!messages_conversation_id_fkey(count)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
    
  // Apply filters if provided
  if (filters?.mode) {
    query = query.eq('mode', filters.mode);
  }
  
  if (filters?.isBookmarked !== undefined) {
    query = query.eq('is_bookmarked', filters.isBookmarked);
  }
  
  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  
  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
};

export const getConversationById = async (conversationId: string) => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, messages(*)')
    .eq('id', conversationId)
    .single();
    
  if (error) throw error;
  return data;
};

export const createConversation = async (
  userId: string,
  mode: string,
  title: string,
  jobDescription?: string,
  cvText?: string,
  personalizedQuestions?: any[]
) => {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      mode,
      title,
      job_description: jobDescription,
      cv_text: cvText,
      personalized_questions: personalizedQuestions || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const updateConversation = async (
  conversationId: string,
  updates: Partial<Database['public']['Tables']['conversations']['Update']>
) => {
  const { data, error } = await supabase
    .from('conversations')
    .update(updates)
    .eq('id', conversationId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const deleteConversation = async (conversationId: string) => {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId);
    
  if (error) throw error;
  return true;
};

export const toggleConversationBookmark = async (
  conversationId: string,
  isBookmarked: boolean
) => {
  return performOptimisticUpdate<Database['public']['Tables']['conversations']['Row']>(
    'conversations',
    { id: conversationId },
    { is_bookmarked: isBookmarked }
  );
};

// Message-related functions
export const getMessages = async (
  conversationId: string,
  limit = 50,
  offset = 0
) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('message_index', { ascending: true })
    .range(offset, offset + limit - 1);
    
  if (error) throw error;
  return data;
};

export const addMessage = async (
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  messageIndex: number,
  audioUrl?: string
) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      message_index: messageIndex,
      audio_url: audioUrl,
      timestamp: new Date().toISOString()
    })
    .select()
    .single();
    
  if (error) throw error;
  
  // Update conversation message count
  await supabase
    .from('conversations')
    .update({ 
      message_count: messageIndex + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', conversationId);
    
  return data;
};

export const updateMessageFeedback = async (
  messageId: string,
  feedbackData: any
) => {
  const { data, error } = await supabase
    .from('messages')
    .update({ feedback_data: feedbackData })
    .eq('id', messageId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const toggleMessageHighlight = async (
  messageId: string,
  isHighlighted: boolean
) => {
  return performOptimisticUpdate<Database['public']['Tables']['messages']['Row']>(
    'messages',
    { id: messageId },
    { is_highlighted: isHighlighted }
  );
};

// Progress-related functions
export const getUserProgress = async (
  userId: string,
  mode?: string
) => {
  let query = supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId);
    
  if (mode) {
    query = query.eq('mode', mode);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
};

export const updateUserProgress = async (
  userId: string,
  mode: string,
  updates: Partial<Database['public']['Tables']['user_progress']['Update']>
) => {
  // Check if progress record exists
  const { data: existingProgress } = await supabase
    .from('user_progress')
    .select('id')
    .eq('user_id', userId)
    .eq('mode', mode)
    .single();
    
  if (existingProgress) {
    // Update existing record
    const { data, error } = await supabase
      .from('user_progress')
      .update(updates)
      .eq('id', existingProgress.id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } else {
    // Create new record
    const { data, error } = await supabase
      .from('user_progress')
      .insert({
        user_id: userId,
        mode,
        ...updates,
      })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
};

// Voice profile functions
export const getVoiceProfiles = async (userId: string) => {
  const { data, error } = await supabase
    .from('voice_profiles')
    .select('*')
    .eq('user_id', userId);
    
  if (error) throw error;
  return data;
};

export const createVoiceProfile = async (
  userId: string,
  name: string,
  description: string,
  elevenlabsVoiceId: string,
  voiceSettings: any,
  isCustom: boolean = false
) => {
  const { data, error } = await supabase
    .from('voice_profiles')
    .insert({
      user_id: userId,
      name,
      description,
      elevenlabs_voice_id: elevenlabsVoiceId,
      voice_settings: voiceSettings,
      is_custom: isCustom,
      created_at: new Date().toISOString()
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const updateVoiceProfile = async (
  profileId: string,
  updates: Partial<Database['public']['Tables']['voice_profiles']['Update']>
) => {
  const { data, error } = await supabase
    .from('voice_profiles')
    .update(updates)
    .eq('id', profileId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const deleteVoiceProfile = async (profileId: string) => {
  const { error } = await supabase
    .from('voice_profiles')
    .delete()
    .eq('id', profileId);
    
  if (error) throw error;
  return true;
};

// Challenge-related functions
export const getDailyChallenges = async (active: boolean = true) => {
  const { data, error } = await supabase
    .from('daily_challenges')
    .select('*')
    .eq('is_active', active)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
};

export const getUserChallenges = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_challenges')
    .select('*, daily_challenges(*)')
    .eq('user_id', userId);
    
  if (error) throw error;
  return data;
};

export const completeChallenge = async (
  userId: string,
  challengeId: string
) => {
  const { data, error } = await supabase
    .from('user_challenges')
    .upsert({
      user_id: userId,
      challenge_id: challengeId,
      completed: true,
      completed_at: new Date().toISOString()
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

// Storage functions
export const uploadAudio = async (
  userId: string,
  file: Blob,
  filename: string
) => {
  const filePath = `${userId}/${filename}`;
  
  const { data, error } = await supabase
    .storage
    .from('audio')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
    
  if (error) throw error;
  
  // Get public URL
  const { data: urlData } = await supabase
    .storage
    .from('audio')
    .createSignedUrl(filePath, 60 * 60 * 24); // 24 hour expiry
    
  return urlData?.signedUrl;
};

export const uploadAvatar = async (
  userId: string,
  file: Blob
) => {
  const filePath = `${userId}/avatar.jpg`;
  
  const { data, error } = await supabase
    .storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });
    
  if (error) throw error;
  
  // Get public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from('avatars')
    .getPublicUrl(filePath);
    
  // Update user profile with new avatar URL
  await updateUserProfile(userId, { avatar_url: publicUrl });
  
  return publicUrl;
};

// Document analysis functions
export const saveDocumentAnalysis = async (
  userId: string,
  conversationId: string,
  jobDescription: string,
  cvText: string,
  analysis: DocumentAnalysis
) => {
  const { data, error } = await supabase
    .from('conversations')
    .update({
      job_description: jobDescription,
      cv_text: cvText,
      personalized_questions: analysis.analysis.interviewQuestions || [],
      updated_at: new Date().toISOString()
    })
    .eq('id', conversationId)
    .eq('user_id', userId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

// Export conversation functions
export const exportConversation = async (
  conversationId: string,
  format: 'json' | 'txt' | 'pdf'
) => {
  // Get conversation with messages
  const conversation = await getConversationById(conversationId);
  
  if (format === 'json') {
    // Create JSON file
    const jsonData = JSON.stringify(conversation, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    
    // Upload to storage
    const filename = `conversation_${conversationId}_${Date.now()}.json`;
    const filePath = `${conversation.user_id}/${filename}`;
    
    const { data, error } = await supabase
      .storage
      .from('exports')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) throw error;
    
    // Get download URL
    const { data: urlData } = await supabase
      .storage
      .from('exports')
      .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
      
    return urlData?.signedUrl;
  }
  
  // For other formats, we'd implement similar logic
  // For now, just return JSON format
  return null;
};