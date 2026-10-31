export interface MealEntry {
  id: string;
  daily_log_id: string;
  template_id?: string | null;
  name: string;
  calories: number;
  protein: number;
  grams?: number | null;
  sort_order: number;
  created_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  date: string;
  notes?: string | null;
  energy_journal?: string | null;
  entries: MealEntry[];
  total_calories: number;
  total_protein: number;
  calorie_goal?: number | null;
  protein_goal?: number | null;
  created_at: string;
}

export interface JournalEntry {
  date: string;
  energy_journal: string;
}

export interface UserGoal {
  id: string;
  user_id: string;
  calorie_goal: number;
  protein_goal: number;
  start_date: string;
  end_date?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface FoodTemplate {
  id: string;
  user_id: string;
  name: string;
  default_calories: number;
  default_protein: number;
  default_grams?: number | null;
  category?: string | null;
  created_at: string;
}

export interface DailyMacroPoint {
  date: string;
  total_calories: number;
  total_protein: number;
  entry_count: number;
  calorie_goal?: number | null;
  protein_goal?: number | null;
}

export interface TimeseriesResponse {
  start_date: string;
  end_date: string;
  points: DailyMacroPoint[];
}
