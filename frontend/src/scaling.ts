import { FoodTemplate } from './types';

const round = (n: number) => Math.round(n * 100) / 100;

/** A template is scalable only if it has a positive default_grams (older templates don't). */
export const isScalable = (t: FoodTemplate | undefined | null): t is FoodTemplate & { default_grams: number } =>
  !!t && t.default_grams != null && t.default_grams > 0;

/** Scale a template's calories/protein to `grams`. Falls back to the template defaults. */
export const scaleTemplate = (t: FoodTemplate, grams: number | null) => {
  if (!isScalable(t) || grams == null || !(grams > 0)) {
    return { calories: t.default_calories, protein: t.default_protein };
  }
  const factor = grams / t.default_grams;
  return { calories: round(t.default_calories * factor), protein: round(t.default_protein * factor) };
};
