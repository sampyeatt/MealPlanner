use crate::types::*;
use serde::Serialize;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;
use yew::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = ["window", "__TAURI__", "core"])]
    async fn invoke(cmd: &str, args: JsValue) -> JsValue;
}

#[derive(Serialize)]
struct CreateMealArgs { name: String, description: String }
#[derive(Serialize)]
struct IdArgs { id: i64 }
#[derive(Serialize)]
struct UpdateMealArgs { id: i64, name: String, description: String }
#[derive(Serialize)]
struct AddIngredientArgs { meal_id: i64, name: String, quantity: f64, unit: String }
#[derive(Serialize)]
struct UpdateIngredientArgs { id: i64, name: String, quantity: f64, unit: String }
#[derive(Serialize)]
struct MealIdArgs { meal_id: i64 }

fn close_cb(on_close: Callback<()>) -> Callback<MouseEvent> {
    Callback::from(move |_: MouseEvent| on_close.emit(()))
}

#[derive(Clone, PartialEq)]
struct DraftIngredient {
    name: String,
    quantity: f64,
    unit: String,
}

#[derive(Properties, PartialEq)]
pub struct MealsProps {
    pub meals: Vec<MealWithIngredients>,
    pub on_refresh: Callback<()>,
}

#[derive(Clone, PartialEq)]
enum ModalState {
    None,
    AddMeal,
    EditMeal(MealWithIngredients),
    ViewMeal(MealWithIngredients),
}

