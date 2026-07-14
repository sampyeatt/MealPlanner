import { InputNumber, type InputNumberProps } from "primereact/inputnumber";

/**
 * Numeric field. Thin wrapper over PrimeReact's `InputNumber` so numeric inputs
 * share a single import site.
 */
export function NumberInput(props: InputNumberProps) {
  return <InputNumber {...props} />;
}
