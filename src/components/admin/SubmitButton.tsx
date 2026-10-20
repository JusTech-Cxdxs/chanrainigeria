"use client";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText = "Saving…",
  variant = "primary",
  confirm,
  className = "",
  name,
  value,
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: "primary" | "outline" | "danger";
  confirm?: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  const cls = variant === "primary" ? "btn btn-primary" : variant === "danger" ? "btn btn-outline !border-danger text-danger" : "btn btn-outline";
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={`${cls} ${className}`}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}
