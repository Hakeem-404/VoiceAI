export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          name: string | null
          avatar_url: string | null
          subscription_tier: string
          preferences: Json
          created_at: string
          last_active: string
          total_conversations: number
          streak_days: number
        }
        Insert: {
          id?: string
          email?: string | null
          name?: string | null
          avatar_url?: string | null
          subscription_tier?: string
          preferences?: Json
          created_at?: string
          last_active?: string
          total_conversations?: number
          streak_days?: number
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          avatar_url?: string | null
          subscription_tier?: string
          preferences?: Json
          created_at?: string
          last_active?: string
          total_conversations?: number
          streak_days?: number
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          mode: string
          title: string | null
          duration_seconds: number
          message_count: number
          quality_score: number
          feedback_summary: Json
          job_description: string | null
          cv_text: string | null
          personalized_questions: Json
          created_at: string
          updated_at: string
          is_bookmarked: boolean
          sharing_settings: Json
        }
        Insert: {
          id?: string
          user_id: string
          mode: string
          title?: string | null
          duration_seconds?: number
          message_count?: number
          quality_score?: number
          feedback_summary?: Json
          job_description?: string | null
          cv_text?: string | null
          personalized_questions?: Json
          created_at?: string
          updated_at?: string
          is_bookmarked?: boolean
          sharing_settings?: Json
        }
        Update: {
          id?: string
          user_id?: string
          mode?: string
          title?: string | null
          duration_seconds?: number
          message_count?: number
          quality_score?: number
          feedback_summary?: Json
          job_description?: string | null
          cv_text?: string | null
          personalized_questions?: Json
          created_at?: string
          updated_at?: string
          is_bookmarked?: boolean
          sharing_settings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: string
          content: string
          audio_url: string | null
          timestamp: string
          message_index: number
          feedback_data: Json
          is_highlighted: boolean
        }
        Insert: {
          id?: string
          conversation_id: string
          role: string
          content: string
          audio_url?: string | null
          timestamp?: string
          message_index: number
          feedback_data?: Json
          is_highlighted?: boolean
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: string
          content?: string
          audio_url?: string | null
          timestamp?: string
          message_index?: number
          feedback_data?: Json
          is_highlighted?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      conversation_modes: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          color_scheme: Json
          system_prompt: string | null
          default_settings: Json
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          color_scheme?: Json
          system_prompt?: string | null
          default_settings?: Json
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          color_scheme?: Json
          system_prompt?: string | null
          default_settings?: Json
          is_active?: boolean
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          mode: string
          skill_scores: Json
          total_sessions: number
          total_duration: number
          best_scores: Json
          achievements: Json
          last_session_date: string | null
          streak_count: number
        }
        Insert: {
          id?: string
          user_id: string
          mode: string
          skill_scores?: Json
          total_sessions?: number
          total_duration?: number
          best_scores?: Json
          achievements?: Json
          last_session_date?: string | null
          streak_count?: number
        }
        Update: {
          id?: string
          user_id?: string
          mode?: string
          skill_scores?: Json
          total_sessions?: number
          total_duration?: number
          best_scores?: Json
          achievements?: Json
          last_session_date?: string | null
          streak_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      voice_profiles: {
        Row: {
          id: string
          user_id: string | null
          elevenlabs_voice_id: string | null
          name: string
          description: string | null
          is_custom: boolean
          voice_settings: Json
          created_at: string
          usage_count: number
        }
        Insert: {
          id?: string
          user_id?: string | null
          elevenlabs_voice_id?: string | null
          name: string
          description?: string | null
          is_custom?: boolean
          voice_settings?: Json
          created_at?: string
          usage_count?: number
        }
        Update: {
          id?: string
          user_id?: string | null
          elevenlabs_voice_id?: string | null
          name?: string
          description?: string | null
          is_custom?: boolean
          voice_settings?: Json
          created_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "voice_profiles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      daily_challenges: {
        Row: {
          id: string
          title: string
          description: string | null
          mode: string
          difficulty: string | null
          reward_points: number
          reward_badge: string | null
          expires_at: string | null
          created_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          mode: string
          difficulty?: string | null
          reward_points?: number
          reward_badge?: string | null
          expires_at?: string | null
          created_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          mode?: string
          difficulty?: string | null
          reward_points?: number
          reward_badge?: string | null
          expires_at?: string | null
          created_at?: string
          is_active?: boolean
        }
        Relationships: []
      }
      user_challenges: {
        Row: {
          id: string
          user_id: string
          challenge_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenges_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_old_conversations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_unused_audio: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_user_streaks: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}