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
          batch_mode: boolean
          created_at: string | null
          generation_time_ms: number | null
          id: string
          images_generated: number
          max_images: number | null
          mode: string
          model_version: string | null
          prompt: string
          quality: string
          reference_image_urls: string[] | null
          size: string
        }
        Insert: {
          batch_mode?: boolean
          created_at?: string | null
          generation_time_ms?: number | null
          id?: string
          images_generated?: number
          max_images?: number | null
          mode: string
          model_version?: string | null
          prompt: string
          quality: string
          reference_image_urls?: string[] | null
          size: string
        }
        Update: {
          batch_mode?: boolean
          created_at?: string | null
          generation_time_ms?: number | null
          id?: string
          images_generated?: number
          max_images?: number | null
          mode?: string
          model_version?: string | null
          prompt?: string
          quality?: string
          reference_image_urls?: string[] | null
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
      video_generations: {
        Row: {
          completion_tokens: number | null
          created_at: string
          duration: number
          framespersecond: number
          generate_audio: boolean
          generation_time_ms: number | null
          id: string
          last_frame_url: string | null
          mode: string
          model_version: string
          parent_task_id: string | null
          prompt: string
          ratio: string
          reference_image_urls: string[] | null
          resolution: string
          return_last_frame: boolean
          seed: number
          service_tier: string
          task_id: string
          total_tokens: number | null
          video_url: string | null
        }
        Insert: {
          completion_tokens?: number | null
          created_at?: string
          duration: number
          framespersecond?: number
          generate_audio?: boolean
          generation_time_ms?: number | null
          id?: string
          last_frame_url?: string | null
          mode: string
          model_version?: string
          parent_task_id?: string | null
          prompt: string
          ratio: string
          reference_image_urls?: string[] | null
          resolution: string
          return_last_frame?: boolean
          seed: number
          service_tier?: string
          task_id: string
          total_tokens?: number | null
          video_url?: string | null
        }
        Update: {
          completion_tokens?: number | null
          created_at?: string
          duration?: number
          framespersecond?: number
          generate_audio?: boolean
          generation_time_ms?: number | null
          id?: string
          last_frame_url?: string | null
          mode?: string
          model_version?: string
          parent_task_id?: string | null
          prompt?: string
          ratio?: string
          reference_image_urls?: string[] | null
          resolution?: string
          return_last_frame?: boolean
          seed?: number
          service_tier?: string
          task_id?: string
          total_tokens?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_generations_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "video_generations"
            referencedColumns: ["task_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_video_iteration_chain: {
        Args: { root_task_id: string }
        Returns: {
          created_at: string
          iteration_depth: number
          parent_task_id: string
          prompt: string
          task_id: string
        }[]
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

// Custom type aliases for our app
// Modes:
// - 'text': Text to Image (no reference images)
// - 'image': Image to Image (1 reference image)
// - 'multi-image': Multi-Image Blending (2-14 reference images, single output)
// - 'multi-batch': Multi-Image to Batch (2-14 reference images, batch output)
export type GenerationMode = 'text' | 'image' | 'multi-image' | 'multi-batch';
export type Quality = 'standard' | 'fast';
