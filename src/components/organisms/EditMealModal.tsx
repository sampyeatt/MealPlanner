import { useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import type { EditIngredient, MealWithIngredients } from "../../types";
import { useSaveMeal } from "../../hooks/api";
import { TextArea, TextInput } from "../atoms";
import { FormField } from "../molecules";
import { IngredientEditor } from "./IngredientEditor";

interface EditMealModalProps {
  meal: MealWithIngredients;
  onClose: () => void;
}

interface EditMealForm {
  name: string;
  description: string;
  recipe_url: string;
  ingredients: EditIngredient[];
}

/**
 * The "Edit Meal" window. Like the create modal, ingredient add/remove is
 * staged locally and only written to the database when "Save Meal" is pressed
 * (so "Cancel" discards ingredient changes too).
 */
export function EditMealModal({ meal, onClose }: EditMealModalProps) {
  const saveMeal = useSaveMeal();
  const { control, handleSubmit } = useForm<EditMealForm>({
    defaultValues: {
      name: meal.name,
      description: meal.description,
      recipe_url: meal.recipe_url,
      ingredients: meal.ingredients.map((i) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
      })),
    },
  });
  // `keyName: "_key"` keeps RHF's generated row key from clobbering the
  // ingredient rows' own numeric `id` field (used to reconcile deletes).
  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
    keyName: "_key",
  });

  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState<number | null>(1);
  const [newUnit, setNewUnit] = useState("cups");
  const nameRef = useRef<HTMLInputElement>(null);

  // "+" stages a new ingredient locally; nothing is persisted until save.
  const addDraft = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    append({ name: trimmed, quantity: newQty ?? 1, unit: newUnit });
    // Clear the row so the next ingredient can be entered right away...
    setNewName("");
    setNewQty(1);
    // ...and put the cursor back in the name field ("open a new line").
    nameRef.current?.focus();
  };

  const onSave = handleSubmit((data) => {
    // Include an ingredient typed but not yet added with "+", so nothing the
    // user entered is lost on save.
    const ingredients = [...data.ingredients];
    const pending = newName.trim();
    if (pending) {
      ingredients.push({ name: pending, quantity: newQty ?? 1, unit: newUnit });
    }

    saveMeal.mutate(
      {
        meal,
        name: data.name,
        description: data.description,
        recipeUrl: data.recipe_url.trim(),
        ingredients,
      },
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
      <form onSubmit={onSave} className="meal-form">
        <FormField label="Name" >
          <Controller
            name="name"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <TextInput
                id={field.name}
                ref={field.ref}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                className={'text-input'}
              />
            )}
          />
        </FormField>
        <FormField label="Description">
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextArea
                id={field.name}
                ref={field.ref}
                rows={3}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                className={'text-input'}
              />
            )}
          />
        </FormField>
        <FormField label="Recipe Link">
          <Controller
            name="recipe_url"
            control={control}
            render={({ field }) => (
              <TextInput
                id={field.name}
                ref={field.ref}
                type="url"
                inputMode="url"
                placeholder="https://example.com/recipe"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                className={'text-input'}
              />
            )}
          />
        </FormField>

        <h4>{"Ingredients"}</h4>
        <IngredientEditor
          items={fields}
          name={newName}
          qty={newQty}
          unit={newUnit}
          nameRef={nameRef}
          onName={setNewName}
          onQty={setNewQty}
          onUnit={setNewUnit}
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
            className={'btn-actions'}
          />
          <Button type="submit" label="Save Meal" className={'btn-actions'} />
        </div>
      </form>
    </Dialog>
  );
}
