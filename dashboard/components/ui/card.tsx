import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-black/8 dark:border-white/8 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl shadow-card",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

export { Card };
