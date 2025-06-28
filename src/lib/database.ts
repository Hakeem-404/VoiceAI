import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const DATABASE_NAME = 'conversation_companion.db';
const DATABASE_VERSION = 1;

let databaseInstance: any = null;
let SQLite: any = null;

// Dynamically import SQLite to handle module loading issues
const loadSQLite = async () => {
  if (Platform.OS === 'web') {
    return null;
  }
  
  if (SQLite) {
    return SQLite;
  }
  
  try {
    SQLite = await import('expo-sqlite');
    return SQLite;
  } catch (error) {
    console.error('Failed to load SQLite module:', error);
    return null;
  }
};

export const getDatabase = async (): Promise<any> => {
  if (Platform.OS === 'web') {
    console.log('SQLite is not fully supported on web platform. Using alternative storage.');
    return null;
  }
  
  if (databaseInstance) {
    return databaseInstance;
  }
  
  try {
    const SQLiteModule = await loadSQLite();
    if (!SQLiteModule) {
      console.error('SQLite module is not available');
      return null;
    }
    
    // Check if SQLite is available
    if (!SQLiteModule.openDatabase) {
      console.error('SQLite.openDatabase is not available');
      return null;
    }
    
    // For native platforms, ensure the database directory exists
    const directory = FileSystem.documentDirectory + 'SQLite/';
    
    // Create the directory if it doesn't exist
    try {
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    } catch (error) {
      console.error('Error creating database directory:', error);
    }
    
    databaseInstance = SQLiteModule.openDatabase(DATABASE_NAME);
    
    // Test if the database is working
    if (databaseInstance && typeof databaseInstance.transaction === 'function') {
      console.log('SQLite database opened successfully');
      return databaseInstance;
    } else {
      console.error('SQLite database opened but transaction method is not available');
      databaseInstance = null;
      return null;
    }
  } catch (error) {
    console.error('Error opening SQLite database:', error);
    return null;
  }
};

