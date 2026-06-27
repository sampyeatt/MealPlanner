use crate::components::meals::MealsView;
use crate::components::nav::{Nav, Tab};
use crate::components::planner::PlannerView;
use crate::components::shopping::ShoppingView;
use crate::types::*;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;
use yew::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = ["window", "__TAURI__", "core"])]
    async fn invoke(cmd: &str, args: JsValue) -> JsValue;
}

#[function_component(App)]
pub fn app() -> Html {
    let active_tab = use_state(|| Tab::Meals);
    let meals = use_state(Vec::<MealWithIngredients>::new);
    let week_plan = use_state(Vec::<WeekPlanEntry>::new);
    let shopping_list = use_state(Vec::<ShoppingListEntry>::new);

    let load_meals = {
        let meals = meals.clone();
        Callback::from(move |_: ()| {
            let meals = meals.clone();
            spawn_local(async move {
                let result = invoke("get_meals", JsValue::NULL).await;
                if let Ok(data) = serde_wasm_bindgen::from_value::<Vec<MealWithIngredients>>(result) {
                    meals.set(data);
                }
            });
        })
    };

    let load_week_plan = {
        let week_plan = week_plan.clone();
        Callback::from(move |_: ()| {
            let week_plan = week_plan.clone();
            spawn_local(async move {
                let result = invoke("get_week_plan", JsValue::NULL).await;
                if let Ok(data) = serde_wasm_bindgen::from_value::<Vec<WeekPlanEntry>>(result) {
                    week_plan.set(data);
                }
            });
        })
    };

    let load_shopping = {
        let shopping_list = shopping_list.clone();
        Callback::from(move |_: ()| {
            let shopping_list = shopping_list.clone();
            spawn_local(async move {
                let result = invoke("get_shopping_list", JsValue::NULL).await;
                if let Ok(data) = serde_wasm_bindgen::from_value::<Vec<ShoppingListEntry>>(result) {
                    shopping_list.set(data);
                }
            });
        })
    };

    {
        let load_meals = load_meals.clone();
        let load_week_plan = load_week_plan.clone();
        let load_shopping = load_shopping.clone();
        use_effect_with((), move |_| {
            load_meals.emit(());
            load_week_plan.emit(());
            load_shopping.emit(());
            || {}
        });
    }

    let on_refresh = {
        let load_meals = load_meals.clone();
        let load_week_plan = load_week_plan.clone();
        let load_shopping = load_shopping.clone();
        Callback::from(move |_: ()| {
            load_meals.emit(());
            load_week_plan.emit(());
            load_shopping.emit(());
        })
    };

    let on_tab_change = {
        let active_tab = active_tab.clone();
        Callback::from(move |tab: Tab| active_tab.set(tab))
    };

    html! {
        <div class="app-shell">
            <div class="app-content">
                { match *active_tab {
                    Tab::Meals => html! {
                        <MealsView meals={(*meals).clone()} on_refresh={on_refresh.clone()} />
                    },
                    Tab::Planner => html! {
                        <PlannerView
                            meals={(*meals).clone()}
                            week_plan={(*week_plan).clone()}
                            on_refresh={on_refresh.clone()}
                        />
                    },
                    Tab::Shopping => html! {
                        <ShoppingView shopping_list={(*shopping_list).clone()} on_refresh={on_refresh.clone()} />
                    },
                }}
            </div>
            <Nav active={(*active_tab).clone()} on_change={on_tab_change} />
        </div>
    }
}
