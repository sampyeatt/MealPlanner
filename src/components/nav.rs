use yew::prelude::*;

#[derive(Clone, PartialEq)]
pub enum Tab {
    Meals,
    Planner,
    Shopping,
}

#[derive(Properties, PartialEq)]
pub struct NavProps {
    pub active: Tab,
    pub on_change: Callback<Tab>,
}

#[function_component(Nav)]
pub fn nav(props: &NavProps) -> Html {
    let tabs = [
        (Tab::Meals, "🍽", "Meals"),
        (Tab::Planner, "📅", "Planner"),
        (Tab::Shopping, "🛒", "Shopping"),
    ];

    html! {
        <nav class="bottom-nav">
            { for tabs.iter().map(|(tab, icon, label)| {
                let tab_clone = tab.clone();
                let on_change = props.on_change.clone();
                let is_active = props.active == *tab;
                html! {
                    <button
                        class={classes!("nav-tab", is_active.then_some("active"))}
                        onclick={Callback::from(move |_| on_change.emit(tab_clone.clone()))}
                    >
                        <span class="nav-icon">{ icon }</span>
                        <span class="nav-label">{ label }</span>
                    </button>
                }
            })}
        </nav>
    }
}
