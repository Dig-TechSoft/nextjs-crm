import React from "react";
import clsx from "clsx";

interface FieldProps {
  className?: string;
  name?: string;
  error?: any;
  children: React.ReactNode;
}

export default function Field({ className, name, error, children }: FieldProps) {
  const defaultError = "Invalid value";

  const getErrorMessage = (err: any) => {
    if (typeof err === "object") {
      return err?.message || err?.code || defaultError;
    }
    return err || defaultError;
  };

  const errorMsg = error ? getErrorMessage(error) : null;

  // Clone children to add uniqueId if needed, or just rely on children being correct.
  // In Svelte `let:uniqueId` is used. In React we can use a generated ID or pass it down.
  // For simplicity, we'll assume children handle their own IDs or we wrap them.
  // Actually, the Svelte component wraps the slot in a div.
  
  return (
    <div className={clsx(className, { error: !!errorMsg })}>
      {children}
      
      {errorMsg && (
        <div className="help-block help-block-error">
          <pre>{errorMsg}</pre>
        </div>
      )}
    </div>
  );
}
