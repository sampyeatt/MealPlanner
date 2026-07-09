use crate::components::shared::{invoke, IdArgs, IngredientDraft, IngredientEditor};
use crate::types::*;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;
use yew::prelude::*;

use super::{close_cb, AddIngredientArgs, UpdateMealArgs};

#[derive(Properties, PartialEq)]
pub(crate) struct EditMealModalProps {
    pub meal: MealWithIngredients,
    pub on_close: Callback<()>,
    pub on_refresh: Callback<()>,
}

/// The "Edit Meal" window: rename/redescribe the meal and add/remove its
/// ingredients (ingredient changes persist immediately).
#[function_component(EditMealModal)]
pub(crate) fn edit_meal_modal(props: &EditMealModalProps) -> Html {
    let name = use_state(|| props.meal.name.clone());
    let desc = use_state(|| props.meal.description.clone());
    let meal_id = props.meal.id;
    let on_close = props.on_close.clone();
    let on_refresh = props.on_refresh.clone();

    let meal_state = use_state(|| props.meal.clone());
    let ing_name = use_state(String::new);
    let ing_qty = use_state(|| "1".to_string());
    let ing_unit = use_state(|| "cups".to_string());
    let ing_name_ref = use_node_ref();

    let refresh_meal = {
        let meal_state = meal_state.clone();
        Callback::from(move |_: ()| {
            let meal_state = meal_state.clone();
            spawn_local(async move {
                let result = invoke("get_meals", JsValue::NULL).await;
                if let Ok(meals) = serde_wasm_bindgen::from_value::<Vec<MealWithIngredients>>(result) {
                    if let Some(updated) = meals.into_iter().find(|m| m.id == meal_id) {
                        meal_state.set(updated);
                    }
                }
            });
        })
    };

    // "+" on the ingredient row: persist immediately (the meal already exists),
    // then clear the row and refocus for the next one.
    let on_add_ing = {
        let n = ing_name.clone();
        let q = ing_qty.clone();
        let u = ing_unit.clone();
        let refresh = refresh_meal.clone();
        let on_refresh = on_refresh.clone();
        let name_ref = ing_name_ref.clone();
        Callback::from(move |_: ()| {
            let name_val = (*n).trim().to_string();
            if name_val.is_empty() { return; }
            let qty_val: f64 = (*q).parse().unwrap_or(1.0);
            let unit_val = (*u).clone();
            let n = n.clone();
            let q = q.clone();
            let refresh = refresh.clone();
            let on_refresh = on_refresh.clone();
            let name_ref = name_ref.clone();
            spawn_local(async move {
                let args = serde_wasm_bindgen::to_value(&AddIngredientArgs {
                    meal_id, name: name_val, quantity: qty_val, unit: unit_val,
                }).unwrap();
                invoke("add_ingredient", args).await;
                n.set(String::new());
                q.set("1".to_string());
                refresh.emit(());
                on_refresh.emit(());
                if let Some(input) = name_ref.cast::<web_sys::HtmlInputElement>() {
                    let _ = input.focus();
                }
            });
        })
    };

    let on_remove_ing = {
        let meal_state = meal_state.clone();
        let refresh = refresh_meal.clone();
        let on_refresh = on_refresh.clone();
        Callback::from(move |idx: usize| {
            let Some(ing) = meal_state.ingredients.get(idx).cloned() else { return; };
            let refresh = refresh.clone();
            let on_refresh = on_refresh.clone();
            spawn_local(async move {
                let args = serde_wasm_bindgen::to_value(&IdArgs { id: ing.id }).unwrap();
                invoke("delete_ingredient", args).await;
                refresh.emit(());
                on_refresh.emit(());
            });
        })
    };

    let on_save_meal = {
        let name = name.clone();
        let desc = desc.clone();
        let on_close = on_close.clone();
        let on_refresh = on_refresh.clone();
        let ing_name = ing_name.clone();
        let ing_qty = ing_qty.clone();
        let ing_unit = ing_unit.clone();
        Callback::from(move |_: MouseEvent| {
            let n = (*name).clone();
            let d = (*desc).clone();
            let on_close = on_close.clone();
            let on_refresh = on_refresh.clone();
            if n.trim().is_empty() { return; }
            // Commit an ingredient still typed in the row so it isn't lost on save.
            let pending_ing = {
                let ing_name_val = (*ing_name).trim().to_string();
                if ing_name_val.is_empty() {
                    None
                } else {
                    Some((ing_name_val, (*ing_qty).parse().unwrap_or(1.0), (*ing_unit).clone()))
                }
            };
            spawn_local(async move {
                if let Some((ing_name_val, qty_val, unit_val)) = pending_ing {
                    let args = serde_wasm_bindgen::to_value(&AddIngredientArgs {
                        meal_id, name: ing_name_val, quantity: qty_val, unit: unit_val,
                    }).unwrap();
                    invoke("add_ingredient", args).await;
                }
                let args = serde_wasm_bindgen::to_value(&UpdateMealArgs { id: meal_id, name: n, description: d }).unwrap();
                invoke("update_meal", args).await;
                on_close.emit(());
                on_refresh.emit(());
            });
        })
    };

    let current_meal = (*meal_state).clone();
    let overlay_close = close_cb(on_close.clone());
    let cancel_close = close_cb(on_close.clone());

    html! {
        <div class="modal-overlay" onclick={overlay_close}>
            <div class="modal modal-large" onclick={Callback::from(|e: MouseEvent| e.stop_propagation())}>
                <h3>{ "Edit Meal" }</h3>
                <div class="form-group">
                    <label>{ "Name" }</label>
                    <input type="text" value={(*name).clone()} oninput={{
                        let n = name.clone();
                        Callback::from(move |e: InputEvent| {
                            let el: web_sys::HtmlInputElement = e.target_unchecked_into();
                            n.set(el.value());
                        })
                    }} />
                </div>
                <div class="form-group">
                    <label>{ "Description" }</label>
                    <textarea value={(*desc).clone()} oninput={{
                        let d = desc.clone();
                        Callback::from(move |e: InputEvent| {
                            let el: web_sys::HtmlTextAreaElement = e.target_unchecked_into();
                            d.set(el.value());
                        })
                    }} />
                </div>

                <h4>{ "Ingredients" }</h4>
                <IngredientEditor
                    items={current_meal.ingredients.iter().map(|i| IngredientDraft { name: i.name.clone(), quantity: i.quantity, unit: i.unit.clone() }).collect::<Vec<_>>()}
                    name={(*ing_name).clone()}
                    qty={(*ing_qty).clone()}
                    unit={(*ing_unit).clone()}
                    name_ref={ing_name_ref.clone()}
                    on_name={{ let s = ing_name.clone(); Callback::from(move |v: String| s.set(v)) }}
                    on_qty={{ let s = ing_qty.clone(); Callback::from(move |v: String| s.set(v)) }}
                    on_unit={{ let s = ing_unit.clone(); Callback::from(move |v: String| s.set(v)) }}
                    on_add={on_add_ing}
                    on_remove={on_remove_ing}
                />

                <div class="modal-actions">
                    <button type="button" class="btn-ghost" onclick={cancel_close}>{ "Cancel" }</button>
                    <button type="button" class="btn-primary" onclick={on_save_meal}>{ "Save Meal" }</button>
                </div>
            </div>
        </div>
    }
}

