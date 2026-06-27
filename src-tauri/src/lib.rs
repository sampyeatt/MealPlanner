mod db;

use db::*;
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::{Manager, State};

pub struct DbState(pub Mutex<Connection>);

#[tauri::command]
fn get_meals(state: State<DbState>) -> Result<Vec<MealWithIngredients>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::get_meals(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_meal(state: State<DbState>, name: String, description: String) -> Result<Meal, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::create_meal(&conn, &name, &description).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_meal(
    state: State<DbState>, id: i64, name: String, description: String,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::update_meal(&conn, id, &name, &description).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_meal(state: State<DbState>, id: i64) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::delete_meal(&conn, id).map_err(|e| e.to_string())
}

#[tauri::command]
fn add_ingredient(
    state: State<DbState>, meal_id: i64, name: String, quantity: f64, unit: String,
) -> Result<Ingredient, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::add_ingredient(&conn, meal_id, &name, quantity, &unit).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_ingredient(
    state: State<DbState>, id: i64, name: String, quantity: f64, unit: String,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::update_ingredient(&conn, id, &name, quantity, &unit).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_ingredient(state: State<DbState>, id: i64) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::delete_ingredient(&conn, id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_week_plan(state: State<DbState>) -> Result<Vec<WeekPlanEntry>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::get_week_plan(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn add_to_week_plan(
    state: State<DbState>, meal_id: i64, day_of_week: i32,
) -> Result<WeekPlanEntry, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::add_to_week_plan(&conn, meal_id, day_of_week).map_err(|e| e.to_string())
}

#[tauri::command]
fn remove_from_week_plan(state: State<DbState>, id: i64) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::remove_from_week_plan(&conn, id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_shopping_list(state: State<DbState>) -> Result<Vec<ShoppingListEntry>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::get_shopping_list(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn add_to_shopping_list(state: State<DbState>, meal_id: i64) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::add_to_shopping_list(&conn, meal_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn remove_from_shopping_list(state: State<DbState>, meal_id: i64) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::remove_from_shopping_list(&conn, meal_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_ingredient_check(state: State<DbState>, ingredient_id: i64) -> Result<bool, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::toggle_ingredient_check(&conn, ingredient_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn clear_shopping_list(state: State<DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::clear_shopping_list(&conn).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&data_dir)?;
            let db_path = data_dir.join("meals.db");
            let conn = db::init_db(&db_path).expect("failed to initialize database");
            app.manage(DbState(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_meals,
            create_meal,
            update_meal,
            delete_meal,
            add_ingredient,
            update_ingredient,
            delete_ingredient,
            get_week_plan,
            add_to_week_plan,
            remove_from_week_plan,
            get_shopping_list,
            add_to_shopping_list,
            remove_from_shopping_list,
            toggle_ingredient_check,
            clear_shopping_list,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
