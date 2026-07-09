use crate::components::shared::{invoke, MealIdArgs};
use crate::types::*;
use serde::Serialize;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;
use yew::prelude::*;

#[derive(Serialize)]
struct IngredientIdArgs {
    ingredient_id: i64,
}

#[derive(Properties, PartialEq)]
pub struct ShoppingProps {
    pub shopping_list: Vec<ShoppingListEntry>,
    pub on_refresh: Callback<()>,
}

#[function_component(ShoppingView)]
pub fn shopping_view(props: &ShoppingProps) -> Html {
    let on_refresh = props.on_refresh.clone();

    let on_toggle = {
        let on_refresh = on_refresh.clone();
        Callback::from(move |ingredient_id: i64| {
            let on_refresh = on_refresh.clone();
            spawn_local(async move {
                let args = serde_wasm_bindgen::to_value(&IngredientIdArgs { ingredient_id }).unwrap();
                invoke("toggle_ingredient_check", args).await;
                on_refresh.emit(());
            });
        })
    };

    let on_remove_meal = {
        let on_refresh = on_refresh.clone();
        Callback::from(move |meal_id: i64| {
            let on_refresh = on_refresh.clone();
            spawn_local(async move {
                let args = serde_wasm_bindgen::to_value(&MealIdArgs { meal_id }).unwrap();
                invoke("remove_from_shopping_list", args).await;
                on_refresh.emit(());
            });
        })
    };

    let on_clear = {
        let on_refresh = on_refresh.clone();
        Callback::from(move |_| {
            let on_refresh = on_refresh.clone();
            spawn_local(async move {
                invoke("clear_shopping_list", JsValue::NULL).await;
                on_refresh.emit(());
            });
        })
    };

    let total: usize = props.shopping_list.iter().map(|e| e.ingredients.len()).sum();
    let checked: usize = props
        .shopping_list
        .iter()
        .flat_map(|e| e.ingredients.iter())
        .filter(|i| i.checked)
        .count();

    html! {
        <div class="view-container">
            <div class="view-header">
                <h2>{ "Shopping List" }</h2>
                if !props.shopping_list.is_empty() {
                    <button class="btn-ghost" onclick={on_clear}>{ "Clear All" }</button>
                }
            </div>

            if props.shopping_list.is_empty() {
                <div class="empty-state">
                    <p>{ "Your shopping list is empty." }</p>
                    <p class="empty-hint">{ "Go to Meals and tap \"Add to Shopping List\"." }</p>
                </div>
            } else {
                <div class="shopping-progress">
                    <div class="progress-text">{ format!("{} / {} items", checked, total) }</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style={format!("width: {}%", if total > 0 { checked * 100 / total } else { 0 })}></div>
                    </div>
                </div>

                <div class="shopping-sections">
                    { for props.shopping_list.iter().map(|entry| {
                        let meal_id = entry.meal_id;
                        let on_remove_meal = on_remove_meal.clone();
                        let on_toggle = on_toggle.clone();
                        let all_checked = entry.ingredients.iter().all(|i| i.checked);
                        html! {
                            <div class={classes!("shopping-section", all_checked.then_some("all-checked"))}>
                                <div class="shopping-section-header">
                                    <h3>{ &entry.meal_name }</h3>
                                    <button class="btn-icon-sm danger" onclick={Callback::from(move |_| on_remove_meal.emit(meal_id))}>{ "✕" }</button>
                                </div>
                                <div class="shopping-items">
                                    { for entry.ingredients.iter().map(|ing| {
                                        let ing_id = ing.ingredient_id;
                                        let on_toggle = on_toggle.clone();
                                        html! {
                                            <label class={classes!("shopping-item", ing.checked.then_some("checked"))}>
                                                <input
                                                    type="checkbox"
                                                    checked={ing.checked}
                                                    onchange={Callback::from(move |_| on_toggle.emit(ing_id))}
                                                />
                                                <span class="item-check-box"></span>
                                                <span class="item-text">
                                                    <span class="item-name">{ &ing.name }</span>
                                                    <span class="item-qty">{ format!("{} {}", ing.quantity, ing.unit) }</span>
                                                </span>
                                            </label>
                                        }
                                    })}
                                </div>
                            </div>
                        }
                    })}
                </div>
            }
        </div>
    }
}
