import { invoke } from "@tauri-apps/api/core";
import type {
  Ingredient,
  Meal,
  MealWithIngredients,
  ShoppingListEntry,
  WeekPlanEntry,
} from "./types";

// Thin typed wrappers around the Tauri commands defined in `src-tauri/src/lib.rs`.
// Argument keys are camelCase: Tauri v2 maps camelCase JS args to the command's
// snake_case Rust parameters (e.g. `mealId` -> `meal_id`).

export const getMeals = () => invoke<MealWithIngredients[]>("get_meals");

export const createMeal = (name: string, description: string) =>
  invoke<Meal>("create_meal", { name, description });

export const updateMeal = (id: number, name: string, description: string) =>
  invoke<void>("update_meal", { id, name, description });

export const deleteMeal = (id: number) => invoke<void>("delete_meal", { id });

export const addIngredient = (
  meal_id: number,
  name: string,
  quantity: number,
  unit: string,
) =>
  invoke<Ingredient>("add_ingredient", {
    mealId: meal_id,
    name,
    quantity,
    unit,
  });

export const deleteIngredient = (id: number) =>
  invoke<void>("delete_ingredient", { id });

export const getWeekPlan = () => invoke<WeekPlanEntry[]>("get_week_plan");

export const addToWeekPlan = (meal_id: number, day_of_week: number) =>
  invoke<WeekPlanEntry>("add_to_week_plan", {
    mealId: meal_id,
    dayOfWeek: day_of_week,
  });

export const removeFromWeekPlan = (id: number) =>
  invoke<void>("remove_from_week_plan", { id });

export const getShoppingList = () =>
  invoke<ShoppingListEntry[]>("get_shopping_list");

export const addToShoppingList = (meal_id: number) =>
  invoke<void>("add_to_shopping_list", { mealId: meal_id });

export const removeFromShoppingList = (meal_id: number) =>
  invoke<void>("remove_from_shopping_list", { mealId: meal_id });

export const toggleIngredientCheck = (ingredient_id: number) =>
  invoke<boolean>("toggle_ingredient_check", { ingredientId: ingredient_id });

export const clearShoppingList = () => invoke<void>("clear_shopping_list");
