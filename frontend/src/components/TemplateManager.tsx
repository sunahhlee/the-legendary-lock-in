import React, { useState } from 'react';
import { FoodTemplate } from '../types';

interface TemplateManagerProps {
  templates: FoodTemplate[];
  onCreateTemplate: (template: { name: string; default_calories: number; default_protein: number; default_grams?: number; category?: string }) => Promise<void>;
  onDeleteTemplate: (id: string) => Promise<void>;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  templates,
  onCreateTemplate,
  onDeleteTemplate,
}) => {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [grams, setGrams] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDeleteTemplate(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !calories) return;

    setIsSubmitting(true);
    try {
      await onCreateTemplate({
        name: name.trim(),
        default_calories: parseFloat(calories),
        default_protein: protein ? parseFloat(protein) : 0.0,
        default_grams: grams ? parseFloat(grams) : undefined,
        category: category.trim() || undefined,
      });
      setName('');
      setCalories('');
      setProtein('');
      setGrams('');
      setCategory('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card shadow-md rounded-xl p-5 bg-white border border-gray-100 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Saved Meal Templates</h3>
          <p className="text-xs text-gray-500">Quick-access foods you eat frequently</p>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700"
        >
          {isOpen ? 'Close Templates' : `Manage Templates (${templates.length})`}
        </button>
      </div>

      {isOpen && (
        <div className="mt-5 pt-4 border-t border-gray-100">
          {/* Create Template Form */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-4">
            <input
              type="text"
              placeholder="Template Name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="md:col-span-2 text-xs border border-gray-300 rounded px-2.5 py-1.5"
            />
            <input
              type="number"
              step="any"
              placeholder="Calories (kcal)"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              required
              className="text-xs border border-gray-300 rounded px-2.5 py-1.5"
            />
            <input
              type="number"
              step="any"
              placeholder="Protein (g)"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2.5 py-1.5"
            />
            <input
              type="number"
              step="any"
              min="0"
              placeholder="Per grams (opt)"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2.5 py-1.5"
            />
            <button
              type="submit"
              disabled={isSubmitting || !name || !calories}
              className="bg-gray-800 hover:bg-black text-white text-xs font-semibold rounded px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : '+ Save'}
            </button>
          </form>

          {/* Templates List */}
          {templates.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">No saved templates yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs"
                >
                  <div>
                    <span className="font-semibold text-gray-800">{t.name}</span>
                    <div className="text-gray-500 text-[11px]">
                      {t.default_calories} kcal • {t.default_protein}g protein
                      {t.default_grams ? ` • per ${t.default_grams}g` : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deletingId === t.id}
                    className={`font-bold px-1 ${deletingId === t.id ? 'text-gray-500 text-[11px] cursor-not-allowed' : 'text-gray-400 hover:text-red-600'}`}
                  >
                    {deletingId === t.id ? 'Deleting...' : '×'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
