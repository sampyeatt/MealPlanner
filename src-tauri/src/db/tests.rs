//! Full-coverage test suite for the data layer. Every command exposed by
//! the Tauri backend delegates to one of these functions, so exercising
//! them here validates the core behaviour of the app: managing meals,
//! ingredients, the weekly plan and the shopping list.
use super::*;
use rusqlite::Connection;

/// Fresh in-memory database with the production schema and foreign-key
/// enforcement enabled (needed to verify ON DELETE CASCADE behaviour).
fn test_db() -> Connection {
    let conn = Connection::open_in_memory().expect("open in-memory db");
    create_schema(&conn).expect("create schema");
    conn
}

// ---- Meals -----------------------------------------------------------------

#[test]
fn create_meal_persists_and_is_returned() {
    let conn = test_db();
    let meal = create_meal(&conn, "Tacos", "Beefy").unwrap();
    assert!(meal.id > 0);
    assert_eq!(meal.name, "Tacos");
    assert_eq!(meal.description, "Beefy");

    let all = get_meals(&conn).unwrap();
    assert_eq!(all.len(), 1);
    assert_eq!(all[0].name, "Tacos");
    assert!(all[0].ingredients.is_empty());
}

#[test]
fn get_meals_returns_them_sorted_by_name() {
    let conn = test_db();
    create_meal(&conn, "Zucchini Bake", "").unwrap();
    create_meal(&conn, "Apple Pie", "").unwrap();
    create_meal(&conn, "Meatloaf", "").unwrap();

    let names: Vec<String> = get_meals(&conn).unwrap().into_iter().map(|m| m.name).collect();
    assert_eq!(names, vec!["Apple Pie", "Meatloaf", "Zucchini Bake"]);
}

#[test]
fn update_meal_changes_name_and_description() {
    let conn = test_db();
    let meal = create_meal(&conn, "Soup", "old").unwrap();
    update_meal(&conn, meal.id, "Tomato Soup", "new").unwrap();

    let stored = &get_meals(&conn).unwrap()[0];
    assert_eq!(stored.name, "Tomato Soup");
    assert_eq!(stored.description, "new");
}

#[test]
fn delete_meal_removes_it() {
    let conn = test_db();
    let meal = create_meal(&conn, "Chili", "").unwrap();
    delete_meal(&conn, meal.id).unwrap();
    assert!(get_meals(&conn).unwrap().is_empty());
}

// ---- Ingredients -----------------------------------------------------------

#[test]
fn add_ingredient_attaches_it_to_the_meal() {
    let conn = test_db();
    let meal = create_meal(&conn, "Pancakes", "").unwrap();
    let ing = add_ingredient(&conn, meal.id, "Flour", 2.0, "cups").unwrap();

    assert!(ing.id > 0);
    assert_eq!(ing.meal_id, meal.id);
    assert_eq!(ing.name, "Flour");
    assert_eq!(ing.quantity, 2.0);
    assert_eq!(ing.unit, "cups");

    let meal = &get_meals(&conn).unwrap()[0];
    assert_eq!(meal.ingredients.len(), 1);
    assert_eq!(meal.ingredients[0].name, "Flour");
}

#[test]
fn ingredients_are_scoped_to_their_meal_and_sorted_by_name() {
    let conn = test_db();
    let a = create_meal(&conn, "Meal A", "").unwrap();
    let b = create_meal(&conn, "Meal B", "").unwrap();
    add_ingredient(&conn, a.id, "Sugar", 1.0, "cups").unwrap();
    add_ingredient(&conn, a.id, "Butter", 1.0, "tbsp").unwrap();
    add_ingredient(&conn, b.id, "Salt", 1.0, "tsp").unwrap();

    let a_ings = get_ingredients_for_meal(&conn, a.id).unwrap();
    let a_names: Vec<&str> = a_ings.iter().map(|i| i.name.as_str()).collect();
    assert_eq!(a_names, vec!["Butter", "Sugar"]); // sorted, and Salt excluded

    assert_eq!(get_ingredients_for_meal(&conn, b.id).unwrap().len(), 1);
}

