import { useId, useState, type ComponentPropsWithRef } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";

interface TextFieldProps extends ComponentPropsWithRef<"input"> {
  label: string;
  error?: string;
  hint?: string;
}

const INPUT_BASE =
  "block h-12 w-full rounded-md border bg-white px-4 text-base text-ink placeholder:text-ink-soft/60 " +
  "transition-colors disabled:cursor-not-allowed disabled:bg-sand disabled:opacity-70";

function inputTone(hasError: boolean): string {
  return hasError
    ? "border-red-600 focus-visible:outline-red-600"
    : "border-sand-200 hover:border-ink/30 focus-visible:border-navy-500";
}

/** Campo com label visível, dica e mensagem de erro associadas via aria-describedby. */
export function TextField({ label, error, hint, id, className, ref, ...props }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn(INPUT_BASE, inputTone(Boolean(error)), className)}
        {...props}
      />
      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function PasswordField({ label, error, hint, id, className, ref, ...props }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={cn(INPUT_BASE, inputTone(Boolean(error)), "pr-12", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 grid w-12 place-items-center text-ink-soft hover:text-ink"
        >
          {visible ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
        </button>
      </div>
      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextAreaFieldProps extends ComponentPropsWithRef<"textarea"> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextAreaField({ label, error, hint, id, className, ref, ...props }: TextAreaFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      <textarea
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn(INPUT_BASE, inputTone(Boolean(error)), "h-auto min-h-32 resize-y py-3", className)}
        {...props}
      />
      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

interface SelectFieldProps extends ComponentPropsWithRef<"select"> {
  label: string;
}

export function SelectField({ label, id, className, ref, children, ...props }: SelectFieldProps) {
  const autoId = useId();
  const selectId = id ?? autoId;

  return (
    <div className="space-y-1.5">
      <label htmlFor={selectId} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(INPUT_BASE, inputTone(false), "appearance-none pr-10", className)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-ink-soft"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}