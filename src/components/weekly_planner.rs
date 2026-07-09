use crate::components::shared::{invoke, IdArgs};
use crate::types::*;
use serde::Serialize;
use wasm_bindgen_futures::spawn_local;
use yew::prelude::*;

#[derive(Serialize)]
struct AddToWeekPlanArgs {
    meal_id: i64,
    day_of_week: i32,
}

#[derive(Properties, PartialEq)]
pub struct WeeklyPlannerProps {
    pub meals: Vec<MealWithIngredients>,
    pub week_plan: Vec<WeekPlanEntry>,
    pub on_refresh: Callback<()>,
}

#[function_component(WeeklyPlannerView)]
pub fn weekly_planner_view(props: &WeeklyPlannerProps) -> Html {
    let on_refresh = props.on_refresh.clone();

    let on_remove = {
        let on_refresh = on_refresh.clone();
        Callback::from(move |id: i64| {
            let on_refresh = on_refresh.clone();
            spawn_local(async move {
                let args = serde_wasm_bindgen::to_value(&IdArgs { id }).unwrap();
                invoke("remove_from_week_plan", args).await;
                on_refresh.emit(());
            });
        })
    };

    let on_add = {
        let on_refresh = on_refresh.clone();
        Callback::from(move |(meal_id, day): (i64, i32)| {
            let on_refresh = on_refresh.clone();
            spawn_local(async move {
                let args = serde_wasm_bindgen::to_value(&AddToWeekPlanArgs { meal_id, day_of_week: day }).unwrap();
                invoke("add_to_week_plan", args).await;
                on_refresh.emit(());
            });
        })
    };

    html! {
        <div class="view-container">
            <div class="view-header">
                <h2>{ "Weekly Planner" }</h2>
            </div>
            <div class="week-grid">
                { for (0..7i32).map(|day| {
                    let entries: Vec<WeekPlanEntry> = props.week_plan.iter()
                        .filter(|e| e.day_of_week == day)
                        .cloned()
                        .collect();
                    html! {
                        <DayCard
                            key={day}
                            day={day}
                            day_name={DAYS[day as usize]}
                            entries={entries}
                            meals={props.meals.clone()}
                            on_add={on_add.clone()}
                            on_remove={on_remove.clone()}
                        />
                    }
                })}
            </div>
        </div>
    }
}

#[derive(Properties, PartialEq)]
struct DayCardProps {
    day: i32,
    day_name: &'static str,
    entries: Vec<WeekPlanEntry>,
    meals: Vec<MealWithIngredients>,
    on_add: Callback<(i64, i32)>,
    on_remove: Callback<i64>,
}

#[function_component(DayCard)]
fn day_card(props: &DayCardProps) -> Html {
    let picking = use_state(|| false);
    let selected_id = use_state(|| String::from("-1"));

    let day = props.day;

    let open_picker = {
        let picking = picking.clone();
        let selected_id = selected_id.clone();
        Callback::from(move |_: MouseEvent| {
            selected_id.set("-1".to_string());
            picking.set(true);
        })
    };

    let cancel_pick = {
        let picking = picking.clone();
        Callback::from(move |_: MouseEvent| picking.set(false))
    };

    let confirm_pick = {
        let picking = picking.clone();
        let selected_id = selected_id.clone();
        let on_add = props.on_add.clone();
        Callback::from(move |_: MouseEvent| {
            let id_str = (*selected_id).clone();
            if let Ok(meal_id) = id_str.parse::<i64>() {
                if meal_id > 0 {
                    on_add.emit((meal_id, day));
                    picking.set(false);
                    selected_id.set("-1".to_string());
                }
            }
        })
    };

    let on_select_change = {
        let selected_id = selected_id.clone();
        Callback::from(move |e: Event| {
            let el: web_sys::HtmlSelectElement = e.target_unchecked_into();
            selected_id.set(el.value());
        })
    };

    html! {
        <div class="day-card">
            <div class="day-header">
                <span class="day-name">{ props.day_name }</span>
                <button class="btn-icon-sm" onclick={open_picker}>{ "+" }</button>
            </div>
            <div class="day-meals">
                { for props.entries.iter().map(|entry| {
                    let entry_id = entry.id;
                    let on_remove = props.on_remove.clone();
                    html! {
                        <div class="day-meal-chip">
                            <span>{ &entry.meal_name }</span>
                            <button class="chip-remove"
                                onclick={Callback::from(move |_: MouseEvent| on_remove.emit(entry_id))}>
                                { "✕" }
                            </button>
                        </div>
                    }
                })}
            </div>
            if *picking {
                <div class="day-picker">
                    <select onchange={on_select_change} value={(*selected_id).clone()}>
                        <option value="-1">{ "-- Select meal --" }</option>
                        { for props.meals.iter().map(|m| html! {
                            <option value={m.id.to_string()}>{ &m.name }</option>
                        })}
                    </select>
                    <div class="picker-actions">
                        <button class="btn-ghost-sm" onclick={cancel_pick}>{ "Cancel" }</button>
                        <button class="btn-primary-sm" onclick={confirm_pick}>{ "Add" }</button>
                    </div>
                </div>
            }
        </div>
    }
}
