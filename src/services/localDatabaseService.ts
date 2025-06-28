import { executeQuery, generateId, getDatabase } from '../lib/database';
import { ConversationMessage } from '../../types/api';
import { Conversation, Message } from '../types';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Conversation operations
export const saveLocalConversation = async (conversation: Conversation, userId?: string): Promise<string> => {
  const id = conversation.id.startsWith('local_') ? conversation.id : `local_${generateId()}`;
  
  const query = `
    INSERT OR REPLACE INTO local_conversations (
      id, user_id, remote_id, mode, title, duration_seconds, message_count,
      quality_score, feedback_summary, job_description, cv_text, personalized_questions,
      created_at, updated_at, is_bookmarked, sharing_settings, is_synced, sync_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
  
  const remoteId = conversation.id.startsWith('local_') ? null : conversation.id;
  const feedbackSummary = conversation.feedback ? JSON.stringify(conversation.feedback) : null;
  const sharingSettings = JSON.stringify(conversation.sharingSettings || {});
  const personalizedQuestions = JSON.stringify(conversation.configuration?.customSettings?.personalizedQuestions || []);
  
  const params = [
    id,
    userId || null,
    remoteId,
    conversation.mode.id,
    conversation.title,
    conversation.duration,
    conversation.messages.length,
    conversation.feedback?.scores.overall || 0,
    feedbackSummary,
    conversation.configuration?.customSettings?.jobDescription || null,
    conversation.configuration?.customSettings?.cvContent || null,
    personalizedQuestions,
    conversation.createdAt.toISOString(),
    conversation.updatedAt.toISOString(),
    conversation.isBookmarked ? 1 : 0,
    sharingSettings,
    remoteId ? 1 : 0,
    remoteId ? 'synced' : 'pending'
  ];
  
  return new Promise((resolve, reject) => {
    executeQuery(
      query,
      params,
      (result) => {
        // Add to full-text search index
        addToSearchIndex(id, conversation.title, conversation.messages);
        resolve(id);
      },
      (error) => {
        reject(error);
      }
    );
  });
};

// Add conversation to full-text search index
const addToSearchIndex = (id: string, title: string, messages: ConversationMessage[]) => {
  // Combine all message content for indexing
  const content = messages.map(msg => msg.content).join(' ');
  
  // First delete any existing entry
  executeQuery(
    'DELETE FROM conversation_fts WHERE id = ?;',
    [id],
    () => {
      // Then insert the new entry
      executeQuery(
        'INSERT INTO conversation_fts (id, title, content) VALUES (?, ?, ?);',
        [id, title || '', content],
        () => {},
        (error) => console.error('Error adding to search index:', error)
      );
    },
    (error) => console.error('Error removing from search index:', error)
  );
};

// Get local conversations
export const getLocalConversations = (
  userId?: string,
  limit = 20,
  offset = 0,
  filters?: {
    mode?: string;
    isBookmarked?: boolean;
    searchQuery?: string;
  }
): Promise<Conversation[]> => {
  let query = `
    SELECT c.*, COUNT(m.id) as message_count
    FROM local_conversations c
    LEFT JOIN local_messages m ON c.id = m.conversation_id
  `;
  
  const params: any[] = [];
  
  // Add WHERE clauses
  const whereClauses: string[] = [];
  
  if (userId) {
    whereClauses.push('c.user_id = ?');
    params.push(userId);
  }
  
  if (filters?.mode) {
    whereClauses.push('c.mode = ?');
    params.push(filters.mode);
  }
  
  if (filters?.isBookmarked !== undefined) {
    whereClauses.push('c.is_bookmarked = ?');
    params.push(filters.isBookmarked ? 1 : 0);
  }
  
  // Handle full-text search
  if (filters?.searchQuery) {
    query = `
      SELECT c.*, COUNT(m.id) as message_count
      FROM conversation_fts fts
      JOIN local_conversations c ON fts.id = c.id
      LEFT JOIN local_messages m ON c.id = m.conversation_id
      WHERE fts.title MATCH ? OR fts.content MATCH ?
    `;
    params.push(filters.searchQuery, filters.searchQuery);
    
    // Add additional WHERE clauses
    if (userId) {
      query += ' AND c.user_id = ?';
      params.push(userId);
    }
    
    if (filters?.mode) {
      query += ' AND c.mode = ?';
      params.push(filters.mode);
    }
    
    if (filters?.isBookmarked !== undefined) {
      query += ' AND c.is_bookmarked = ?';
      params.push(filters.isBookmarked ? 1 : 0);
    }
  } else if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }
  
  // Add GROUP BY, ORDER BY, and LIMIT
  query += `
    GROUP BY c.id
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?;
  `;
  
  params.push(limit, offset);
  
  return new Promise((resolve, reject) => {
    executeQuery(
      query,
      params,
      (result) => {
        const conversations: Conversation[] = [];
        
        for (let i = 0; i < result.rows.length; i++) {
          const row = result.rows.item(i);
          
          // Parse JSON fields
          const feedbackSummary = row.feedback_summary ? JSON.parse(row.feedback_summary) : null;
          const sharingSettings = row.sharing_settings ? JSON.parse(row.sharing_settings) : {};
          const personalizedQuestions = row.personalized_questions ? JSON.parse(row.personalized_questions) : [];
          
          conversations.push({
            id: row.id,
            mode: {
              id: row.mode,
              name: row.mode.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
              description: '',
              icon: '',
              systemPrompt: '',
              category: 'social',
              difficulty: 'beginner',
              estimatedDuration: 0,
              color: { primary: '#6366F1', secondary: '#8B5CF6', gradient: ['#6366F1', '#8B5CF6'] },
              features: [],
              topics: [],
              aiPersonalities: [],
              sessionTypes: {
                quick: { duration: 0, description: '' },
                standard: { duration: 0, description: '' },
                extended: { duration: 0, description: '' }
              }
            },
            title: row.title || `${row.mode.replace('-', ' ')} - ${new Date(row.created_at).toLocaleDateString()}`,
            duration: row.duration_seconds,
            messages: [],
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            bookmarks: [],
            highlights: [],
            isBookmarked: !!row.is_bookmarked,
            feedback: feedbackSummary,
            sharingSettings,
            configuration: {
              customSettings: {
                jobDescription: row.job_description,
                cvContent: row.cv_text,
                personalizedQuestions
              }
            }
          });
        }
        
        resolve(conversations);
      },
      (error) => {
        reject(error);
      }
    );
  });
};

// Get a single conversation with messages
export const getLocalConversationWithMessages = (conversationId: string): Promise<Conversation | null> => {
  return new Promise((resolve, reject) => {
    // First get the conversation
    executeQuery(
      `SELECT * FROM local_conversations WHERE id = ?;`,
      [conversationId],
      (result) => {
        if (result.rows.length === 0) {
          resolve(null);
          return;
        }
        
        const row = result.rows.item(0);
        
        // Parse JSON fields
        const feedbackSummary = row.feedback_summary ? JSON.parse(row.feedback_summary) : null;
        const sharingSettings = row.sharing_settings ? JSON.parse(row.sharing_settings) : {};
        const personalizedQuestions = row.personalized_questions ? JSON.parse(row.personalized_questions) : [];
        
        const conversation: Conversation = {
          id: row.id,
          mode: {
            id: row.mode,
            name: row.mode.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: '',
            icon: '',
            systemPrompt: '',
            category: 'social',
            difficulty: 'beginner',
            estimatedDuration: 0,
            color: { primary: '#6366F1', secondary: '#8B5CF6', gradient: ['#6366F1', '#8B5CF6'] },
            features: [],
            topics: [],
            aiPersonalities: [],
            sessionTypes: {
              quick: { duration: 0, description: '' },
              standard: { duration: 0, description: '' },
              extended: { duration: 0, description: '' }
            }
          },
          title: row.title || `${row.mode.replace('-', ' ')} - ${new Date(row.created_at).toLocaleDateString()}`,
          duration: row.duration_seconds,
          messages: [],
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
          bookmarks: [],
          highlights: [],
          isBookmarked: !!row.is_bookmarked,
          feedback: feedbackSummary,
          sharingSettings,
          configuration: {
            customSettings: {
              jobDescription: row.job_description,
              cvContent: row.cv_text,
              personalizedQuestions
            }
          }
        };
        
        // Then get the messages
        executeQuery(
          `SELECT * FROM local_messages WHERE conversation_id = ? ORDER BY message_index ASC;`,
          [conversationId],
          (messagesResult) => {
            const messages: ConversationMessage[] = [];
            
            for (let i = 0; i < messagesResult.rows.length; i++) {
              const msgRow = messagesResult.rows.item(i);
              
              // Parse JSON fields
              const feedbackData = msgRow.feedback_data ? JSON.parse(msgRow.feedback_data) : null;
              
              messages.push({
                id: msgRow.id,
                role: msgRow.role,
                content: msgRow.content,
                timestamp: new Date(msgRow.timestamp),
                audio_url: msgRow.audio_url,
                feedback_data: feedbackData,
                is_highlighted: !!msgRow.is_highlighted
              });
            }
            
            conversation.messages = messages;
            resolve(conversation);
          },
          (error) => {
            reject(error);
          }
        );
      },
      (error) => {
        reject(error);
      }
    );
  });
};

// Save a message to local database
export const saveLocalMessage = async (
  conversationId: string,
  message: ConversationMessage
): Promise<string> => {
  const id = message.id || generateId();
  
  const query = `
    INSERT OR REPLACE INTO local_messages (
      id, conversation_id, remote_id, role, content, audio_url, audio_local_path,
      timestamp, message_index, feedback_data, is_highlighted, is_synced, sync_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
  
  const remoteId = message.id.startsWith('local_') ? null : message.id;
  const feedbackData = message.feedback_data ? JSON.stringify(message.feedback_data) : null;
  
  // If there's an audio URL, download it locally
  let audioLocalPath = null;
  if (message.audio_url && Platform.OS !== 'web') {
    try {
      audioLocalPath = await downloadAudio(message.audio_url, conversationId, id);
    } catch (error) {
      console.error('Error downloading audio:', error);
    }
  }
  
  return new Promise((resolve, reject) => {
    executeQuery(
      query,
      [
        id,
        conversationId,
        remoteId,
        message.role,
        message.content,
        message.audio_url,
        audioLocalPath,
        message.timestamp.toISOString(),
        message.message_index || 0,
        feedbackData,
        message.is_highlighted ? 1 : 0,
        remoteId ? 1 : 0,
        remoteId ? 'synced' : 'pending'
      ],
      (result) => {
        // Update conversation's message count and updated_at
        updateConversationAfterMessageChange(conversationId);
        
        // Update full-text search index
        updateSearchIndexForConversation(conversationId);
        
        resolve(id);
      },
      (error) => {
        reject(error);
      }
    );
  });
};

// Download audio file and store locally
const downloadAudio = async (
  remoteUrl: string,
  conversationId: string,
  messageId: string
): Promise<string | null> => {
  if (!remoteUrl || Platform.OS === 'web') return null;
  
  try {
    // Create directory for audio files if it doesn't exist
    const audioDir = `${FileSystem.documentDirectory}audio/${conversationId}/`;
    await FileSystem.makeDirectoryAsync(audioDir, { intermediates: true });
    
    // Generate local file path
    const localPath = `${audioDir}${messageId}.m4a`;
    
    // Download the file
    const downloadResult = await FileSystem.downloadAsync(remoteUrl, localPath);
    
    if (downloadResult.status === 200) {
      // Save to audio cache
      saveAudioToCache(remoteUrl, localPath, messageId);
      return localPath;
    }
    
    return null;
  } catch (error) {
    console.error('Error downloading audio file:', error);
    return null;
  }
};

// Save audio file to cache
const saveAudioToCache = (remoteUrl: string, localPath: string, contentId: string) => {
  const query = `
    INSERT OR REPLACE INTO audio_cache (
      id, remote_url, local_path, content_hash, size, created_at, last_accessed, expiry
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
  `;
  
  const now = new Date().toISOString();
  const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  
  executeQuery(
    query,
    [
      contentId,
      remoteUrl,
      localPath,
      contentId, // Using message ID as content hash for simplicity
      0, // Size unknown until we check the file
      now,
      now,
      expiry
    ],
    async (result) => {
      // Update file size
      try {
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        if (fileInfo.exists && fileInfo.size) {
          executeQuery(
            'UPDATE audio_cache SET size = ? WHERE id = ?;',
            [fileInfo.size, contentId],
            () => {},
            (error) => console.error('Error updating audio cache size:', error)
          );
        }
      } catch (error) {
        console.error('Error getting file info:', error);
      }
    },
    (error) => console.error('Error saving audio to cache:', error)
  );
};

// Update conversation after message changes
const updateConversationAfterMessageChange = (conversationId: string) => {
  // Get message count
  executeQuery(
    'SELECT COUNT(*) as count FROM local_messages WHERE conversation_id = ?;',
    [conversationId],
    (result) => {
      const count = result.rows.item(0).count;
      
      // Update conversation
      executeQuery(
        'UPDATE local_conversations SET message_count = ?, updated_at = ? WHERE id = ?;',
        [count, new Date().toISOString(), conversationId],
        () => {},
        (error) => console.error('Error updating conversation:', error)
      );
    },
    (error) => console.error('Error counting messages:', error)
  );
};

// Update search index for a conversation
const updateSearchIndexForConversation = (conversationId: string) => {
  // Get conversation and messages
  executeQuery(
    `SELECT c.id, c.title, GROUP_CONCAT(m.content, ' ') as content
     FROM local_conversations c
     LEFT JOIN local_messages m ON c.id = m.conversation_id
     WHERE c.id = ?
     GROUP BY c.id;`,
    [conversationId],
    (result) => {
      if (result.rows.length === 0) return;
      
      const row = result.rows.item(0);
      
      // Update search index
      executeQuery(
        'DELETE FROM conversation_fts WHERE id = ?;',
        [conversationId],
        () => {
          executeQuery(
            'INSERT INTO conversation_fts (id, title, content) VALUES (?, ?, ?);',
            [conversationId, row.title || '', row.content || ''],
            () => {},
            (error) => console.error('Error updating search index:', error)
          );
        },
        (error) => console.error('Error removing from search index:', error)
      );
    },
    (error) => console.error('Error getting conversation data for search index:', error)
  );
};

// Delete a conversation and its messages
export const deleteLocalConversation = (conversationId: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    executeQuery(
      'DELETE FROM local_conversations WHERE id = ?;',
      [conversationId],
      (result) => {
        // Messages will be deleted automatically due to CASCADE
        
        // Remove from search index
        executeQuery(
          'DELETE FROM conversation_fts WHERE id = ?;',
          [conversationId],
          () => {
            // Delete associated audio files
            deleteConversationAudioFiles(conversationId);
            resolve(true);
          },
          (error) => {
            console.error('Error removing from search index:', error);
            resolve(true); // Still consider it successful
          }
        );
      },
      (error) => {
        reject(error);
      }
    );
  });
};

