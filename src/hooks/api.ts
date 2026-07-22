import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api";
import type {
  EditIngredient,
  IngredientDraft,
  MealWithIngredients,
} from "../types";

// Query keys for the three server-state collections. Mutations invalidate the
// keys they can affect so any component reading them refetches automatically.
export const mealsKey = ["meals"] as const;
export const weekPlanKey = ["weekPlan"] as const;
export const shoppingListKey = ["shoppingList"] as const;

// --- Queries -------------------------------------------------------------

export const useMeals = () =>
  useQuery({ queryKey: mealsKey, queryFn: api.getMeals });

export const useWeekPlan = () =>
  useQuery({ queryKey: weekPlanKey, queryFn: api.getWeekPlan });

export const useShoppingList = () =>
  useQuery({ queryKey: shoppingListKey, queryFn: api.getShoppingList });

// --- Meal mutations ------------------------------------------------------

/** Create a meal, then persist each staged ingredient against the new id. */
export function useCreateMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      recipeUrl: string;
      ingredients: IngredientDraft[];
    }) => {
      const meal = await api.createMeal(
        data.name,
        data.description,
        data.recipeUrl,
      );
      for (const ing of data.ingredients) {
        await api.addIngredient(meal.id, ing.name, ing.quantity, ing.unit);
      }
      return meal;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: mealsKey }),
  });
}

/**
 * Save edits to an existing meal: reconcile the staged ingredient list against
 * the rows present when the modal opened (delete removed rows, insert new ones,
 * leave untouched rows alone), then update the meal's name/description.
 */
export function useSaveMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      meal: MealWithIngredients;
      name: string;
      description: string;
      recipeUrl: string;
      ingredients: EditIngredient[];
    }) => {
      const keptIds = new Set(
        data.ingredients
          .filter((i) => i.id != null)
          .map((i) => i.id as number),
      );
      const toDelete = data.meal.ingredients.filter((i) => !keptIds.has(i.id));
      const toAdd = data.ingredients.filter((i) => i.id == null);

      for (const ing of toDelete) {
        await api.deleteIngredient(ing.id);
      }
      for (const ing of toAdd) {
        await api.addIngredient(
          data.meal.id,
          ing.name,
          ing.quantity,
          ing.unit,
        );
      }
      await api.updateMeal(
        data.meal.id,
        data.name,
        data.description,
        data.recipeUrl,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mealsKey });
      qc.invalidateQueries({ queryKey: shoppingListKey });
    },
  });
}

export function useDeleteMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteMeal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mealsKey });
      qc.invalidateQueries({ queryKey: weekPlanKey });
      qc.invalidateQueries({ queryKey: shoppingListKey });
    },
  });
}

// --- Single-ingredient mutations (used by the immediate-persist view) ----

export function useAddIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      mealId: number;
      name: string;
      quantity: number;
      unit: string;
    }) => api.addIngredient(data.mealId, data.name, data.quantity, data.unit),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mealsKey });
      qc.invalidateQueries({ queryKey: shoppingListKey });
    },
  });
}

export function useDeleteIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteIngredient(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mealsKey });
      qc.invalidateQueries({ queryKey: shoppingListKey });
    },
  });
}

// --- Week plan mutations -------------------------------------------------

export function useAddToWeekPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { mealId: number; dayOfWeek: number }) =>
      api.addToWeekPlan(data.mealId, data.dayOfWeek),
    onSuccess: () => qc.invalidateQueries({ queryKey: weekPlanKey }),
  });
}

export function useRemoveFromWeekPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.removeFromWeekPlan(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: weekPlanKey }),
  });
}

// --- Shopping list mutations ---------------------------------------------

export function useAddToShoppingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mealId: number) => api.addToShoppingList(mealId),
    onSuccess: () => qc.invalidateQueries({ queryKey: shoppingListKey }),
  });
}

export function useRemoveFromShoppingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mealId: number) => api.removeFromShoppingList(mealId),
    onSuccess: () => qc.invalidateQueries({ queryKey: shoppingListKey }),
  });
}

export function useToggleIngredientCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ingredientId: number) =>
      api.toggleIngredientCheck(ingredientId),
    onSuccess: () => qc.invalidateQueries({ queryKey: shoppingListKey }),
  });
}

export function useClearShoppingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.clearShoppingList(),
    onSuccess: () => qc.invalidateQueries({ queryKey: shoppingListKey }),
  });
}
