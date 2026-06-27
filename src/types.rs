use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, PartialEq, Debug)]
pub struct Meal {
    pub id: i64,
    pub name: String,
    pub description: String,
}

#[derive(Serialize, Deserialize, Clone, PartialEq, Debug)]
pub struct Ingredient {
    pub id: i64,
    pub meal_id: i64,
    pub name: String,
    pub quantity: f64,
    pub unit: String,
}

#[derive(Serialize, Deserialize, Clone, PartialEq, Debug)]
pub struct MealWithIngredients {
    pub id: i64,
    pub name: String,
    pub description: String,
    pub ingredients: Vec<Ingredient>,
}

#[derive(Serialize, Deserialize, Clone, PartialEq, Debug)]
pub struct WeekPlanEntry {
    pub id: i64,
    pub meal_id: i64,
    pub day_of_week: i32,
    pub meal_name: String,
}

#[derive(Serialize, Deserialize, Clone, PartialEq, Debug)]
pub struct ShoppingIngredient {
    pub ingredient_id: i64,
    pub name: String,
    pub quantity: f64,
    pub unit: String,
    pub checked: bool,
}

#[derive(Serialize, Deserialize, Clone, PartialEq, Debug)]
pub struct ShoppingListEntry {
    pub meal_id: i64,
    pub meal_name: String,
    pub ingredients: Vec<ShoppingIngredient>,
}

pub const DAYS: [&str; 7] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
