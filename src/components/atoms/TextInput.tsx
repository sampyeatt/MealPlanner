import { forwardRef } from "react";
import { InputText, type InputTextProps } from "primereact/inputtext";

/**
 * Single-line text field. Thin wrapper over PrimeReact's `InputText` that
 * forwards its ref (so forms can focus it) and all native props — it exists so
 * the app's text inputs are swapped in one place.
 */
export const TextInput = forwardRef<HTMLInputElement, InputTextProps>(
  (props, ref) => <InputText ref={ref} {...props} />,
);
TextInput.displayName = "TextInput";
