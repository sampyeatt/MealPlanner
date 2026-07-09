//! Code shared across more than one page.
//!
//! Each page (Meals, WeeklyPlanner, Shopping) keeps its own page-specific
//! argument payloads, but the Tauri `invoke` bridge, the argument structs that
//! several pages need, and the reusable `IngredientEditor` widget live here so
//! they aren't duplicated.

use serde::Serialize;
use wasm_bindgen::prelude::*;
use yew::prelude::*;

#[wasm_bindgen]
extern "C" {
    /// Call a Tauri command from the webview. Used by every page.
    #[wasm_bindgen(js_namespace = ["window", "__TAURI__", "core"])]
    pub async fn invoke(cmd: &str, args: JsValue) -> JsValue;
}

/// A bare `{ id }` payload (used by the Meals and WeeklyPlanner pages).
#[derive(Serialize)]
pub struct IdArgs {
    pub id: i64,
}

/// A `{ meal_id }` payload (used by the Meals and Shopping pages).
#[derive(Serialize)]
pub struct MealIdArgs {
    pub meal_id: i64,
}

/// One line in the ingredient editor. It intentionally carries no database id
/// so the same widget can display either not-yet-saved drafts (new meal) or
/// already-saved ingredients (existing meal).
#[derive(Clone, PartialEq)]
pub struct IngredientDraft {
    pub name: String,
    pub quantity: f64,
    pub unit: String,
}

#[derive(Properties, PartialEq)]
pub struct IngredientEditorProps {
    /// Ingredients to display, in order.
    pub items: Vec<IngredientDraft>,
    /// Current value of the name / quantity / unit inputs (controlled).
    pub name: String,
    pub qty: String,
    pub unit: String,
    /// Ref to the name input so the parent can refocus it after an add.
    #[prop_or_default]
    pub name_ref: NodeRef,
    pub on_name: Callback<String>,
    pub on_qty: Callback<String>,
    pub on_unit: Callback<String>,
    /// The "+" button was pressed (the parent reads the current inputs).
    pub on_add: Callback<()>,
    /// The delete button on the row at this index was pressed.
    pub on_remove: Callback<usize>,
}

/// The ingredient list + inline "add" row, shared by the new-meal and
/// edit-meal modals so both look and behave identically: a list of rows each
/// with a delete button, and a name/qty/unit row with a "+" button.
#[function_component(IngredientEditor)]
pub fn ingredient_editor(props: &IngredientEditorProps) -> Html {
    let add_click = {
        let on_add = props.on_add.clone();
        Callback::from(move |_: MouseEvent| on_add.emit(()))
    };

    html! {
        <>
            if !props.items.is_empty() {
                <div class="ingredient-list">
                    { for props.items.iter().enumerate().map(|(idx, ing)| {
                        let on_remove = props.on_remove.clone();
                        html! {
                            <div class="ingredient-row">
                                <span class="ing-name">{ &ing.name }</span>
                                <span class="ing-qty">{ format!("{} {}", ing.quantity, ing.unit) }</span>
                                <div class="ing-actions">
                                    <button type="button" class="btn-icon-sm danger"
                                        onclick={Callback::from(move |_: MouseEvent| on_remove.emit(idx))}>
                                        { "🗑" }
                                    </button>
                                </div>
                            </div>
                        }
                    })}
                </div>
            }

            <div class="ingredient-form-row">
                <input
                    ref={props.name_ref.clone()}
                    type="text" placeholder="Ingredient" class="ing-input-name"
                    value={props.name.clone()}
                    oninput={{
                        let cb = props.on_name.clone();
                        Callback::from(move |e: InputEvent| {
                            let el: web_sys::HtmlInputElement = e.target_unchecked_into();
                            cb.emit(el.value());
                        })
                    }}
                />
                <input
                    type="number" placeholder="Qty" step="0.01" class="ing-input-qty"
                    value={props.qty.clone()}
                    oninput={{
                        let cb = props.on_qty.clone();
                        Callback::from(move |e: InputEvent| {
                            let el: web_sys::HtmlInputElement = e.target_unchecked_into();
                            cb.emit(el.value());
                        })
                    }}
                />
                <input
                    type="text" placeholder="Unit" class="ing-input-unit"
                    value={props.unit.clone()}
                    oninput={{
                        let cb = props.on_unit.clone();
                        Callback::from(move |e: InputEvent| {
                            let el: web_sys::HtmlInputElement = e.target_unchecked_into();
                            cb.emit(el.value());
                        })
                    }}
                />
                <button type="button" class="btn-add-ing" onclick={add_click}>{ "+" }</button>
            </div>
        </>
    }
}
