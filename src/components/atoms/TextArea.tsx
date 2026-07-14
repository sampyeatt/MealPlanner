import { forwardRef } from "react";
import {
  InputTextarea,
  type InputTextareaProps,
} from "primereact/inputtextarea";

/**
 * Multi-line text field. Thin wrapper over PrimeReact's `InputTextarea`,
 * forwarding ref and all native props for a single swap point.
 */
export const TextArea = forwardRef<HTMLTextAreaElement, InputTextareaProps>(
  (props, ref) => <InputTextarea ref={ref} {...props} />,
);
TextArea.displayName = "TextArea";
