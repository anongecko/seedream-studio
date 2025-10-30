// Supabase Database Types
// Generated from database schema

export type GenerationMode = 'text' | 'image' | 'multi-image';

export interface Generation {
  id: string;
  created_at: string | null;
  prompt: string;
  mode: string;
  reference_image_urls: string[] | null;
  size: string;
  quality: string;
  batch_mode: boolean;
  max_images: number | null;
  images_generated: number; // Count of images generated (not the images themselves)
  generation_time_ms: number | null;
  model_version: string | null;
}

export interface Preset {
  id: string;
  created_at: string | null;
  name: string;
  description: string | null;
  mode: string;
  prompt: string;
  reference_image_urls: string[] | null;
  size: string;
  quality: string;
  batch_mode: boolean;
  max_images: number | null;
}

export interface Database {
  public: {
    Tables: {
      generations: {
        Row: Generation;
        Insert: Omit<Generation, 'id' | 'created_at'>;
        Update: Partial<Omit<Generation, 'id' | 'created_at'>>;
      };
      presets: {
        Row: Preset;
        Insert: Omit<Preset, 'id' | 'created_at'>;
        Update: Partial<Omit<Preset, 'id' | 'created_at'>>;
      };
    };
  };
}
