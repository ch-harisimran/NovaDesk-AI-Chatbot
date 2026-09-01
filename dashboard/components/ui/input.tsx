import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-10 w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-3.5 text-sm outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/15",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-colors focus:border-brand/60 focus:ring-2 focus:ring-brand/15 resize-none",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

const Label = forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(({ className, ...props }, ref) => (
  <label ref={ref} className={cn("text-xs font-medium text-zinc-500 dark:text-zinc-400", className)} {...props} />
));
Label.displayName = "Label";

export { Input, Textarea, Label };
