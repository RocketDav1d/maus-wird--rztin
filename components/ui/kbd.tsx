import * as React from "react";
import { cn } from "@/lib/utils";

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex items-center justify-center select-none",
        "min-w-5 h-5 px-1.5 rounded-md",
        "bg-muted text-muted-foreground",
        "border border-border shadow-[inset_0_-1px_0_0_var(--border)]",
        "font-mono text-[10px] font-medium leading-none tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

export { Kbd };
