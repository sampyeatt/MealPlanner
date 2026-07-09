use crate::components::shared::{invoke, IdArgs, MealIdArgs};
use crate::types::*;
use wasm_bindgen_futures::spawn_local;
use yew::prelude::*;

use super::create::CreateMealModal;
use super::edit::{EditMealModal, ViewMealModal};

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
    let status_msg = use_state(|| Option::<String>::None);

    let close_modal: Callback<()> = {
        let modal = modal.clone();
        Callback::from(move |_: ()| modal.set(ModalState::None))
    };

    let open_add = {
        let modal = modal.clone();
        Callback::from(move |_: MouseEvent| modal.set(ModalState::AddMeal))
    };

    let on_refresh = props.on_refresh.clone();

    let on_status = {
        let status = status_msg.clone();
        Callback::from(move |msg: String| status.set(Some(msg)))
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
        let on_refresh = on_refresh.clone();
        Callback::from(move |meal_id: i64| {
            let status = status.clone();
            let on_refresh = on_refresh.clone();
            spawn_local(async move {
                let args = serde_wasm_bindgen::to_value(&MealIdArgs { meal_id }).unwrap();
                invoke("add_to_shopping_list", args).await;
                status.set(Some("Added to shopping list!".to_string()));
                on_refresh.emit(());
            });
        })
    };

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
                    <CreateMealModal
                        on_close={close_modal.clone()}
                        on_refresh={on_refresh.clone()}
                        on_status={on_status.clone()}
                    />
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
