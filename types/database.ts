export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          gender?: string;
          onboarding_completed?: boolean;
          last_daily_swipe_date?: string;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          gender?: string;
          onboarding_completed?: boolean;
          last_daily_swipe_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          gender?: string;
          onboarding_completed?: boolean;
          last_daily_swipe_date?: string;
          created_at?: string;
        };
      };
      photos: {
        Row: {
          id: string;
          user_id: string;
          image_url: string;
          rating: number;
          gender?: string;
          upload_date: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          image_url: string;
          rating?: number;
          gender?: string;
          upload_date?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          image_url?: string;
          rating?: number;
          gender?: string;
          upload_date?: string;
        };
      };
      swipes: {
        Row: {
          id: string;
          voter_id: string;
          photo_id: string;
          liked: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          voter_id: string;
          photo_id: string;
          liked: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          voter_id?: string;
          photo_id?: string;
          liked?: boolean;
          created_at?: string;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Photo = Database['public']['Tables']['photos']['Row'];
export type Swipe = Database['public']['Tables']['swipes']['Row'];
