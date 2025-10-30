export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      generations: {
        Row: {
          created_at: string | null
          generation_time_ms: number | null
          id: string
          image_data: string | null
          mode: string
          model_version: string | null
          output_size: string
          prompt: string
          quality: string
          reference_image_urls: string[] | null
          seed: number
          size: string
        }
        Insert: {
          created_at?: string | null
          generation_time_ms?: number | null
          id?: string
          image_data?: string | null
          mode: string
          model_version?: string | null
          output_size: string
          prompt: string
          quality: string
          reference_image_urls?: string[] | null
          seed: number
          size: string
        }
        Update: {
          created_at?: string | null
          generation_time_ms?: number | null
          id?: string
          image_data?: string | null
          mode?: string
          model_version?: string | null
          output_size?: string
          prompt?: string
          quality?: string
          reference_image_urls?: string[] | null
          seed?: number
          size?: string
        }
        Relationships: []
      }
      presets: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          mode: string
          name: string
          prompt: string
          quality: string
          reference_image_urls: string[] | null
          seed: number
          size: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          mode: string
          name: string
          prompt: string
          quality: string
          reference_image_urls?: string[] | null
          seed: number
          size: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          mode?: string
          name?: string
          prompt?: string
          quality?: string
          reference_image_urls?: string[] | null
          seed?: number
          size?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Custom type aliases for our app
export type GenerationMode = 'text' | 'image' | 'multi-image';
export type Quality = 'standard' | 'fast';