#[test]
fn update_ingredient_changes_all_fields() {
    let conn = test_db();
    let meal = create_meal(&conn, "Curry", "").unwrap();
    let ing = add_ingredient(&conn, meal.id, "Rice", 1.0, "cups").unwrap();
    update_ingredient(&conn, ing.id, "Basmati Rice", 2.5, "cups").unwrap();

    let stored = &get_ingredients_for_meal(&conn, meal.id).unwrap()[0];
    assert_eq!(stored.name, "Basmati Rice");
    assert_eq!(stored.quantity, 2.5);
    assert_eq!(stored.unit, "cups");
}

#[test]
fn delete_ingredient_removes_only_that_one() {
    let conn = test_db();
    let meal = create_meal(&conn, "Salad", "").unwrap();
    let keep = add_ingredient(&conn, meal.id, "Lettuce", 1.0, "head").unwrap();
    let drop = add_ingredient(&conn, meal.id, "Crouton", 1.0, "cups").unwrap();

    delete_ingredient(&conn, drop.id).unwrap();

    let remaining = get_ingredients_for_meal(&conn, meal.id).unwrap();
    assert_eq!(remaining.len(), 1);
    assert_eq!(remaining[0].id, keep.id);
}

#[test]
fn deleting_a_meal_cascades_to_its_ingredients() {
    let conn = test_db();
    let meal = create_meal(&conn, "Omelette", "").unwrap();
    add_ingredient(&conn, meal.id, "Egg", 3.0, "eaches").unwrap();
    delete_meal(&conn, meal.id).unwrap();
    assert!(get_ingredients_for_meal(&conn, meal.id).unwrap().is_empty());
}

// ---- Weekly plan -----------------------------------------------------------

#[test]
fn add_meal_to_a_day_records_it_with_the_meal_name() {
    let conn = test_db();
    let meal = create_meal(&conn, "Roast Chicken", "").unwrap();
    let entry = add_to_week_plan(&conn, meal.id, 2).unwrap(); // Wednesday

    assert_eq!(entry.meal_id, meal.id);
    assert_eq!(entry.day_of_week, 2);
    assert_eq!(entry.meal_name, "Roast Chicken");

    let plan = get_week_plan(&conn).unwrap();
    assert_eq!(plan.len(), 1);
    assert_eq!(plan[0].meal_name, "Roast Chicken");
    assert_eq!(plan[0].day_of_week, 2);
}

#[test]
fn week_plan_supports_multiple_meals_per_day_and_is_ordered_by_day() {
    let conn = test_db();
    let a = create_meal(&conn, "Breakfast", "").unwrap();
    let b = create_meal(&conn, "Dinner", "").unwrap();
    add_to_week_plan(&conn, b.id, 5).unwrap();
    add_to_week_plan(&conn, a.id, 0).unwrap();
    add_to_week_plan(&conn, b.id, 0).unwrap(); // two meals on Monday

    let plan = get_week_plan(&conn).unwrap();
    assert_eq!(plan.len(), 3);
    // ordered by day_of_week ascending
    let days: Vec<i32> = plan.iter().map(|e| e.day_of_week).collect();
    assert_eq!(days, vec![0, 0, 5]);
}

#[test]
fn remove_from_week_plan_deletes_the_entry() {
    let conn = test_db();
    let meal = create_meal(&conn, "Stew", "").unwrap();
    let entry = add_to_week_plan(&conn, meal.id, 1).unwrap();
    remove_from_week_plan(&conn, entry.id).unwrap();
    assert!(get_week_plan(&conn).unwrap().is_empty());
}

#[test]
fn deleting_a_meal_cascades_to_the_week_plan() {
    let conn = test_db();
    let meal = create_meal(&conn, "Fish", "").unwrap();
    add_to_week_plan(&conn, meal.id, 3).unwrap();
    delete_meal(&conn, meal.id).unwrap();
    assert!(get_week_plan(&conn).unwrap().is_empty());
}

// ---- Shopping list ---------------------------------------------------------

