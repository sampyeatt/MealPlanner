use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Meal {
    pub id: i64,
    pub name: String,
    pub description: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Ingredient {
    pub id: i64,
    pub meal_id: i64,
    pub name: String,
    pub quantity: f64,
    pub unit: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MealWithIngredients {
    pub id: i64,
    pub name: String,
    pub description: String,
    pub ingredients: Vec<Ingredient>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WeekPlanEntry {
    pub id: i64,
    pub meal_id: i64,
    pub day_of_week: i32,
    pub meal_name: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ShoppingListEntry {
    pub meal_id: i64,
    pub meal_name: String,
    pub ingredients: Vec<ShoppingIngredient>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ShoppingIngredient {
    pub ingredient_id: i64,
    pub name: String,
    pub quantity: f64,
    pub unit: String,
    pub checked: bool,
}

pub fn init_db(path: &std::path::Path) -> Result<Connection> {
    let conn = Connection::open(path)?;
    create_schema(&conn)?;
    Ok(conn)
}

/// Enable foreign-key enforcement and create all tables if they don't exist.
/// Kept separate from `init_db` so tests can build an in-memory database with
/// the exact same schema.
pub fn create_schema(conn: &Connection) -> Result<()> {
    conn.execute_batch("PRAGMA foreign_keys = ON;")?;
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS meals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS ingredients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            meal_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            quantity REAL NOT NULL,
            unit TEXT NOT NULL,
            FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS week_plan (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            meal_id INTEGER NOT NULL,
            day_of_week INTEGER NOT NULL,
            FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS shopping_list (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            meal_id INTEGER NOT NULL UNIQUE,
            FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS shopping_checks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ingredient_id INTEGER NOT NULL UNIQUE,
            FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
        );",
    )?;
    Ok(())
}

pub fn get_meals(conn: &Connection) -> Result<Vec<MealWithIngredients>> {
    let mut stmt = conn.prepare("SELECT id, name, description FROM meals ORDER BY name")?;
    let meals: Vec<MealWithIngredients> = stmt
        .query_map([], |row| {
            Ok(MealWithIngredients {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                ingredients: vec![],
            })
        })?
        .filter_map(|r| r.ok())
        .collect();

    let mut result = Vec::new();
    for mut meal in meals {
        meal.ingredients = get_ingredients_for_meal(conn, meal.id)?;
        result.push(meal);
    }
    Ok(result)
}

pub fn get_ingredients_for_meal(conn: &Connection, meal_id: i64) -> Result<Vec<Ingredient>> {
    let mut stmt = conn.prepare(
        "SELECT id, meal_id, name, quantity, unit FROM ingredients WHERE meal_id = ?1 ORDER BY name",
    )?;
    let ingredients = stmt
        .query_map(params![meal_id], |row| {
            Ok(Ingredient {
                id: row.get(0)?,
                meal_id: row.get(1)?,
                name: row.get(2)?,
                quantity: row.get(3)?,
                unit: row.get(4)?,
            })
        })?
        .filter_map(|r| r.ok())
        .collect();
    Ok(ingredients)
}

pub fn create_meal(conn: &Connection, name: &str, description: &str) -> Result<Meal> {
    conn.execute(
        "INSERT INTO meals (name, description) VALUES (?1, ?2)",
        params![name, description],
    )?;
    let id = conn.last_insert_rowid();
    Ok(Meal { id, name: name.to_string(), description: description.to_string() })
}

pub fn update_meal(conn: &Connection, id: i64, name: &str, description: &str) -> Result<()> {
    conn.execute(
        "UPDATE meals SET name = ?1, description = ?2 WHERE id = ?3",
        params![name, description, id],
    )?;
    Ok(())
}

pub fn delete_meal(conn: &Connection, id: i64) -> Result<()> {
    conn.execute("DELETE FROM meals WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn add_ingredient(
    conn: &Connection, meal_id: i64, name: &str, quantity: f64, unit: &str,
) -> Result<Ingredient> {
    conn.execute(
        "INSERT INTO ingredients (meal_id, name, quantity, unit) VALUES (?1, ?2, ?3, ?4)",
        params![meal_id, name, quantity, unit],
    )?;
    let id = conn.last_insert_rowid();
    Ok(Ingredient { id, meal_id, name: name.to_string(), quantity, unit: unit.to_string() })
}

pub fn update_ingredient(
    conn: &Connection, id: i64, name: &str, quantity: f64, unit: &str,
) -> Result<()> {
    conn.execute(
        "UPDATE ingredients SET name = ?1, quantity = ?2, unit = ?3 WHERE id = ?4",
        params![name, quantity, unit, id],
    )?;
    Ok(())
}

pub fn delete_ingredient(conn: &Connection, id: i64) -> Result<()> {
    conn.execute("DELETE FROM ingredients WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn get_week_plan(conn: &Connection) -> Result<Vec<WeekPlanEntry>> {
    let mut stmt = conn.prepare(
        "SELECT wp.id, wp.meal_id, wp.day_of_week, m.name
         FROM week_plan wp JOIN meals m ON wp.meal_id = m.id
         ORDER BY wp.day_of_week",
    )?;
    let entries = stmt
        .query_map([], |row| {
            Ok(WeekPlanEntry {
                id: row.get(0)?,
                meal_id: row.get(1)?,
                day_of_week: row.get(2)?,
                meal_name: row.get(3)?,
            })
        })?
        .filter_map(|r| r.ok())
        .collect();
    Ok(entries)
}

pub fn add_to_week_plan(conn: &Connection, meal_id: i64, day_of_week: i32) -> Result<WeekPlanEntry> {
    conn.execute(
        "INSERT INTO week_plan (meal_id, day_of_week) VALUES (?1, ?2)",
        params![meal_id, day_of_week],
    )?;
    let id = conn.last_insert_rowid();
    let meal_name: String =
        conn.query_row("SELECT name FROM meals WHERE id = ?1", params![meal_id], |r| r.get(0))?;
    Ok(WeekPlanEntry { id, meal_id, day_of_week, meal_name })
}

pub fn remove_from_week_plan(conn: &Connection, id: i64) -> Result<()> {
    conn.execute("DELETE FROM week_plan WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn get_shopping_list(conn: &Connection) -> Result<Vec<ShoppingListEntry>> {
    let mut stmt = conn.prepare(
        "SELECT sl.meal_id, m.name FROM shopping_list sl JOIN meals m ON sl.meal_id = m.id ORDER BY m.name",
    )?;
    let meals: Vec<(i64, String)> = stmt
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))?
        .filter_map(|r| r.ok())
        .collect();

    let mut result = Vec::new();
    for (meal_id, meal_name) in meals {
        let ingredients = get_ingredients_for_meal(conn, meal_id)?;
        let shopping_ingredients = ingredients
            .into_iter()
            .map(|ing| {
                let checked = conn
                    .query_row(
                        "SELECT COUNT(*) FROM shopping_checks WHERE ingredient_id = ?1",
                        params![ing.id],
                        |r| r.get::<_, i64>(0),
                    )
                    .unwrap_or(0)
                    > 0;
                ShoppingIngredient {
                    ingredient_id: ing.id,
                    name: ing.name,
                    quantity: ing.quantity,
                    unit: ing.unit,
                    checked,
                }
            })
            .collect();
        result.push(ShoppingListEntry { meal_id, meal_name, ingredients: shopping_ingredients });
    }
    Ok(result)
}

pub fn add_to_shopping_list(conn: &Connection, meal_id: i64) -> Result<()> {
    conn.execute(
        "INSERT OR IGNORE INTO shopping_list (meal_id) VALUES (?1)",
        params![meal_id],
    )?;
    Ok(())
}

pub fn remove_from_shopping_list(conn: &Connection, meal_id: i64) -> Result<()> {
    conn.execute("DELETE FROM shopping_list WHERE meal_id = ?1", params![meal_id])?;
    Ok(())
}

pub fn toggle_ingredient_check(conn: &Connection, ingredient_id: i64) -> Result<bool> {
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM shopping_checks WHERE ingredient_id = ?1",
        params![ingredient_id],
        |r| r.get(0),
    )?;
    if count > 0 {
        conn.execute("DELETE FROM shopping_checks WHERE ingredient_id = ?1", params![ingredient_id])?;
        Ok(false)
    } else {
        conn.execute(
            "INSERT INTO shopping_checks (ingredient_id) VALUES (?1)",
            params![ingredient_id],
        )?;
        Ok(true)
    }
}

pub fn clear_shopping_list(conn: &Connection) -> Result<()> {
    conn.execute_batch("DELETE FROM shopping_list; DELETE FROM shopping_checks;")?;
    Ok(())
}

#[cfg(test)]
mod tests;
