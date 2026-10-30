import { DailyLog, MealEntry, FoodTemplate, TimeseriesResponse, UserGoal } from './types';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  return headers;
}

function baseHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  return headers;
}

export const api = {
  async getDailyLog(date: string): Promise<DailyLog> {
    const res = await fetch(`/api/logs/${date}`, { headers: baseHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch daily log for ${date}`);
    return res.json();
  },

  async addMealEntry(
    date: string,
    entry: { name: string; calories: number; protein: number; template_id?: string | null },
    saveAsTemplate: boolean = false
  ): Promise<DailyLog> {
    const res = await fetch(`/api/logs/${date}/entries?save_as_template=${saveAsTemplate}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error('Failed to add meal entry');
    return res.json();
  },

  async updateMealEntry(
    id: string,
    update: { name?: string; calories?: number; protein?: number }
  ): Promise<MealEntry> {
    const res = await fetch(`/api/entries/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(update),
    });
    if (!res.ok) throw new Error('Failed to update meal entry');
    return res.json();
  },

  async deleteMealEntry(id: string): Promise<{ message: string; id: string }> {
    const res = await fetch(`/api/entries/${id}`, { method: 'DELETE', headers: baseHeaders() });
    if (!res.ok) throw new Error('Failed to delete meal entry');
    return res.json();
  },

  async getTimeseries(startDate?: string, endDate?: string): Promise<TimeseriesResponse> {
    const params = new URLSearchParams();
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/analytics/timeseries${qs}`, { headers: baseHeaders() });
    if (!res.ok) throw new Error('Failed to fetch timeseries analytics');
    return res.json();
  },

  async getTemplates(): Promise<FoodTemplate[]> {
    const res = await fetch('/api/templates', { headers: baseHeaders() });
    if (!res.ok) throw new Error('Failed to fetch food templates');
    return res.json();
  },

  async createTemplate(template: {
    name: string;
    default_calories: number;
    default_protein: number;
    category?: string;
  }): Promise<FoodTemplate> {
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(template),
    });
    if (!res.ok) throw new Error('Failed to create food template');
    return res.json();
  },

  async deleteTemplate(id: string): Promise<void> {
    const res = await fetch(`/api/templates/${id}`, { method: 'DELETE', headers: baseHeaders() });
    if (!res.ok) throw new Error('Failed to delete template');
  },

  async getUserGoals(userId: string): Promise<UserGoal[]> {
    const res = await fetch(`/api/users/${userId}/goals`, { headers: baseHeaders() });
    if (!res.ok) throw new Error('Failed to fetch user goals');
    return res.json();
  },

  async createUserGoal(
    userId: string,
    goal: { calorie_goal: number; protein_goal: number; start_date: string; end_date?: string | null }
  ): Promise<UserGoal> {
    const res = await fetch(`/api/users/${userId}/goals`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(goal),
    });
    if (!res.ok) throw new Error('Failed to create user goal');
    return res.json();
  },

  async deleteUserGoal(goalId: string): Promise<void> {
    const res = await fetch(`/api/goals/${goalId}`, { method: 'DELETE', headers: baseHeaders() });
    if (!res.ok) throw new Error('Failed to delete goal');
  },

  async updateUsername(username: string): Promise<void> {
    const res = await fetch('/api/me', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ username }),
    });
    if (!res.ok) throw new Error('Failed to update username');
  },
};
