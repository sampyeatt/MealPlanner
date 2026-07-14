import type { ReactNode } from "react";

interface FormFieldProps {
  /** Field label text. */
  label: string;
  /** The control (input / textarea) this label describes. */
  children: ReactNode;
}

/** A labelled form control: a `<label>` above its input, in a `form-group`. */
export function FormField({ label, children }: FormFieldProps) {
  return (
    <div className="form-group">
      <label>{label}</label>
      {children}
    </div>
  );
}
