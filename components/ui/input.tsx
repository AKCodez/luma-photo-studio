import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-full border border-[var(--line-strong)] bg-ink-700/50 px-5 text-sm text-paper placeholder:text-paper-mute/60 transition focus:border-ember/60 focus:outline-none focus:ring-2 focus:ring-ember/20",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";
