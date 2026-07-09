//! The Meals page and its modals.
//!
//! Split across three files: [`list`] renders the page that lists meals,
//! [`create`] holds the "Add Meal" window, and [`edit`] holds the windows for
//! editing an existing meal (both the full edit form and the ingredient view).

mod create;
mod edit;
mod list;

pub use list::MealsView;

use serde::Serialize;
use yew::prelude::*;

// Argument payloads shared by the meal modals.
#[derive(Serialize)]
pub(crate) struct CreateMealArgs {
    pub name: String,
    pub description: String,
}
#[derive(Serialize)]
pub(crate) struct UpdateMealArgs {
    pub id: i64,
    pub name: String,
    pub description: String,
}
#[derive(Serialize)]
pub(crate) struct AddIngredientArgs {
    pub meal_id: i64,
    pub name: String,
    pub quantity: f64,
    pub unit: String,
}

/// Build a click handler that emits `on_close` — used by overlay/cancel buttons.
pub(crate) fn close_cb(on_close: Callback<()>) -> Callback<MouseEvent> {
    Callback::from(move |_: MouseEvent| on_close.emit(()))
}
