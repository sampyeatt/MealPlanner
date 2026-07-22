import { getDb } from "./db";
import type {
  Ingredient,
  Meal,
  MealWithIngredients,
  ShoppingIngredient,
  ShoppingListEntry,
  WeekPlanEntry,
} from "./types";

// Local-SQLite data layer (Capacitor). These keep the exact same signatures the
// Tauri command wrappers had, so the react-query hooks and components are
// unchanged — only the bodies moved from `invoke(...)` to SQL. The queries are
// direct ports of src-tauri/src/db.rs.

const rows = <T>(values: unknown[] | undefined): T[] => (values as T[]) ?? [];

// --- Meals ---------------------------------------------------------------

const getIngredientsForMeal = async (mealId: number): Promise<Ingredient[]> => {
  const res = await getDb().query(
    "SELECT id, meal_id, name, quantity, unit FROM ingredients WHERE meal_id = ? ORDER BY name",
    [mealId],
  );
  return rows<Ingredient>(res.values);
};

export const getMeals = async (): Promise<MealWithIngredients[]> => {
  const res = await getDb().query(
    "SELECT id, name, description, recipe_url FROM meals ORDER BY name",
  );
  const meals = rows<Meal>(res.values);
  const out: MealWithIngredients[] = [];
  for (const meal of meals) {
    out.push({ ...meal, ingredients: await getIngredientsForMeal(meal.id) });
  }
  return out;
};

export const createMeal = async (
  name: string,
  description: string,
  recipe_url: string,
): Promise<Meal> => {
  const res = await getDb().run(
    "INSERT INTO meals (name, description, recipe_url) VALUES (?, ?, ?)",
    [name, description, recipe_url],
  );
  return { id: res.changes?.lastId ?? -1, name, description, recipe_url };
};

export const updateMeal = async (
  id: number,
  name: string,
  description: string,
  recipe_url: string,
): Promise<void> => {
  await getDb().run(
    "UPDATE meals SET name = ?, description = ?, recipe_url = ? WHERE id = ?",
    [name, description, recipe_url, id],
  );
};

export const deleteMeal = async (id: number): Promise<void> => {
  await getDb().run("DELETE FROM meals WHERE id = ?", [id]);
};

// --- Ingredients ---------------------------------------------------------

export const addIngredient = async (
  meal_id: number,
  name: string,
  quantity: number,
  unit: string,
): Promise<Ingredient> => {
  const res = await getDb().run(
    "INSERT INTO ingredients (meal_id, name, quantity, unit) VALUES (?, ?, ?, ?)",
    [meal_id, name, quantity, unit],
  );
  return { id: res.changes?.lastId ?? -1, meal_id, name, quantity, unit };
};

export const deleteIngredient = async (id: number): Promise<void> => {
  await getDb().run("DELETE FROM ingredients WHERE id = ?", [id]);
};

// --- Week plan -----------------------------------------------------------

export const getWeekPlan = async (): Promise<WeekPlanEntry[]> => {
  const res = await getDb().query(
    `SELECT wp.id, wp.meal_id, wp.day_of_week, m.name AS meal_name
     FROM week_plan wp JOIN meals m ON wp.meal_id = m.id
     ORDER BY wp.day_of_week`,
  );
  return rows<WeekPlanEntry>(res.values);
};

export const addToWeekPlan = async (
  meal_id: number,
  day_of_week: number,
): Promise<WeekPlanEntry> => {
  const db = getDb();
  const res = await db.run(
    "INSERT INTO week_plan (meal_id, day_of_week) VALUES (?, ?)",
    [meal_id, day_of_week],
  );
  const nameRes = await db.query("SELECT name FROM meals WHERE id = ?", [
    meal_id,
  ]);
  const meal_name = rows<{ name: string }>(nameRes.values)[0]?.name ?? "";
  return { id: res.changes?.lastId ?? -1, meal_id, day_of_week, meal_name };
};

export const removeFromWeekPlan = async (id: number): Promise<void> => {
  await getDb().run("DELETE FROM week_plan WHERE id = ?", [id]);
};

// --- Shopping list -------------------------------------------------------

export const getShoppingList = async (): Promise<ShoppingListEntry[]> => {
  const db = getDb();
  const listRes = await db.query(
    `SELECT sl.meal_id, m.name AS meal_name
     FROM shopping_list sl JOIN meals m ON sl.meal_id = m.id
     ORDER BY m.name`,
  );
  const entries = rows<{ meal_id: number; meal_name: string }>(listRes.values);

  const out: ShoppingListEntry[] = [];
  for (const { meal_id, meal_name } of entries) {
    const ingredients = await getIngredientsForMeal(meal_id);
    const shopping: ShoppingIngredient[] = [];
    for (const ing of ingredients) {
      const checkRes = await db.query(
        "SELECT COUNT(*) AS c FROM shopping_checks WHERE ingredient_id = ?",
        [ing.id],
      );
      const c = rows<{ c: number }>(checkRes.values)[0]?.c ?? 0;
      shopping.push({
        ingredient_id: ing.id,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        checked: c > 0,
      });
    }
    out.push({ meal_id, meal_name, ingredients: shopping });
  }
  return out;
};

export const addToShoppingList = async (meal_id: number): Promise<void> => {
  await getDb().run("INSERT OR IGNORE INTO shopping_list (meal_id) VALUES (?)", [
    meal_id,
  ]);
};

export const removeFromShoppingList = async (
  meal_id: number,
): Promise<void> => {
  await getDb().run("DELETE FROM shopping_list WHERE meal_id = ?", [meal_id]);
};

export const toggleIngredientCheck = async (
  ingredient_id: number,
): Promise<boolean> => {
  const db = getDb();
  const res = await db.query(
    "SELECT COUNT(*) AS c FROM shopping_checks WHERE ingredient_id = ?",
    [ingredient_id],
  );
  const c = rows<{ c: number }>(res.values)[0]?.c ?? 0;
  if (c > 0) {
    await db.run("DELETE FROM shopping_checks WHERE ingredient_id = ?", [
      ingredient_id,
    ]);
    return false;
  }
  await db.run("INSERT INTO shopping_checks (ingredient_id) VALUES (?)", [
    ingredient_id,
  ]);
  return true;
};

export const clearShoppingList = async (): Promise<void> => {
  const db = getDb();
  await db.run("DELETE FROM shopping_list", []);
  await db.run("DELETE FROM shopping_checks", []);
};