#[derive(Properties, PartialEq)]
pub(crate) struct ViewMealModalProps {
    pub meal: MealWithIngredients,
    pub on_close: Callback<()>,
    pub on_refresh: Callback<()>,
}

/// The "View & Edit Ingredients" window: shows a meal read-only but lets the
/// user add/remove ingredients (each change persists immediately).
#[function_component(ViewMealModal)]
pub(crate) fn view_meal_modal(props: &ViewMealModalProps) -> Html {
    let meal = use_state(|| props.meal.clone());
    let ing_name = use_state(String::new);
    let ing_qty = use_state(|| "1".to_string());
    let ing_unit = use_state(|| "cups".to_string());
    let ing_name_ref = use_node_ref();
    let on_close = props.on_close.clone();
    let on_refresh = props.on_refresh.clone();
    let meal_id = props.meal.id;

    let refresh_meal = {
        let meal_state = meal.clone();
        Callback::from(move |_: ()| {
            let meal_state = meal_state.clone();
            spawn_local(async move {
                let result = invoke("get_meals", JsValue::NULL).await;
                if let Ok(meals) = serde_wasm_bindgen::from_value::<Vec<MealWithIngredients>>(result) {
                    if let Some(updated) = meals.into_iter().find(|m| m.id == meal_id) {
                        meal_state.set(updated);
                    }
                }
            });
        })
    };

    let on_add_ing = {
        let n = ing_name.clone();
        let q = ing_qty.clone();
        let u = ing_unit.clone();
        let refresh = refresh_meal.clone();
        let on_refresh = on_refresh.clone();
        let name_ref = ing_name_ref.clone();
        Callback::from(move |_: ()| {
            let name_val = (*n).trim().to_string();
            if name_val.is_empty() { return; }
            let qty_val: f64 = (*q).parse().unwrap_or(1.0);
            let unit_val = (*u).clone();
            let n = n.clone();
            let q = q.clone();
            let refresh = refresh.clone();
            let on_refresh = on_refresh.clone();
            let name_ref = name_ref.clone();
            spawn_local(async move {
                let args = serde_wasm_bindgen::to_value(&AddIngredientArgs {
                    meal_id, name: name_val, quantity: qty_val, unit: unit_val,
                }).unwrap();
                invoke("add_ingredient", args).await;
                n.set(String::new());
                q.set("1".to_string());
                refresh.emit(());
                on_refresh.emit(());
                if let Some(input) = name_ref.cast::<web_sys::HtmlInputElement>() {
                    let _ = input.focus();
                }
            });
        })
    };

    let on_remove_ing = {
        let meal_state = meal.clone();
        let refresh = refresh_meal.clone();
        let on_refresh = on_refresh.clone();
        Callback::from(move |idx: usize| {
            let Some(ing) = meal_state.ingredients.get(idx).cloned() else { return; };
            let refresh = refresh.clone();
            let on_refresh = on_refresh.clone();
            spawn_local(async move {
                let args = serde_wasm_bindgen::to_value(&IdArgs { id: ing.id }).unwrap();
                invoke("delete_ingredient", args).await;
                refresh.emit(());
                on_refresh.emit(());
            });
        })
    };

    let current_meal = (*meal).clone();
    let overlay_close = close_cb(on_close.clone());
    let x_close = close_cb(on_close.clone());

    html! {
        <div class="modal-overlay" onclick={overlay_close}>
            <div class="modal modal-large" onclick={Callback::from(|e: MouseEvent| e.stop_propagation())}>
                <div class="modal-title-row">
                    <h3>{ &current_meal.name }</h3>
                    <button class="btn-icon" onclick={x_close}>{ "✕" }</button>
                </div>
                if !current_meal.description.is_empty() {
                    <p class="meal-desc">{ &current_meal.description }</p>
                }
                <h4>{ "Ingredients" }</h4>
                <IngredientEditor
                    items={current_meal.ingredients.iter().map(|i| IngredientDraft { name: i.name.clone(), quantity: i.quantity, unit: i.unit.clone() }).collect::<Vec<_>>()}
                    name={(*ing_name).clone()}
                    qty={(*ing_qty).clone()}
                    unit={(*ing_unit).clone()}
                    name_ref={ing_name_ref.clone()}
                    on_name={{ let s = ing_name.clone(); Callback::from(move |v: String| s.set(v)) }}
                    on_qty={{ let s = ing_qty.clone(); Callback::from(move |v: String| s.set(v)) }}
                    on_unit={{ let s = ing_unit.clone(); Callback::from(move |v: String| s.set(v)) }}
                    on_add={on_add_ing}
                    on_remove={on_remove_ing}
                />
            </div>
        </div>
    }
}
