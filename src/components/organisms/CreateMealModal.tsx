import { useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import type { IngredientDraft } from "../../types";
import { useCreateMeal } from "../../hooks/api";
import { useUiStore } from "../../store/uiStore";
import { TextArea, TextInput } from "../atoms";
import { FormField } from "../molecules";
import { IngredientEditor } from "./IngredientEditor";

interface CreateMealModalProps {
  onClose: () => void;
}

interface CreateMealForm {
  name: string;
  description: string;
  /** Ingredients staged with the "+" button. */
  ingredients: IngredientDraft[];
}

/**
 * The "Add New Meal" window. The persisted fields (name, description, staged
 * ingredients) are owned by React Hook Form; the inline add-row inputs are
 * transient scratch state kept in local `useState`. The modal is mounted fresh
 * each time it opens, so everything starts empty.
 */
export function CreateMealModal({ onClose }: CreateMealModalProps) {
  const createMeal = useCreateMeal();
  const setStatus = useUiStore((s) => s.setStatus);
  const { control, handleSubmit } = useForm<CreateMealForm>({
    defaultValues: { name: "", description: "", ingredients: [] },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  });

  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState<number | null>(1);
  const [newUnit, setNewUnit] = useState("cups");
  const nameRef = useRef<HTMLInputElement>(null);

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

  const submit = handleSubmit((data) => {
    const ingredients = [...data.ingredients];
    // Include an ingredient that was typed but not yet added with "+",
    // so nothing the user entered is lost on save.
    const pending = newName.trim();
    if (pending) {
      ingredients.push({ name: pending, quantity: newQty ?? 1, unit: newUnit });
    }

    createMeal.mutate(
      { name: data.name, description: data.description, ingredients },
      {
        onSuccess: () => {
          setStatus("Meal created!");
          onClose();
        },
        onError: (err) => {
          console.error("Failed to save meal:", err);
          setStatus(`Failed to save meal: ${err}`);
          onClose();
        },
      },
    );
  });

  return (
    <Dialog
      header="Add New Meal"
      visible
      onHide={onClose}
      position="bottom"
      modal
      dismissableMask
      className="meal-dialog"
    >
      <form onSubmit={submit} className="meal-form">
        <FormField label="Name">
          <Controller
            name="name"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <TextInput
                id={field.name}
                ref={field.ref}
                placeholder="e.g. Spaghetti Bolognese"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                className={'text-input'}
              />
            )}
          />
        </FormField>
        <FormField label="Description (optional)">
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextArea
                id={field.name}
                ref={field.ref}
                placeholder="Brief description..."
                rows={3}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                className={'text-input'}
              />
            )}
          />
        </FormField>

        <div className="form-section-label">{"Ingredients"}</div>

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
          <Button type="submit" label="Create Meal" className={'btn-actions'} />
        </div>
      </form>
    </Dialog>
  );
}
