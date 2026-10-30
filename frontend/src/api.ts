import { DailyLog, MealEntry, FoodTemplate, JournalEntry, TimeseriesResponse, UserGoal } from './types';

export const api = {
  async getJournalEntries(startDate?: string, endDate?: string, limit?: number): Promise<JournalEntry[]> {
    const params = new URLSearchParams();
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    if (limit) params.set('limit', String(limit));
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`/api/journal${qs}`);
    if (!res.ok) throw new Error('Failed to fetch journal entries');
    return res.json();
  },

  async getDailyLog(date: string): Promise<DailyLog> {
    const res = await fetch(`/api/logs/${date}`);
    if (!res.ok) throw new Error(`Failed to fetch daily log for ${date}`);
    return res.json();
  },

  async updateEnergyJournal(date: string, energyJournal: string): Promise<DailyLog> {
    const res = await fetch(`/api/logs/${date}/energy-journal`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ energy_journal: energyJournal }),
    });
    if (!res.ok) throw new Error('Failed to save energy journal');
    return res.json();
  },

  async addMealEntry(
    date: string,
    entry: { name: string; calories: number; protein: number; template_id?: string | null },
    saveAsTemplate: boolean = false
  ): Promise<DailyLog> {
    const res = await fetch(`/api/logs/${date}/entries?save_as_template=${saveAsTemplate}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    if (!res.ok) throw new Error('Failed to update meal entry');
    return res.json();
  },

  async deleteMealEntry(id: string): Promise<{ message: string; id: string }> {
    const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete meal entry');
    return res.json();
  },

  async getTimeseries(startDate?: string, endDate?: string): Promise<TimeseriesResponse> {
    const params = new URLSearchParams();
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`/api/analytics/timeseries${qs}`);
    if (!res.ok) throw new Error('Failed to fetch timeseries analytics');
    return res.json();
  },

  async getTemplates(): Promise<FoodTemplate[]> {
    const res = await fetch('/api/templates');
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template),
    });
    if (!res.ok) throw new Error('Failed to create food template');
    return res.json();
  },

  async deleteTemplate(id: string): Promise<void> {
    const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete template');
  },

  // User Goals
  async getUserGoals(userId: string): Promise<UserGoal[]> {
    const res = await fetch(`/api/users/${userId}/goals`);
    if (!res.ok) throw new Error('Failed to fetch user goals');
    return res.json();
  },

  async createUserGoal(
    userId: string,
    goal: {
      calorie_goal: number;
      protein_goal: number;
      start_date: string;
      end_date?: string | null;
      notes?: string | null;
    }
  ): Promise<UserGoal> {
    const res = await fetch(`/api/users/${userId}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal),
    });
    if (!res.ok) throw new Error('Failed to create user goal');
    return res.json();
  },

  async deleteUserGoal(goalId: string): Promise<void> {
    const res = await fetch(`/api/goals/${goalId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete goal');
  },
};
