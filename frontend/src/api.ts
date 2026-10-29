import { DailyLog, MealEntry, FoodTemplate, TimeseriesResponse } from './types';

export const api = {
  async getDailyLog(date: string): Promise<DailyLog> {
    const res = await fetch(`/api/logs/${date}`);
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

  async getTimeseries(): Promise<TimeseriesResponse> {
    const res = await fetch('/api/analytics/timeseries');
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
};
