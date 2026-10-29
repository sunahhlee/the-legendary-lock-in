export interface MealEntry {
  id: string;
  daily_log_id: string;
  template_id?: string | null;
  name: string;
  calories: number;
  protein: number;
  sort_order: number;
  created_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  date: string;
  notes?: string | null;
  entries: MealEntry[];
  total_calories: number;
  total_protein: number;
  created_at: string;
}

export interface FoodTemplate {
  id: string;
  user_id: string;
  name: string;
  default_calories: number;
  default_protein: number;
  category?: string | null;
  created_at: string;
}

export interface DailyMacroPoint {
  date: string;
  total_calories: number;
  total_protein: number;
  entry_count: number;
}

export interface TimeseriesResponse {
  start_date: string;
  end_date: string;
  points: DailyMacroPoint[];
}