#[function_component(MealsView)]
pub fn meals_view(props: &MealsProps) -> Html {
    let modal = use_state(|| ModalState::None);
    let add_meal_name = use_state(String::new);
    let add_meal_desc = use_state(String::new);
    let draft_ingredients = use_state(Vec::<DraftIngredient>::new);
    let new_ing_name = use_state(String::new);
    let new_ing_qty = use_state(|| "1".to_string());
    let new_ing_unit = use_state(|| "cups".to_string());
    let status_msg = use_state(|| Option::<String>::None);

    let close_modal: Callback<()> = {
        let modal = modal.clone();
        Callback::from(move |_: ()| modal.set(ModalState::None))
    };

    let open_add = {
        let modal = modal.clone();
        let name = add_meal_name.clone();
        let desc = add_meal_desc.clone();
        let drafts = draft_ingredients.clone();
        let ing_name = new_ing_name.clone();
        let ing_qty = new_ing_qty.clone();
        let ing_unit = new_ing_unit.clone();
        Callback::from(move |_: MouseEvent| {
            name.set(String::new());
            desc.set(String::new());
            drafts.set(vec![]);
            ing_name.set(String::new());
            ing_qty.set("1".to_string());
            ing_unit.set("cups".to_string());
            modal.set(ModalState::AddMeal);
        })
    };

    let on_add_draft_ingredient = {
        let drafts = draft_ingredients.clone();
        let ing_name = new_ing_name.clone();
        let ing_qty = new_ing_qty.clone();
        let ing_unit = new_ing_unit.clone();
        Callback::from(move |_: MouseEvent| {
            let name = (*ing_name).trim().to_string();
            if name.is_empty() { return; }
            let qty: f64 = (*ing_qty).parse().unwrap_or(1.0);
            let unit = (*ing_unit).clone();
            let mut updated = (*drafts).clone();
            updated.push(DraftIngredient { name, quantity: qty, unit });
            drafts.set(updated);
            ing_name.set(String::new());
            ing_qty.set("1".to_string());
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

    let on_refresh = props.on_refresh.clone();

    let submit_add_meal = {
        let modal = modal.clone();
        let name = add_meal_name.clone();
        let desc = add_meal_desc.clone();
        let drafts = draft_ingredients.clone();
        let on_refresh = on_refresh.clone();
        let status = status_msg.clone();
        Callback::from(move |e: SubmitEvent| {
            e.prevent_default();
            let name_val = (*name).clone();
            let desc_val = (*desc).clone();
            let ingredients = (*drafts).clone();
            let modal = modal.clone();
            let on_refresh = on_refresh.clone();
            let status = status.clone();
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
                modal.set(ModalState::None);
                status.set(Some("Meal created!".to_string()));
                on_refresh.emit(());
            });
        })
    };

    let on_delete = {
        let on_refresh = on_refresh.clone();
        let status = status_msg.clone();
        Callback::from(move |id: i64| {
            let on_refresh = on_refresh.clone();
            let status = status.clone();
            spawn_local(async move {
                let args = serde_wasm_bindgen::to_value(&IdArgs { id }).unwrap();
                invoke("delete_meal", args).await;
                status.set(Some("Meal deleted.".to_string()));
                on_refresh.emit(());
            });
        })
    };

    let on_view = {
        let modal = modal.clone();
        Callback::from(move |meal: MealWithIngredients| modal.set(ModalState::ViewMeal(meal)))
    };

    let on_edit = {
        let modal = modal.clone();
        Callback::from(move |meal: MealWithIngredients| modal.set(ModalState::EditMeal(meal)))
    };

    let on_add_to_shopping = {
        let status = status_msg.clone();
        Callback::from(move |meal_id: i64| {
            let status = status.clone();
            spawn_local(async move {
                let args = serde_wasm_bindgen::to_value(&MealIdArgs { meal_id }).unwrap();
                invoke("add_to_shopping_list", args).await;
                status.set(Some("Added to shopping list!".to_string()));
            });
        })
    };

    let overlay_click = close_cb(close_modal.clone());
    let cancel_click = close_cb(close_modal.clone());

    html! {
        <div class="view-container">
            <div class="view-header">
                <h2>{ "My Meals" }</h2>
                <button class="btn-primary" onclick={open_add}>{ "+ Add Meal" }</button>
            </div>

            if let Some(msg) = (*status_msg).clone() {
                <div class="status-toast" onclick={
                    let s = status_msg.clone();
                    Callback::from(move |_: MouseEvent| s.set(None))
                }>{ msg }</div>
            }

            if props.meals.is_empty() {
                <div class="empty-state">
                    <p>{ "No meals yet. Add your first meal!" }</p>
                </div>
            } else {
                <div class="meal-grid">
                    { for props.meals.iter().map(|meal| {
                        let meal_clone = meal.clone();
                        let on_delete = on_delete.clone();
                        let on_view = on_view.clone();
                        let on_edit = on_edit.clone();
                        let on_add_to_shopping = on_add_to_shopping.clone();
                        html! {
                            <MealCard
                                meal={meal_clone}
                                on_delete={on_delete}
                                on_view={on_view}
                                on_edit={on_edit}
                                on_add_to_shopping={on_add_to_shopping}
                            />
                        }
                    })}
                </div>
            }

            { match (*modal).clone() {
                ModalState::AddMeal => html! {
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

                                if !(*draft_ingredients).is_empty() {
                                    <div class="ingredient-list">
                                        { for (*draft_ingredients).iter().enumerate().map(|(idx, ing)| {
                                            let on_remove_draft = on_remove_draft.clone();
                                            html! {
                                                <div class="ingredient-row">
                                                    <span class="ing-name">{ &ing.name }</span>
                                                    <span class="ing-qty">{ format!("{} {}", ing.quantity, ing.unit) }</span>
                                                    <button type="button" class="btn-icon-sm danger"
                                                        onclick={Callback::from(move |_: MouseEvent| on_remove_draft.emit(idx))}>
                                                        { "✕" }
                                                    </button>
                                                </div>
                                            }
                                        })}
                                    </div>
                                }

                                <div class="ingredient-form-row">
                                    <input
                                        type="text" placeholder="Ingredient" class="ing-input-name"
                                        value={(*new_ing_name).clone()}
                                        oninput={{
                                            let n = new_ing_name.clone();
                                            Callback::from(move |e: InputEvent| {
                                                let el: web_sys::HtmlInputElement = e.target_unchecked_into();
                                                n.set(el.value());
                                            })
                                        }}
                                    />
                                    <input
                                        type="number" placeholder="Qty" step="0.01" class="ing-input-qty"
                                        value={(*new_ing_qty).clone()}
                                        oninput={{
                                            let q = new_ing_qty.clone();
                                            Callback::from(move |e: InputEvent| {
                                                let el: web_sys::HtmlInputElement = e.target_unchecked_into();
                                                q.set(el.value());
                                            })
                                        }}
                                    />
                                    <select class="ing-input-unit"
                                        onchange={{
                                            let u = new_ing_unit.clone();
                                            Callback::from(move |e: Event| {
                                                let el: web_sys::HtmlSelectElement = e.target_unchecked_into();
                                                u.set(el.value());
                                            })
                                        }}
                                    >
                                        { for ["oz","lbs","cups","ml","eaches","floz","tbs","tbsp"].iter().map(|unit| {
                                            let selected = *unit == (*new_ing_unit).as_str();
                                            html! { <option value={*unit} selected={selected}>{ unit }</option> }
                                        })}
                                    </select>
                                    <button type="button" class="btn-add-ing" onclick={on_add_draft_ingredient}>
                                        { "+" }
                                    </button>
                                </div>

                                <div class="modal-actions">
                                    <button type="button" class="btn-ghost" onclick={cancel_click}>{ "Cancel" }</button>
                                    <button type="submit" class="btn-primary">{ "Create Meal" }</button>
                                </div>
                            </form>
                        </div>
                    </div>
                },
                ModalState::EditMeal(meal) => html! {
                    <EditMealModal meal={meal} on_close={close_modal.clone()} on_refresh={on_refresh.clone()} />
                },
                ModalState::ViewMeal(meal) => html! {
                    <ViewMealModal meal={meal} on_close={close_modal.clone()} on_refresh={on_refresh.clone()} />
                },
                ModalState::None => html! {},
            }}
        </div>
    }
}

#[derive(Properties, PartialEq)]
struct MealCardProps {
    meal: MealWithIngredients,
    on_delete: Callback<i64>,
    on_view: Callback<MealWithIngredients>,
    on_edit: Callback<MealWithIngredients>,
    on_add_to_shopping: Callback<i64>,
}

#[function_component(MealCard)]
fn meal_card(props: &MealCardProps) -> Html {
    let meal = &props.meal;
    let meal_clone = meal.clone();
    let meal_edit = meal.clone();
    let on_view = props.on_view.clone();
    let on_edit = props.on_edit.clone();
    let on_delete = props.on_delete.clone();
    let on_add_to_shopping = props.on_add_to_shopping.clone();
    let meal_id = meal.id;

    html! {
        <div class="meal-card">
            <div class="meal-card-header">
                <h3>{ &meal.name }</h3>
                <div class="meal-card-actions">
                    <button class="btn-icon" title="View & Edit Ingredients"
                        onclick={Callback::from(move |_: MouseEvent| on_view.emit(meal_clone.clone()))}>{ "📋" }</button>
                    <button class="btn-icon" title="Edit Meal"
                        onclick={Callback::from(move |_: MouseEvent| on_edit.emit(meal_edit.clone()))}>{ "✏️" }</button>
                    <button class="btn-icon danger" title="Delete"
                        onclick={Callback::from(move |_: MouseEvent| on_delete.emit(meal_id))}>{ "🗑" }</button>
                </div>
            </div>
            if !meal.description.is_empty() {
                <p class="meal-desc">{ &meal.description }</p>
            }
            <div class="meal-ingredients-summary">
                <span class="ingredient-count">
                    { format!("{} ingredient{}", meal.ingredients.len(), if meal.ingredients.len() == 1 { "" } else { "s" }) }
                </span>
            </div>
            <button class="btn-outline btn-full"
                onclick={Callback::from(move |_: MouseEvent| on_add_to_shopping.emit(meal_id))}>
                { "🛒 Add to Shopping List" }
            </button>
        </div>
    }
}

#[derive(Properties, PartialEq)]
struct EditMealModalProps {
    meal: MealWithIngredients,
    on_close: Callback<()>,
    on_refresh: Callback<()>,
}

#[function_component(EditMealModal)]
fn edit_meal_modal(props: &EditMealModalProps) -> Html {
    let name = use_state(|| props.meal.name.clone());
    let desc = use_state(|| props.meal.description.clone());
    let meal_id = props.meal.id;
    let on_close = props.on_close.clone();
    let on_refresh = props.on_refresh.clone();

    let on_submit = {
        let name = name.clone();
        let desc = desc.clone();
        let on_close = on_close.clone();
        let on_refresh = on_refresh.clone();
        Callback::from(move |e: SubmitEvent| {
            e.prevent_default();
            let n = (*name).clone();
            let d = (*desc).clone();
            let on_close = on_close.clone();
            let on_refresh = on_refresh.clone();
            spawn_local(async move {
                let args = serde_wasm_bindgen::to_value(&UpdateMealArgs { id: meal_id, name: n, description: d }).unwrap();
                invoke("update_meal", args).await;
                on_close.emit(());
                on_refresh.emit(());
            });
        })
    };

    let overlay_close = close_cb(on_close.clone());
    let cancel_close = close_cb(on_close.clone());

    html! {
        <div class="modal-overlay" onclick={overlay_close}>
            <div class="modal" onclick={Callback::from(|e: MouseEvent| e.stop_propagation())}>
                <h3>{ "Edit Meal" }</h3>
                <form onsubmit={on_submit}>
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
                    <div class="modal-actions">
                        <button type="button" class="btn-ghost" onclick={cancel_close}>{ "Cancel" }</button>
                        <button type="submit" class="btn-primary">{ "Save" }</button>
                    </div>
                </form>
            </div>
        </div>
    }
}

#[derive(Properties, PartialEq)]
struct ViewMealModalProps {
    meal: MealWithIngredients,
    on_close: Callback<()>,
    on_refresh: Callback<()>,
}

#[derive(Clone, PartialEq)]
enum IngredientEditState {
    None,
    Adding,
    Editing(Ingredient),
}

#[function_component(ViewMealModal)]
fn view_meal_modal(props: &ViewMealModalProps) -> Html {
    let meal = use_state(|| props.meal.clone());
    let edit_state = use_state(|| IngredientEditState::None);
    let ing_name = use_state(String::new);
    let ing_qty = use_state(|| "1".to_string());
    let ing_unit = use_state(|| "cups".to_string());
    let on_close = props.on_close.clone();
    let on_refresh = props.on_refresh.clone();

    let refresh_meal = {
        let meal_id = props.meal.id;
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

    let start_add = {
        let es = edit_state.clone();
        let n = ing_name.clone();
        let q = ing_qty.clone();
        let u = ing_unit.clone();
        Callback::from(move |_: MouseEvent| {
            n.set(String::new());
            q.set("1".to_string());
            u.set("cups".to_string());
            es.set(IngredientEditState::Adding);
        })
    };

    let cancel_edit = {
        let es = edit_state.clone();
        Callback::from(move |_: MouseEvent| es.set(IngredientEditState::None))
    };

    let submit_ingredient = {
        let es = edit_state.clone();
        let n = ing_name.clone();
        let q = ing_qty.clone();
        let u = ing_unit.clone();
        let meal_id = props.meal.id;
        let refresh = refresh_meal.clone();
        let on_refresh = on_refresh.clone();
        Callback::from(move |e: SubmitEvent| {
            e.prevent_default();
            let name_val = (*n).clone();
            let qty_val: f64 = (*q).parse().unwrap_or(1.0);
            let unit_val = (*u).clone();
            let es_val = (*es).clone();
            let es = es.clone();
            let refresh = refresh.clone();
            let on_refresh = on_refresh.clone();
            if name_val.trim().is_empty() { return; }
            spawn_local(async move {
                match es_val {
                    IngredientEditState::Adding => {
                        let args = serde_wasm_bindgen::to_value(&AddIngredientArgs {
                            meal_id, name: name_val, quantity: qty_val, unit: unit_val,
                        }).unwrap();
                        invoke("add_ingredient", args).await;
                    }
                    IngredientEditState::Editing(ing) => {
                        let args = serde_wasm_bindgen::to_value(&UpdateIngredientArgs {
                            id: ing.id, name: name_val, quantity: qty_val, unit: unit_val,
                        }).unwrap();
                        invoke("update_ingredient", args).await;
                    }
                    IngredientEditState::None => {}
                }
                es.set(IngredientEditState::None);
                refresh.emit(());
                on_refresh.emit(());
            });
        })
    };

    let on_delete_ing = {
        let refresh = refresh_meal.clone();
        let on_refresh = on_refresh.clone();
        Callback::from(move |id: i64| {
            let refresh = refresh.clone();
            let on_refresh = on_refresh.clone();
            spawn_local(async move {
                let args = serde_wasm_bindgen::to_value(&IdArgs { id }).unwrap();
                invoke("delete_ingredient", args).await;
                refresh.emit(());
                on_refresh.emit(());
            });
        })
    };

    let on_edit_ing = {
        let es = edit_state.clone();
        let n = ing_name.clone();
        let q = ing_qty.clone();
        let u = ing_unit.clone();
        Callback::from(move |ing: Ingredient| {
            n.set(ing.name.clone());
            q.set(ing.quantity.to_string());
            u.set(ing.unit.clone());
            es.set(IngredientEditState::Editing(ing));
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
                <div class="ingredient-list">
                    { for current_meal.ingredients.iter().map(|ing| {
                        let ing_clone = ing.clone();
                        let ing_id = ing.id;
                        let on_delete_ing = on_delete_ing.clone();
                        let on_edit_ing = on_edit_ing.clone();
                        html! {
                            <div class="ingredient-row">
                                <span class="ing-name">{ &ing.name }</span>
                                <span class="ing-qty">{ format!("{} {}", ing.quantity, ing.unit) }</span>
                                <div class="ing-actions">
                                    <button class="btn-icon-sm"
                                        onclick={Callback::from(move |_: MouseEvent| on_edit_ing.emit(ing_clone.clone()))}>{ "✏️" }</button>
                                    <button class="btn-icon-sm danger"
                                        onclick={Callback::from(move |_: MouseEvent| on_delete_ing.emit(ing_id))}>{ "🗑" }</button>
                                </div>
                            </div>
                        }
                    })}
                </div>

                { match (*edit_state).clone() {
                    IngredientEditState::None => html! {
                        <button class="btn-outline" onclick={start_add}>{ "+ Add Ingredient" }</button>
                    },
                    _ => html! {
                        <form class="ingredient-form" onsubmit={submit_ingredient}>
                            <div class="ingredient-form-row">
                                <input
                                    type="text" placeholder="Ingredient name" class="ing-input-name"
                                    value={(*ing_name).clone()}
                                    oninput={{
                                        let n = ing_name.clone();
                                        Callback::from(move |e: InputEvent| {
                                            let el: web_sys::HtmlInputElement = e.target_unchecked_into();
                                            n.set(el.value());
                                        })
                                    }}
                                />
                                <input
                                    type="number" placeholder="Qty" step="0.01" class="ing-input-qty"
                                    value={(*ing_qty).clone()}
                                    oninput={{
                                        let q = ing_qty.clone();
                                        Callback::from(move |e: InputEvent| {
                                            let el: web_sys::HtmlInputElement = e.target_unchecked_into();
                                            q.set(el.value());
                                        })
                                    }}
                                />
                                <select class="ing-input-unit"
                                    onchange={{
                                        let u = ing_unit.clone();
                                        Callback::from(move |e: Event| {
                                            let el: web_sys::HtmlSelectElement = e.target_unchecked_into();
                                            u.set(el.value());
                                        })
                                    }}
                                >
                                    { for ["oz","lbs","cups","ml","eaches","floz","tbs","tbsp"].iter().map(|unit| {
                                        let selected = *unit == (*ing_unit).as_str();
                                        html! { <option value={*unit} selected={selected}>{ unit }</option> }
                                    })}
                                </select>
                            </div>
                            <div class="modal-actions">
                                <button type="button" class="btn-ghost" onclick={cancel_edit}>{ "Cancel" }</button>
                                <button type="submit" class="btn-primary">{ "Save" }</button>
                            </div>
                        </form>
                    }
                }}
            </div>
        </div>
    }
}
