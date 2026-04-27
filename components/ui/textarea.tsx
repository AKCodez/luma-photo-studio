import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-2xl border border-[var(--line-strong)] bg-ink-700/50 px-4 py-3 text-sm text-paper placeholder:text-paper-mute/60 transition focus:border-ember/60 focus:outline-none focus:ring-2 focus:ring-ember/20 resize-none scrollbar-pretty",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
