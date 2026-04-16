export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  scheduled_at?: string;
  duration_minutes: number;
  completed: boolean;
  completed_at?: string;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  alarm_sent: boolean;
  created_at: string;
}

export interface TimetableSlot {
  id: string;
  title: string;
  day_of_week?: number;
  start_time: string;
  end_time: string;
  color: string;
  source: 'manual' | 'google' | 'microsoft';
}

export interface MustDoHabit {
  id: string;
  title: string;
  description?: string;
  frequency: string;
  active: boolean;
}

export interface MustNotDoHabit {
  id: string;
  title: string;
  description?: string;
  motivation_video_url?: string;
  motivation_video_title?: string;
  active: boolean;
}

export interface IntegrationStatus {
  provider: 'google' | 'microsoft' | 'whatsapp';
  enabled: boolean;
  granted_at?: string;
}
