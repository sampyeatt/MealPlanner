import { useRef } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import type { IngredientDraft } from "../../types";
import { useCreateMeal } from "../../hooks/api";
import { IngredientEditor } from "../IngredientEditor";

interface CreateMealModalProps {
  onClose: () => void;
  onStatus: (msg: string) => void;
}

interface CreateMealForm {
  name: string;
  description: string;
  /** Ingredients staged with the "+" button. */
  ingredients: IngredientDraft[];
  /** The inline add-row inputs (not yet committed to `ingredients`). */
  newName: string;
  newQty: number | null;
  newUnit: string;
}

/**
 * The "Add New Meal" window. Form state is owned by React Hook Form; the modal
 * is mounted fresh each time it opens, so the fields start empty.
 */
export function CreateMealModal({ onClose, onStatus }: CreateMealModalProps) {
  const createMeal = useCreateMeal();
  const { register, control, handleSubmit, watch, setValue } =
    useForm<CreateMealForm>({
      defaultValues: {
        name: "",
        description: "",
        ingredients: [],
        newName: "",
        newQty: 1,
        newUnit: "cups",
      },
    });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  });
  const nameRef = useRef<HTMLInputElement>(null);

  const newName = watch("newName");
  const newQty = watch("newQty");
  const newUnit = watch("newUnit");

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

  const submit = handleSubmit((data) => {
    const ingredients = [...data.ingredients];
    // Include an ingredient that was typed but not yet added with "+",
    // so nothing the user entered is lost on save.
    const pending = data.newName.trim();
    if (pending) {
      ingredients.push({
        name: pending,
        quantity: data.newQty ?? 1,
        unit: data.newUnit,
      });
    }

    createMeal.mutate(
      { name: data.name, description: data.description, ingredients },
      {
        onSuccess: () => {
          onStatus("Meal created!");
          onClose();
        },
        onError: (err) => {
          console.error("Failed to save meal:", err);
          onStatus(`Failed to save meal: ${err}`);
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
      <form onSubmit={submit}>
        <div className="form-group">
          <label>{"Name"}</label>
          <InputText
            placeholder="e.g. Spaghetti Bolognese"
            {...register("name", { required: true })}
          />
        </div>
        <div className="form-group">
          <label>{"Description (optional)"}</label>
          <InputTextarea
            placeholder="Brief description..."
            rows={3}
            {...register("description")}
          />
        </div>

        <div className="form-section-label">{"Ingredients"}</div>

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
          <Button type="submit" label="Create Meal" />
        </div>
      </form>
    </Dialog>
  );
}
