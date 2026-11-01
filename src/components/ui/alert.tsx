import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const alertVariants = cva("rounded-md px-3 py-2 text-sm", {
  variants: {
    variant: {
      error: "bg-destructive-soft text-destructive",
      warning: "bg-warning-soft text-warning",
      info: "bg-primary-soft text-primary",
    },
  },
  defaultVariants: { variant: "error" },
});

export function Alert({
  className,
  variant,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      role={variant === "info" ? "status" : "alert"}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}
