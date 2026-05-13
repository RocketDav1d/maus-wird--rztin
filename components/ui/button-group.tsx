import * as React from "react";
import { cn } from "@/lib/utils";

function ButtonGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="button-group"
      className={cn(
        "inline-flex items-center rounded-lg border border-border bg-background overflow-hidden divide-x divide-border [&>*]:rounded-none",
        className,
      )}
      {...props}
    />
  );
}

export { ButtonGroup };