// Initialize the database with all required tables
export const initDatabase = async (): Promise<void> => {
  const db = await getDatabase();
  
  // Skip database initialization on web platform or if database is not available
  if (!db) {
    console.log('Database not available. Skipping initialization.');
    return;
  }
  
  return new Promise((resolve, reject) => {
    try {
      // Create a version table to track database version for migrations
      db.transaction(
        (tx: any) => {
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS version (
              id INTEGER PRIMARY KEY NOT NULL,
              version INTEGER NOT NULL
            );`,
            [],
            () => {
              // Check current version and run migrations if needed
              checkVersion(db, resolve, reject);
            },
            (_: any, error: any) => {
              console.error('Error creating version table:', error);
              reject(error);
              return false;
            }
          );
        },
        (error: any) => {
          console.error('Transaction error during database initialization:', error);
          reject(error);
        },
        () => {
          console.log('Database initialization completed successfully');
          resolve();
        }
      );
    } catch (error) {
      console.error('Error during database initialization:', error);
      reject(error);
    }
  });
};

// Check database version and run migrations if needed
const checkVersion = (
  db: any,
  resolve: (value: void | PromiseLike<void>) => void,
  reject: (reason?: any) => void
) => {
  try {
    db.transaction((tx: any) => {
      tx.executeSql(
        'SELECT version FROM version ORDER BY version DESC LIMIT 1;',
        [],
        (_: any, result: any) => {
          const rows = result.rows;
          const currentVersion = rows.length > 0 ? rows.item(0).version : 0;
          
          if (currentVersion < DATABASE_VERSION) {
            // Run migrations
            runMigrations(db, currentVersion, resolve, reject);
          } else {
            resolve();
          }
        },
        (_: any, error: any) => {
          console.error('Error checking database version:', error);
          
          // If the table doesn't exist yet, insert the initial version
          tx.executeSql(
            'INSERT INTO version (id, version) VALUES (1, ?);',
            [DATABASE_VERSION],
            () => {
              resolve();
            },
            (_: any, error: any) => {
              console.error('Error inserting initial version:', error);
              reject(error);
              return false;
            }
          );
          return false;
        }
      );
    });
  } catch (error) {
    console.error('Error in checkVersion:', error);
    reject(error);
  }
};

// Run database migrations
const runMigrations = (
  db: any,
  currentVersion: number,
  resolve: (value: void | PromiseLike<void>) => void,
  reject: (reason?: any) => void
) => {
  try {
    db.transaction((tx: any) => {
      // Run migrations based on current version
      if (currentVersion < 1) {
        createInitialTables(tx);
      }
      
      // Update the database version
      tx.executeSql(
        'UPDATE version SET version = ? WHERE id = 1;',
        [DATABASE_VERSION],
        () => {
          resolve();
        },
        (_: any, error: any) => {
          console.error('Error updating database version:', error);
          reject(error);
          return false;
        }
      );
    });
  } catch (error) {
    console.error('Error in runMigrations:', error);
    reject(error);
  }
};

// Create initial tables for version 1
const createInitialTables = (tx: any) => {
  // Local conversations table
  tx.executeSql(
    `CREATE TABLE IF NOT EXISTS local_conversations (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT,
      remote_id TEXT,
      mode TEXT NOT NULL,
      title TEXT,
      duration_seconds INTEGER DEFAULT 0,
      message_count INTEGER DEFAULT 0,
      quality_score REAL DEFAULT 0,
      feedback_summary TEXT,
      job_description TEXT,
      cv_text TEXT,
      personalized_questions TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_bookmarked INTEGER DEFAULT 0,
      sharing_settings TEXT,
      is_synced INTEGER DEFAULT 0,
      sync_status TEXT DEFAULT 'pending',
      last_sync_attempt TEXT
    );`,
    [],
    () => {},
    (_: any, error: any) => {
      console.error('Error creating local_conversations table:', error);
      return false;
    }
  );
  
  // Local messages table
  tx.executeSql(
    `CREATE TABLE IF NOT EXISTS local_messages (
      id TEXT PRIMARY KEY NOT NULL,
      conversation_id TEXT NOT NULL,
      remote_id TEXT,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      audio_url TEXT,
      audio_local_path TEXT,
      timestamp TEXT NOT NULL,
      message_index INTEGER NOT NULL,
      feedback_data TEXT,
      is_highlighted INTEGER DEFAULT 0,
      is_synced INTEGER DEFAULT 0,
      sync_status TEXT DEFAULT 'pending',
      last_sync_attempt TEXT,
      FOREIGN KEY (conversation_id) REFERENCES local_conversations(id) ON DELETE CASCADE
    );`,
    [],
    () => {},
    (_: any, error: any) => {
      console.error('Error creating local_messages table:', error);
      return false;
    }
  );
  
  // User preferences table
  tx.executeSql(
    `CREATE TABLE IF NOT EXISTS user_preferences (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT,
      theme TEXT DEFAULT 'system',
      voice_settings TEXT,
      notification_settings TEXT,
      language TEXT DEFAULT 'en-US',
      favorite_mode TEXT,
      recent_modes TEXT,
      is_synced INTEGER DEFAULT 0,
      sync_status TEXT DEFAULT 'pending',
      last_sync_attempt TEXT
    );`,
    [],
    () => {},
    (_: any, error: any) => {
      console.error('Error creating user_preferences table:', error);
      return false;
    }
  );
  
  // Sync queue table
  tx.executeSql(
    `CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY NOT NULL,
      operation_type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      data TEXT NOT NULL,
      priority TEXT DEFAULT 'normal',
      created_at TEXT NOT NULL,
      retry_count INTEGER DEFAULT 0,
      last_attempt TEXT,
      status TEXT DEFAULT 'pending',
      error TEXT
    );`,
    [],
    () => {},
    (_: any, error: any) => {
      console.error('Error creating sync_queue table:', error);
      return false;
    }
  );
  
  // Full-text search table for conversations
  tx.executeSql(
    `CREATE VIRTUAL TABLE IF NOT EXISTS conversation_fts USING fts5(
      id UNINDEXED,
      title,
      content,
      content='local_conversations'
    );`,
    [],
    () => {},
    (_: any, error: any) => {
      console.error('Error creating conversation_fts table:', error);
      return false;
    }
  );
};

// Generate a unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Execute a database query
export const executeQuery = (
  query: string,
  params: any[] = [],
  successCallback?: (result: any) => void,
  errorCallback?: (error: any) => void
) => {
  if (Platform.OS === 'web') {
    console.log('Database queries not supported on web platform');
    if (errorCallback) errorCallback(new Error('Database not available on web'));
    return;
  }
  
  getDatabase().then((db) => {
    if (!db) {
      if (errorCallback) errorCallback(new Error('Database not available'));
      return;
    }
    
    db.transaction((tx: any) => {
      tx.executeSql(
        query,
        params,
        (result: any) => {
          if (successCallback) successCallback(result);
        },
        (error: any) => {
          console.error('Database query error:', error);
          if (errorCallback) errorCallback(error);
          return false;
        }
      );
    });
  }).catch((error) => {
    console.error('Database error:', error);
    if (errorCallback) errorCallback(error);
  });
};