#[test]
fn add_to_shopping_list_includes_the_meals_ingredients() {
    let conn = test_db();
    let meal = create_meal(&conn, "Guacamole", "").unwrap();
    add_ingredient(&conn, meal.id, "Avocado", 2.0, "eaches").unwrap();
    add_ingredient(&conn, meal.id, "Lime", 1.0, "eaches").unwrap();

    add_to_shopping_list(&conn, meal.id).unwrap();

    let list = get_shopping_list(&conn).unwrap();
    assert_eq!(list.len(), 1);
    assert_eq!(list[0].meal_name, "Guacamole");
    assert_eq!(list[0].ingredients.len(), 2);
    // nothing checked off yet
    assert!(list[0].ingredients.iter().all(|i| !i.checked));
}

#[test]
fn add_to_shopping_list_is_idempotent() {
    let conn = test_db();
    let meal = create_meal(&conn, "Pizza", "").unwrap();
    add_to_shopping_list(&conn, meal.id).unwrap();
    add_to_shopping_list(&conn, meal.id).unwrap(); // second add must not duplicate

    assert_eq!(get_shopping_list(&conn).unwrap().len(), 1);
}

#[test]
fn remove_from_shopping_list_removes_the_meal() {
    let conn = test_db();
    let meal = create_meal(&conn, "Burger", "").unwrap();
    add_to_shopping_list(&conn, meal.id).unwrap();
    remove_from_shopping_list(&conn, meal.id).unwrap();
    assert!(get_shopping_list(&conn).unwrap().is_empty());
}

#[test]
fn toggle_ingredient_check_flips_state_and_is_reflected_in_the_list() {
    let conn = test_db();
    let meal = create_meal(&conn, "Toast", "").unwrap();
    let ing = add_ingredient(&conn, meal.id, "Bread", 2.0, "slices").unwrap();
    add_to_shopping_list(&conn, meal.id).unwrap();

    // first toggle -> checked
    assert!(toggle_ingredient_check(&conn, ing.id).unwrap());
    assert!(get_shopping_list(&conn).unwrap()[0].ingredients[0].checked);

    // second toggle -> unchecked
    assert!(!toggle_ingredient_check(&conn, ing.id).unwrap());
    assert!(!get_shopping_list(&conn).unwrap()[0].ingredients[0].checked);
}

#[test]
fn clear_shopping_list_empties_meals_and_checks() {
    let conn = test_db();
    let meal = create_meal(&conn, "Sandwich", "").unwrap();
    let ing = add_ingredient(&conn, meal.id, "Ham", 3.0, "slices").unwrap();
    add_to_shopping_list(&conn, meal.id).unwrap();
    toggle_ingredient_check(&conn, ing.id).unwrap();

    clear_shopping_list(&conn).unwrap();

    assert!(get_shopping_list(&conn).unwrap().is_empty());
    // re-adding the meal shows a fresh (unchecked) list, proving checks were cleared too
    add_to_shopping_list(&conn, meal.id).unwrap();
    assert!(!get_shopping_list(&conn).unwrap()[0].ingredients[0].checked);
}

#[test]
fn deleting_a_meal_cascades_to_the_shopping_list() {
    let conn = test_db();
    let meal = create_meal(&conn, "Wrap", "").unwrap();
    add_to_shopping_list(&conn, meal.id).unwrap();
    delete_meal(&conn, meal.id).unwrap();
    assert!(get_shopping_list(&conn).unwrap().is_empty());
}

#[test]
fn shopping_list_is_ordered_by_meal_name() {
    let conn = test_db();
    let z = create_meal(&conn, "Ziti", "").unwrap();
    let a = create_meal(&conn, "Anchovies", "").unwrap();
    add_to_shopping_list(&conn, z.id).unwrap();
    add_to_shopping_list(&conn, a.id).unwrap();

    let names: Vec<String> =
        get_shopping_list(&conn).unwrap().into_iter().map(|e| e.meal_name).collect();
    assert_eq!(names, vec!["Anchovies", "Ziti"]);
}
