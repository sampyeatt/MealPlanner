import { useRef } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import type {
  EditIngredient,
  IngredientDraft,
  MealWithIngredients,
} from "../../types";
import {
  useAddIngredient,
  useDeleteIngredient,
  useMeals,
  useSaveMeal,
} from "../../hooks/api";
import { IngredientEditor } from "../IngredientEditor";

/** Map a meal's saved ingredients onto the editor's id-less draft shape. */
function toDrafts(meal: MealWithIngredients): IngredientDraft[] {
  return meal.ingredients.map((i) => ({
    name: i.name,
    quantity: i.quantity,
    unit: i.unit,
  }));
}

interface EditMealModalProps {
  meal: MealWithIngredients;
  onClose: () => void;
}

interface EditMealForm {
  name: string;
  description: string;
  ingredients: EditIngredient[];
  newName: string;
  newQty: number | null;
  newUnit: string;
}

/**
 * The "Edit Meal" window. Like the create modal, ingredient add/remove is
 * staged locally and only written to the database when "Save Meal" is pressed
 * (so "Cancel" discards ingredient changes too).
 */
export function EditMealModal({ meal, onClose }: EditMealModalProps) {
  const saveMeal = useSaveMeal();
  const { register, control, handleSubmit, watch, setValue } =
    useForm<EditMealForm>({
      defaultValues: {
        name: meal.name,
        description: meal.description,
        ingredients: meal.ingredients.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
        })),
        newName: "",
        newQty: 1,
        newUnit: "cups",
      },
    });
  // `keyName: "_key"` keeps RHF's generated row key from clobbering the
  // ingredient rows' own numeric `id` field (used to reconcile deletes).
  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
    keyName: "_key",
  });
  const nameRef = useRef<HTMLInputElement>(null);

  const newName = watch("newName");
  const newQty = watch("newQty");
  const newUnit = watch("newUnit");

  // "+" stages a new ingredient locally; nothing is persisted until save.
  const addDraft = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    append({ name: trimmed, quantity: newQty ?? 1, unit: newUnit });
    // Clear the row so the next ingredient can be entered right away...
    setValue("newName", "");
    setValue("newQty", 1);
    // ...and put the cursor back in the name field ("open a new line").
    nameRef.current?.focus();
  };

  const onSave = handleSubmit((data) => {
    // Include an ingredient typed but not yet added with "+", so nothing the
    // user entered is lost on save.
    const ingredients = [...data.ingredients];
    const pending = data.newName.trim();
    if (pending) {
      ingredients.push({
        name: pending,
        quantity: data.newQty ?? 1,
        unit: data.newUnit,
      });
    }

    saveMeal.mutate(
      { meal, name: data.name, description: data.description, ingredients },
      { onSettled: onClose },
    );
  });

  return (
    <Dialog
      header="Edit Meal"
      visible
      onHide={onClose}
      position="bottom"
      modal
      dismissableMask
      className="meal-dialog"
    >
      <form onSubmit={onSave}>
        <div className="form-group">
          <label>{"Name"}</label>
          <InputText {...register("name", { required: true })} />
        </div>
        <div className="form-group">
          <label>{"Description"}</label>
          <InputTextarea rows={3} {...register("description")} />
        </div>

        <h4>{"Ingredients"}</h4>
        <IngredientEditor
          items={fields}
          name={newName}
          qty={newQty}
          unit={newUnit}
          nameRef={nameRef}
          onName={(v) => setValue("newName", v)}
          onQty={(v) => setValue("newQty", v)}
          onUnit={(v) => setValue("newUnit", v)}
          onAdd={addDraft}
          onRemove={remove}
        />

        <div className="modal-actions">
          <Button
            type="button"
            label="Cancel"
            text
            severity="secondary"
            onClick={onClose}
          />
          <Button type="submit" label="Save Meal" />
        </div>
      </form>
    </Dialog>
  );
}

interface ViewMealModalProps {
  meal: MealWithIngredients;
  onClose: () => void;
}

interface AddIngredientForm {
  name: string;
  qty: number | null;
  unit: string;
}

/**
 * The "View & Edit Ingredients" window: shows a meal read-only but lets the
 * user add/remove ingredients (each change persists immediately). The meal is
 * read live from the meals cache so it reflects each mutation.
 */
export function ViewMealModal({ meal, onClose }: ViewMealModalProps) {
  const { data: meals } = useMeals();
  const current = meals?.find((m) => m.id === meal.id) ?? meal;
  const addIngredient = useAddIngredient();
  const deleteIngredient = useDeleteIngredient();
  const { watch, setValue } = useForm<AddIngredientForm>({
    defaultValues: { name: "", qty: 1, unit: "cups" },
  });
  const nameRef = useRef<HTMLInputElement>(null);

  const name = watch("name");
  const qty = watch("qty");
  const unit = watch("unit");

  const onAddIng = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addIngredient.mutate(
      { mealId: meal.id, name: trimmed, quantity: qty ?? 1, unit },
      {
        onSuccess: () => {
          setValue("name", "");
          setValue("qty", 1);
          nameRef.current?.focus();
        },
      },
    );
  };

  const onRemoveIng = (idx: number) => {
    const ing = current.ingredients[idx];
    if (!ing) return;
    deleteIngredient.mutate(ing.id);
  };

  return (
    <Dialog
      header={current.name}
      visible
      onHide={onClose}
      position="bottom"
      modal
      dismissableMask
      className="meal-dialog"
    >
      {current.description && <p className="meal-desc">{current.description}</p>}
      <h4>{"Ingredients"}</h4>
      <IngredientEditor
        items={toDrafts(current)}
        name={name}
        qty={qty}
        unit={unit}
        nameRef={nameRef}
        onName={(v) => setValue("name", v)}
        onQty={(v) => setValue("qty", v)}
        onUnit={(v) => setValue("unit", v)}
        onAdd={onAddIng}
        onRemove={onRemoveIng}
      />
    </Dialog>
  );
}
