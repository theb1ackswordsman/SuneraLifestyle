"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input, type InputProps } from "@/components/ui/input";

type PasswordInputProps = Omit<InputProps, "type" | "rightIcon">;

export function PasswordInput(props: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <Input
      type={show ? "text" : "password"}
      rightIcon={
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
      {...props}
    />
  );
}

interface StrengthBarProps {
  password: string;
}

function getStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { label: "Weak", color: "bg-destructive", width: "w-1/4" };
  if (score === 3) return { label: "Fair", color: "bg-amber-500", width: "w-2/4" };
  if (score === 4) return { label: "Good", color: "bg-blue-500", width: "w-3/4" };
  return { label: "Strong", color: "bg-brand-emerald", width: "w-full" };
}

export function PasswordStrengthBar({ password }: StrengthBarProps) {
  if (!password) return null;
  const { label, color, width } = getStrength(password);

  return (
    <div className="mt-1.5 space-y-1">
      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${color} ${width}`} />
      </div>
      <p className="text-xs text-muted-foreground">
        Password strength: <span className="font-semibold text-foreground">{label}</span>
      </p>
    </div>
  );
}
