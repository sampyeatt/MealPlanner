use crate::components::shared::{invoke, IngredientDraft, IngredientEditor};
use crate::types::*;
use wasm_bindgen_futures::spawn_local;
use yew::prelude::*;

use super::{close_cb, AddIngredientArgs, CreateMealArgs};

#[derive(Properties, PartialEq)]
pub(crate) struct CreateMealModalProps {
    pub on_close: Callback<()>,
    pub on_refresh: Callback<()>,
    pub on_status: Callback<String>,
}

/// The "Add New Meal" window. Owns its own form state; a fresh instance is
/// mounted each time the modal opens, so the fields start empty.
#[function_component(CreateMealModal)]
pub(crate) fn create_meal_modal(props: &CreateMealModalProps) -> Html {
    let add_meal_name = use_state(String::new);
    let add_meal_desc = use_state(String::new);
    let draft_ingredients = use_state(Vec::<IngredientDraft>::new);
    let new_ing_name = use_state(String::new);
    let new_ing_qty = use_state(|| "1".to_string());
    let new_ing_unit = use_state(|| "cups".to_string());
    let new_ing_name_ref = use_node_ref();

    let on_close = props.on_close.clone();
    let on_refresh = props.on_refresh.clone();
    let on_status = props.on_status.clone();

    let on_add_draft_ingredient = {
        let drafts = draft_ingredients.clone();
        let ing_name = new_ing_name.clone();
        let ing_qty = new_ing_qty.clone();
        let ing_unit = new_ing_unit.clone();
        let ing_name_ref = new_ing_name_ref.clone();
        Callback::from(move |_: ()| {
            let name = (*ing_name).trim().to_string();
            if name.is_empty() { return; }
            let qty: f64 = (*ing_qty).parse().unwrap_or(1.0);
            let unit = (*ing_unit).clone();
            let mut updated = (*drafts).clone();
            updated.push(IngredientDraft { name, quantity: qty, unit });
            drafts.set(updated);
            // Clear the row so the next ingredient can be entered right away...
            ing_name.set(String::new());
            ing_qty.set("1".to_string());
            // ...and put the cursor back in the name field ("open a new line").
            if let Some(input) = ing_name_ref.cast::<web_sys::HtmlInputElement>() {
                let _ = input.focus();
            }
        })
    };

    let on_remove_draft = {
        let drafts = draft_ingredients.clone();
        Callback::from(move |idx: usize| {
            let mut updated = (*drafts).clone();
            updated.remove(idx);
            drafts.set(updated);
        })
    };

    let submit_add_meal = {
        let name = add_meal_name.clone();
        let desc = add_meal_desc.clone();
        let drafts = draft_ingredients.clone();
        let ing_name = new_ing_name.clone();
        let ing_qty = new_ing_qty.clone();
        let ing_unit = new_ing_unit.clone();
        let on_close = on_close.clone();
        let on_refresh = on_refresh.clone();
        let on_status = on_status.clone();
        Callback::from(move |e: SubmitEvent| {
            e.prevent_default();
            let name_val = (*name).clone();
            let desc_val = (*desc).clone();
            let mut ingredients = (*drafts).clone();
            // Include an ingredient that was typed but not yet added with "+",
            // so nothing the user entered is lost on save.
            let pending_name = (*ing_name).trim().to_string();
            if !pending_name.is_empty() {
                ingredients.push(IngredientDraft {
                    name: pending_name,
                    quantity: (*ing_qty).parse().unwrap_or(1.0),
                    unit: (*ing_unit).clone(),
                });
            }
            let on_close = on_close.clone();
            let on_refresh = on_refresh.clone();
            let on_status = on_status.clone();
            if name_val.trim().is_empty() { return; }
            spawn_local(async move {
                let args = serde_wasm_bindgen::to_value(&CreateMealArgs { name: name_val, description: desc_val }).unwrap();
                let result = invoke("create_meal", args).await;
                if let Ok(meal) = serde_wasm_bindgen::from_value::<Meal>(result) {
                    for ing in ingredients {
                        let args = serde_wasm_bindgen::to_value(&AddIngredientArgs {
                            meal_id: meal.id,
                            name: ing.name,
                            quantity: ing.quantity,
                            unit: ing.unit,
                        }).unwrap();
                        invoke("add_ingredient", args).await;
                    }
                }
                on_close.emit(());
                on_status.emit("Meal created!".to_string());
                on_refresh.emit(());
            });
        })
    };

    let overlay_click = close_cb(on_close.clone());
    let cancel_click = close_cb(on_close.clone());

    html! {
        <div class="modal-overlay" onclick={overlay_click}>
            <div class="modal modal-large" onclick={Callback::from(|e: MouseEvent| e.stop_propagation())}>
                <h3>{ "Add New Meal" }</h3>
                <form onsubmit={submit_add_meal}>
                    <div class="form-group">
                        <label>{ "Name" }</label>
                        <input
                            type="text"
                            placeholder="e.g. Spaghetti Bolognese"
                            value={(*add_meal_name).clone()}
                            oninput={{
                                let n = add_meal_name.clone();
                                Callback::from(move |e: InputEvent| {
                                    let el: web_sys::HtmlInputElement = e.target_unchecked_into();
                                    n.set(el.value());
                                })
                            }}
                        />
                    </div>
                    <div class="form-group">
                        <label>{ "Description (optional)" }</label>
                        <textarea
                            placeholder="Brief description..."
                            value={(*add_meal_desc).clone()}
                            oninput={{
                                let d = add_meal_desc.clone();
                                Callback::from(move |e: InputEvent| {
                                    let el: web_sys::HtmlTextAreaElement = e.target_unchecked_into();
                                    d.set(el.value());
                                })
                            }}
                        />
                    </div>

                    <div class="form-section-label">{ "Ingredients" }</div>

                    <IngredientEditor
                        items={(*draft_ingredients).clone()}
                        name={(*new_ing_name).clone()}
                        qty={(*new_ing_qty).clone()}
                        unit={(*new_ing_unit).clone()}
                        name_ref={new_ing_name_ref.clone()}
                        on_name={{ let s = new_ing_name.clone(); Callback::from(move |v: String| s.set(v)) }}
                        on_qty={{ let s = new_ing_qty.clone(); Callback::from(move |v: String| s.set(v)) }}
                        on_unit={{ let s = new_ing_unit.clone(); Callback::from(move |v: String| s.set(v)) }}
                        on_add={on_add_draft_ingredient}
                        on_remove={on_remove_draft}
                    />

                    <div class="modal-actions">
                        <button type="button" class="btn-ghost" onclick={cancel_click}>{ "Cancel" }</button>
                        <button type="submit" class="btn-primary">{ "Create Meal" }</button>
                    </div>
                </form>
            </div>
        </div>
    }
}
