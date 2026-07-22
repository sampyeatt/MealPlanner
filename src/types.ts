export type Tab = "meals" | "planner" | "shopping";

export interface Meal {
  id: number;
  name: string;
  description: string;
  /** Optional link to the recipe (external URL). Empty string when unset. */
  recipe_url: string;
}

export interface Ingredient {
  id: number;
  meal_id: number;
  name: string;
  quantity: number;
  unit: string;
}

export interface MealWithIngredients {
  id: number;
  name: string;
  description: string;
  /** Optional link to the recipe (external URL). Empty string when unset. */
  recipe_url: string;
  ingredients: Ingredient[];
}

export interface WeekPlanEntry {
  id: number;
  meal_id: number;
  day_of_week: number;
  meal_name: string;
}

export interface ShoppingIngredient {
  ingredient_id: number;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
}

export interface ShoppingListEntry {
  meal_id: number;
  meal_name: string;
  ingredients: ShoppingIngredient[];
}

/**
 * One line in the ingredient editor. It intentionally carries no database id
 * so the same widget can display either not-yet-saved drafts (new meal) or
 * already-saved ingredients (existing meal).
 */
export interface IngredientDraft {
  name: string;
  quantity: number;
  unit: string;
}

/**
 * An editable ingredient row in the edit-meal form. Rows already in the
 * database carry their `id` so save can tell which existing rows were removed;
 * newly-staged rows have no `id`. (Superset of `IngredientDraft`.)
 */
export interface EditIngredient {
  id?: number;
  name: string;
  quantity: number;
  unit: string;
}

export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