// Delete audio files for a conversation
const deleteConversationAudioFiles = async (conversationId: string) => {
  if (Platform.OS === 'web') return;
  
  try {
    const audioDir = `${FileSystem.documentDirectory}audio/${conversationId}/`;
    const dirInfo = await FileSystem.getInfoAsync(audioDir);
    
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(audioDir, { idempotent: true });
    }
    
    // Also remove from audio cache
    executeQuery(
      `DELETE FROM audio_cache WHERE id IN (
        SELECT id FROM local_messages WHERE conversation_id = ?
      );`,
      [conversationId],
      () => {},
      (error) => console.error('Error removing from audio cache:', error)
    );
  } catch (error) {
    console.error('Error deleting conversation audio files:', error);
  }
};

// Toggle conversation bookmark
export const toggleLocalConversationBookmark = (
  conversationId: string,
  isBookmarked: boolean
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    executeQuery(
      'UPDATE local_conversations SET is_bookmarked = ? WHERE id = ?;',
      [isBookmarked ? 1 : 0, conversationId],
      (result) => {
        resolve(true);
      },
      (error) => {
        reject(error);
      }
    );
  });
};

// Add to sync queue
export const addToSyncQueue = (
  operationType: 'create' | 'update' | 'delete',
  entityType: 'conversation' | 'message' | 'user_progress' | 'user_preferences',
  entityId: string,
  data: any,
  priority: 'high' | 'normal' | 'low' = 'normal'
): Promise<string> => {
  // Check if database is available
  const db = getDatabase();
  if (!db) {
    // On web platform, just return success without adding to sync queue
    console.log('Database not available on web platform. Skipping sync queue addition.');
    return Promise.resolve('local_' + generateId());
  }
  
  const id = generateId();
  
  return new Promise((resolve, reject) => {
    executeQuery(
      `INSERT INTO sync_queue (
        id, operation_type, entity_type, entity_id, data, priority, created_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        operationType,
        entityType,
        entityId,
        JSON.stringify(data),
        priority,
        new Date().toISOString(),
        'pending'
      ],
      (result) => {
        resolve(id);
      },
      (error) => {
        reject(error);
      }
    );
  });
};

// Get pending sync operations
export const getPendingSyncOperations = (
  limit = 20,
  priority?: 'high' | 'normal' | 'low'
): Promise<any[]> => {
  let query = `
    SELECT * FROM sync_queue 
    WHERE status = 'pending'
  `;
  
  const params: any[] = [];
  
  if (priority) {
    query += ' AND priority = ?';
    params.push(priority);
  }
  
  query += ' ORDER BY CASE priority WHEN "high" THEN 1 WHEN "normal" THEN 2 WHEN "low" THEN 3 END, created_at ASC LIMIT ?;';
  params.push(limit);
  
  return new Promise((resolve, reject) => {
    executeQuery(
      query,
      params,
      (result) => {
        const operations: any[] = [];
        
        for (let i = 0; i < result.rows.length; i++) {
          const row = result.rows.item(i);
          
          operations.push({
            id: row.id,
            operationType: row.operation_type,
            entityType: row.entity_type,
            entityId: row.entity_id,
            data: JSON.parse(row.data),
            priority: row.priority,
            createdAt: new Date(row.created_at),
            retryCount: row.retry_count,
            lastAttempt: row.last_attempt ? new Date(row.last_attempt) : null,
            status: row.status,
            error: row.error
          });
        }
        
        resolve(operations);
      },
      (error) => {
        reject(error);
      }
    );
  });
};

// Update sync operation status
export const updateSyncOperationStatus = (
  operationId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'failed',
  error?: string
): Promise<boolean> => {
  // Check if database is available
  const db = getDatabase();
  if (!db) {
    // On web platform, just return success without updating database
    console.log('Database not available on web platform. Skipping sync operation status update.');
    return Promise.resolve(true);
  }
  
  return new Promise((resolve, reject) => {
    executeQuery(
      `UPDATE sync_queue SET 
        status = ?, 
        last_attempt = ?,
        ${status === 'failed' ? 'retry_count = retry_count + 1, ' : ''}
        error = ?
      WHERE id = ?;`,
      [
        status,
        new Date().toISOString(),
        error || null,
        operationId
      ],
      (result) => {
        resolve(true);
      },
      (error) => {
        reject(error);
      }
    );
  });
};

// Clean up completed sync operations
export const cleanupCompletedSyncOperations = (olderThanHours = 24): Promise<number> => {
  // Check if database is available
  const db = getDatabase();
  if (!db) {
    // On web platform, just return 0 without cleaning up database
    console.log('Database not available on web platform. Skipping sync operations cleanup.');
    return Promise.resolve(0);
  }
  
  const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000).toISOString();
  
  return new Promise((resolve, reject) => {
    executeQuery(
      `DELETE FROM sync_queue WHERE status = 'completed' AND last_attempt < ?;`,
      [cutoffDate],
      (result) => {
        resolve(result.rowsAffected);
      },
      (error) => {
        reject(error);
      }
    );
  });
};

// Save user preferences
export const saveUserPreferences = (
  userId: string,
  preferences: any
): Promise<boolean> => {
  // Check if database is available
  const db = getDatabase();
  if (!db) {
    // On web platform, just return success without saving to database
    console.log('Database not available on web platform. Skipping preference save.');
    return Promise.resolve(true);
  }
  
  const id = generateId();
  
  return new Promise((resolve, reject) => {
    executeQuery(
      `INSERT OR REPLACE INTO user_preferences (
        id, user_id, theme, voice_settings, notification_settings, language,
        favorite_mode, recent_modes, is_synced, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        userId,
        preferences.theme || 'system',
        JSON.stringify(preferences.voiceSettings || {}),
        JSON.stringify(preferences.notifications || {}),
        preferences.language || 'en-US',
        preferences.favoriteMode || null,
        JSON.stringify(preferences.recentModes || []),
        0, // Not synced
        'pending'
      ],
      (result) => {
        // Add to sync queue
        addToSyncQueue(
          'update',
          'user_preferences',
          id,
          preferences,
          'high'
        ).then(() => {
          resolve(true);
        }).catch((error) => {
          console.error('Error adding preferences to sync queue:', error);
          resolve(true); // Still consider it successful
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
};

// Get user preferences
export const getUserPreferences = (userId: string): Promise<any | null> => {
  return new Promise((resolve, reject) => {
    // Check if database is available
    const db = getDatabase();
    if (!db) {
      // Return default preferences on web platform
      console.log('Database not available on web platform. Returning default preferences.');
      resolve({
        theme: 'system',
        voiceSettings: {
          selectedVoice: 'en-US-Standard-A',
          speed: 1.0,
          pitch: 1.0,
          volume: 0.8,
        },
        notifications: {
          practiceReminders: true,
          dailyGoals: true,
          achievements: false,
        },
        language: 'en-US',
        favoriteMode: null,
        recentModes: []
      });
      return;
    }
    
    executeQuery(
      'SELECT * FROM user_preferences WHERE user_id = ? LIMIT 1;',
      [userId],
      (result) => {
        if (result.rows.length === 0) {
          resolve(null);
          return;
        }
        
        const row = result.rows.item(0);
        
        resolve({
          theme: row.theme,
          voiceSettings: JSON.parse(row.voice_settings || '{}'),
          notifications: JSON.parse(row.notification_settings || '{}'),
          language: row.language,
          favoriteMode: row.favorite_mode,
          recentModes: JSON.parse(row.recent_modes || '[]')
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
};

// Save user progress
export const saveUserProgress = (
  userId: string,
  mode: string,
  progress: any
): Promise<string> => {
  // Check if database is available
  const db = getDatabase();
  if (!db) {
    // On web platform, just return success without saving to database
    console.log('Database not available on web platform. Skipping progress save.');
    return Promise.resolve('local_' + generateId());
  }
  
  const id = generateId();
  
  return new Promise((resolve, reject) => {
    executeQuery(
      `INSERT OR REPLACE INTO local_user_progress (
        id, user_id, remote_id, mode, skill_scores, total_sessions, total_duration,
        best_scores, achievements, last_session_date, streak_count, is_synced, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        userId,
        progress.id && !progress.id.startsWith('local_') ? progress.id : null,
        mode,
        JSON.stringify(progress.skill_scores || {}),
        progress.total_sessions || 0,
        progress.total_duration || 0,
        JSON.stringify(progress.best_scores || {}),
        JSON.stringify(progress.achievements || []),
        progress.last_session_date ? new Date(progress.last_session_date).toISOString() : null,
        progress.streak_count || 0,
        0, // Not synced
        'pending'
      ],
      (result) => {
        // Add to sync queue
        addToSyncQueue(
          'update',
          'user_progress',
          id,
          {
            mode,
            ...progress
          },
          'normal'
        ).then(() => {
          resolve(id);
        }).catch((error) => {
          console.error('Error adding progress to sync queue:', error);
          resolve(id); // Still consider it successful
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
};

// Get user progress
export const getUserProgress = (
  userId: string,
  mode?: string
): Promise<any[]> => {
  // Check if database is available
  const db = getDatabase();
  if (!db) {
    // Return empty array on web platform since database is not available
    console.log('Database not available on web platform. Returning empty progress.');
    return Promise.resolve([]);
  }
  
  let query = 'SELECT * FROM local_user_progress WHERE user_id = ?';
  const params: any[] = [userId];
  
  if (mode) {
    query += ' AND mode = ?';
    params.push(mode);
  }
  
  return new Promise((resolve, reject) => {
    executeQuery(
      query,
      params,
      (result) => {
        const progressItems: any[] = [];
        
        for (let i = 0; i < result.rows.length; i++) {
          const row = result.rows.item(i);
          
          progressItems.push({
            id: row.id,
            user_id: row.user_id,
            remote_id: row.remote_id,
            mode: row.mode,
            skill_scores: JSON.parse(row.skill_scores || '{}'),
            total_sessions: row.total_sessions,
            total_duration: row.total_duration,
            best_scores: JSON.parse(row.best_scores || '{}'),
            achievements: JSON.parse(row.achievements || '[]'),
            last_session_date: row.last_session_date ? new Date(row.last_session_date) : null,
            streak_count: row.streak_count,
            is_synced: !!row.is_synced,
            sync_status: row.sync_status
          });
        }
        
        resolve(progressItems);
      },
      (error) => {
        reject(error);
      }
    );
  });
};

// Clean up old audio files
export const cleanupOldAudioFiles = async (olderThanDays = 30): Promise<number> => {
  if (Platform.OS === 'web') return 0;
  
  const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();
  
  return new Promise((resolve, reject) => {
    executeQuery(
      `SELECT id, local_path FROM audio_cache WHERE last_accessed < ?;`,
      [cutoffDate],
      async (result) => {
        let deletedCount = 0;
        
        for (let i = 0; i < result.rows.length; i++) {
          const row = result.rows.item(i);
          
          try {
            // Delete the file
            const fileInfo = await FileSystem.getInfoAsync(row.local_path);
            if (fileInfo.exists) {
              await FileSystem.deleteAsync(row.local_path, { idempotent: true });
              deletedCount++;
            }
            
            // Remove from cache
            executeQuery(
              'DELETE FROM audio_cache WHERE id = ?;',
              [row.id],
              () => {},
              (error) => console.error('Error removing from audio cache:', error)
            );
          } catch (error) {
            console.error('Error deleting audio file:', error);
          }
        }
        
        resolve(deletedCount);
      },
      (error) => {
        reject(error);
      }
    );
  });
};

// Get database statistics
export const getDatabaseStats = (): Promise<{
  conversationCount: number;
  messageCount: number;
  audioCacheSize: number;
  syncQueueSize: number;
  pendingSyncCount: number;
}> => {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    // Return empty stats on web platform since database is not available
    if (!db) {
      resolve({
        conversationCount: 0,
        messageCount: 0,
        audioCacheSize: 0,
        syncQueueSize: 0,
        pendingSyncCount: 0
      });
      return;
    }
    
    const stats = {
      conversationCount: 0,
      messageCount: 0,
      audioCacheSize: 0,
      syncQueueSize: 0,
      pendingSyncCount: 0
    };
    
    // Get conversation count
    executeQuery(
      'SELECT COUNT(*) as count FROM local_conversations;',
      [],
      (result) => {
        stats.conversationCount = result.rows.item(0).count;
        
        // Get message count
        executeQuery(
          'SELECT COUNT(*) as count FROM local_messages;',
          [],
          (result) => {
            stats.messageCount = result.rows.item(0).count;
            
            // Get audio cache size
            executeQuery(
              'SELECT SUM(size) as total_size FROM audio_cache;',
              [],
              (result) => {
                stats.audioCacheSize = result.rows.item(0).total_size || 0;
                
                // Get sync queue size
                executeQuery(
                  'SELECT COUNT(*) as count FROM sync_queue;',
                  [],
                  (result) => {
                    stats.syncQueueSize = result.rows.item(0).count;
                    
                    // Get pending sync count
                    executeQuery(
                      'SELECT COUNT(*) as count FROM sync_queue WHERE status = "pending";',
                      [],
                      (result) => {
                        stats.pendingSyncCount = result.rows.item(0).count;
                        resolve(stats);
                      },
                      (error) => reject(error)
                    );
                  },
                  (error) => reject(error)
                );
              },
              (error) => reject(error)
            );
          },
          (error) => reject(error)
        );
      },
      (error) => reject(error)
    );
  });
};

// Export database to JSON
export const exportDatabaseToJson = async (): Promise<string> => {
  const db = getDatabase();
  
  // Return empty data on web platform since database is not available
  if (!db) {
    console.log('Database not available on web platform. Returning empty export.');
    return JSON.stringify({
      local_conversations: [],
      local_messages: [],
      user_preferences: [],
      local_user_progress: [],
      audio_cache: [],
      sync_queue: []
    }, null, 2);
  }
  
  const exportData: any = {};
  
  // Helper function to get all rows from a table
  const getAllRows = (tableName: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM ${tableName};`,
          [],
          (_, result) => {
            const rows = [];
            for (let i = 0; i < result.rows.length; i++) {
              rows.push(result.rows.item(i));
            }
            resolve(rows);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  };
  
  // Get all table names
  const tables = [
    'local_conversations',
    'local_messages',
    'user_preferences',
    'local_user_progress',
    'audio_cache',
    'sync_queue'
  ];
  
  // Export each table
  for (const table of tables) {
    try {
      exportData[table] = await getAllRows(table);
    } catch (error) {
      console.error(`Error exporting table ${table}:`, error);
      exportData[table] = { error: 'Failed to export' };
    }
  }
  
  return JSON.stringify(exportData, null, 2);
};

// Import database from JSON
export const importDatabaseFromJson = async (jsonData: string): Promise<boolean> => {
  try {
    const data = JSON.parse(jsonData);
    const db = getDatabase();
    
    // Return false on web platform since database is not available
    if (!db) {
      console.log('Database not available on web platform. Cannot import data.');
      return false;
    }
    
    // Begin transaction
    return new Promise((resolve, reject) => {
      db.transaction(
        tx => {
          // Clear existing data
          tx.executeSql('DELETE FROM local_conversations;', []);
          tx.executeSql('DELETE FROM local_messages;', []);
          tx.executeSql('DELETE FROM user_preferences;', []);
          tx.executeSql('DELETE FROM local_user_progress;', []);
          tx.executeSql('DELETE FROM audio_cache;', []);
          tx.executeSql('DELETE FROM sync_queue;', []);
          tx.executeSql('DELETE FROM conversation_fts;', []);
          
          // Import conversations
          if (data.local_conversations) {
            for (const row of data.local_conversations) {
              tx.executeSql(
                `INSERT INTO local_conversations (
                  id, user_id, remote_id, mode, title, duration_seconds, message_count,
                  quality_score, feedback_summary, job_description, cv_text, personalized_questions,
                  created_at, updated_at, is_bookmarked, sharing_settings, is_synced, sync_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                [
                  row.id,
                  row.user_id,
                  row.remote_id,
                  row.mode,
                  row.title,
                  row.duration_seconds,
                  row.message_count,
                  row.quality_score,
                  row.feedback_summary,
                  row.job_description,
                  row.cv_text,
                  row.personalized_questions,
                  row.created_at,
                  row.updated_at,
                  row.is_bookmarked,
                  row.sharing_settings,
                  row.is_synced,
                  row.sync_status
                ]
              );
            }
          }
          
          // Import messages
          if (data.local_messages) {
            for (const row of data.local_messages) {
              tx.executeSql(
                `INSERT INTO local_messages (
                  id, conversation_id, remote_id, role, content, audio_url, audio_local_path,
                  timestamp, message_index, feedback_data, is_highlighted, is_synced, sync_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                [
                  row.id,
                  row.conversation_id,
                  row.remote_id,
                  row.role,
                  row.content,
                  row.audio_url,
                  row.audio_local_path,
                  row.timestamp,
                  row.message_index,
                  row.feedback_data,
                  row.is_highlighted,
                  row.is_synced,
                  row.sync_status
                ]
              );
            }
          }
          
          // Import other tables...
          // (Similar pattern for other tables)
          
          // Rebuild search index
          if (data.local_conversations) {
            for (const conversation of data.local_conversations) {
              // Get messages for this conversation
              const messages = data.local_messages ? 
                data.local_messages.filter((m: any) => m.conversation_id === conversation.id) : [];
              
              // Combine message content
              const content = messages.map((m: any) => m.content).join(' ');
              
              // Add to search index
              tx.executeSql(
                'INSERT INTO conversation_fts (id, title, content) VALUES (?, ?, ?);',
                [conversation.id, conversation.title || '', content]
              );
            }
          }
        },
        (error) => {
          console.error('Transaction error:', error);
          reject(error);
        },
        () => {
          resolve(true);
        }
      );
    });
  } catch (error) {
    console.error('Import error:', error);
    return false;
  }
};