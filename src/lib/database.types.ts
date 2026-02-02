export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          avatar_url: string | null;
          locale_preference: 'ca' | 'gl';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name: string;
          avatar_url?: string | null;
          locale_preference?: 'ca' | 'gl';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string;
          avatar_url?: string | null;
          locale_preference?: 'ca' | 'gl';
          updated_at?: string;
        };
      };
      passkeys: {
        Row: {
          id: string;
          user_id: string;
          credential_id: string;
          public_key: string;
          counter: number;
          device_name: string | null;
          created_at: string;
          last_used_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          credential_id: string;
          public_key: string;
          counter?: number;
          device_name?: string | null;
          created_at?: string;
          last_used_at?: string | null;
        };
        Update: {
          counter?: number;
          device_name?: string | null;
          last_used_at?: string | null;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          owner_id: string;
          created_at: string;
          max_members: number;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          owner_id: string;
          created_at?: string;
          max_members?: number;
        };
        Update: {
          name?: string;
          description?: string | null;
          max_members?: number;
        };
      };
      group_invites: {
        Row: {
          id: string;
          group_id: string;
          code: string;
          created_by: string;
          expires_at: string;
          used_at: string | null;
          used_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          code: string;
          created_by: string;
          expires_at: string;
          used_at?: string | null;
          used_by?: string | null;
          created_at?: string;
        };
        Update: {
          used_at?: string | null;
          used_by?: string | null;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: 'member' | 'admin';
          display_name_override: string | null;
          avatar_url_override: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: 'member' | 'admin';
          display_name_override?: string | null;
          avatar_url_override?: string | null;
          joined_at?: string;
        };
        Update: {
          role?: 'member' | 'admin';
          display_name_override?: string | null;
          avatar_url_override?: string | null;
        };
      };
      categories: {
        Row: {
          id: string;
          group_id: string | null;
          name: string;
          name_gl: string | null;
          icon_name: string | null;
          color: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id?: string | null;
          name: string;
          name_gl?: string | null;
          icon_name?: string | null;
          color?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          name_gl?: string | null;
          icon_name?: string | null;
          color?: string | null;
        };
      };
      places: {
        Row: {
          id: string;
          group_id: string;
          name: string;
          description: string | null;
          lat: number;
          lng: number;
          address: string | null;
          category_id: string | null;
          created_by: string;
          status: 'queremos_ir' | 'hemos_ido' | 'pendiente';
          external_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          name: string;
          description?: string | null;
          lat: number;
          lng: number;
          address?: string | null;
          category_id?: string | null;
          created_by: string;
          status?: 'queremos_ir' | 'hemos_ido' | 'pendiente';
          external_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          lat?: number;
          lng?: number;
          address?: string | null;
          category_id?: string | null;
          status?: 'queremos_ir' | 'hemos_ido' | 'pendiente';
          external_url?: string | null;
          updated_at?: string;
        };
      };
      photos: {
        Row: {
          id: string;
          group_id: string;
          place_id: string | null;
          uploaded_by: string;
          storage_path: string;
          thumbnail_path: string;
          original_filename: string | null;
          size_bytes: number | null;
          lat: number | null;
          lng: number | null;
          taken_at: string | null;
          taken_timezone: string | null;
          week_start: string;
          consent_given: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          place_id?: string | null;
          uploaded_by: string;
          storage_path: string;
          thumbnail_path: string;
          original_filename?: string | null;
          size_bytes?: number | null;
          lat?: number | null;
          lng?: number | null;
          taken_at?: string | null;
          taken_timezone?: string | null;
          week_start: string;
          consent_given?: boolean;
          created_at?: string;
        };
        Update: {
          place_id?: string | null;
          consent_given?: boolean;
        };
      };
      weekly_recaps: {
        Row: {
          id: string;
          group_id: string;
          week_start: string;
          week_end: string;
          generated_at: string | null;
          published: boolean;
          summary: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          week_start: string;
          week_end: string;
          generated_at?: string | null;
          published?: boolean;
          summary?: Json | null;
          created_at?: string;
        };
        Update: {
          generated_at?: string | null;
          published?: boolean;
          summary?: Json | null;
        };
      };
      meetups: {
        Row: {
          id: string;
          recap_id: string;
          place_id: string | null;
          detected_at: string;
          lat: number | null;
          lng: number | null;
          is_confirmed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          recap_id: string;
          place_id?: string | null;
          detected_at: string;
          lat?: number | null;
          lng?: number | null;
          is_confirmed?: boolean;
          created_at?: string;
        };
        Update: {
          place_id?: string | null;
          is_confirmed?: boolean;
        };
      };
      meetup_participants: {
        Row: {
          id: string;
          meetup_id: string;
          user_id: string;
          confirmed: boolean;
        };
        Insert: {
          id?: string;
          meetup_id: string;
          user_id: string;
          confirmed?: boolean;
        };
        Update: {
          confirmed?: boolean;
        };
      };
      weekly_votes: {
        Row: {
          id: string;
          group_id: string;
          week_start: string;
          user_id: string;
          place_id: string | null;
          place_text: string | null;
          proposed_date: string | null;
          proposed_time: string | null;
          pretext: 'almuerzo' | 'comida' | 'cena' | 'tardeo' | 'otro' | null;
          pretext_custom: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          week_start: string;
          user_id: string;
          place_id?: string | null;
          place_text?: string | null;
          proposed_date?: string | null;
          proposed_time?: string | null;
          pretext?: 'almuerzo' | 'comida' | 'cena' | 'tardeo' | 'otro' | null;
          pretext_custom?: string | null;
          created_at?: string;
        };
        Update: {
          place_id?: string | null;
          place_text?: string | null;
          proposed_date?: string | null;
          proposed_time?: string | null;
          pretext?: 'almuerzo' | 'comida' | 'cena' | 'tardeo' | 'otro' | null;
          pretext_custom?: string | null;
        };
      };
      comments: {
        Row: {
          id: string;
          user_id: string;
          place_id: string | null;
          recap_id: string | null;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          place_id?: string | null;
          recap_id?: string | null;
          content: string;
          created_at?: string;
        };
        Update: {
          content?: string;
        };
      };
      user_stats: {
        Row: {
          id: string;
          user_id: string;
          group_id: string;
          photos_count: number;
          places_count: number;
          votes_count: number;
          weeks_participated: number;
          score: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          group_id: string;
          photos_count?: number;
          places_count?: number;
          votes_count?: number;
          weeks_participated?: number;
          score?: number;
          updated_at?: string;
        };
        Update: {
          photos_count?: number;
          places_count?: number;
          votes_count?: number;
          weeks_participated?: number;
          score?: number;
          updated_at?: string;
        };
      };
      badges: {
        Row: {
          id: string;
          code: string;
          name_ca: string;
          name_gl: string;
          description_ca: string;
          description_gl: string;
          icon_name: string;
          threshold_type: string | null;
          threshold_value: number | null;
        };
        Insert: {
          id?: string;
          code: string;
          name_ca: string;
          name_gl: string;
          description_ca: string;
          description_gl: string;
          icon_name: string;
          threshold_type?: string | null;
          threshold_value?: number | null;
        };
        Update: {
          code?: string;
          name_ca?: string;
          name_gl?: string;
          description_ca?: string;
          description_gl?: string;
          icon_name?: string;
          threshold_type?: string | null;
          threshold_value?: number | null;
        };
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          group_id: string | null;
          awarded_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_id: string;
          group_id?: string | null;
          awarded_at?: string;
        };
        Update: never;
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          keys: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          keys: Json;
          created_at?: string;
        };
        Update: {
          keys?: Json;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          group_id: string | null;
          type: string;
          title: string;
          body: string;
          payload: Json | null;
          sent_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          group_id?: string | null;
          type: string;
          title: string;
          body: string;
          payload?: Json | null;
          sent_at?: string;
          read_at?: string | null;
        };
        Update: {
          read_at?: string | null;
        };
      };
      reminder_messages: {
        Row: {
          id: string;
          locale: 'ca' | 'gl';
          title: string;
          body: string;
          time_window: 'morning' | 'afternoon' | 'night';
        };
        Insert: {
          id?: string;
          locale: 'ca' | 'gl';
          title: string;
          body: string;
          time_window: 'morning' | 'afternoon' | 'night';
        };
        Update: {
          title?: string;
          body?: string;
          time_window?: 'morning' | 'afternoon' | 'night';
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
