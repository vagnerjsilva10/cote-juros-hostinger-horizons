import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 motion-reduce:transform-none",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-[linear-gradient(90deg,#2563EB_0%,#4F46E5_100%)] px-6 py-3 text-white shadow-[0_14px_34px_rgba(59,130,246,0.24)] hover:-translate-y-[1px] hover:brightness-[1.03] hover:shadow-[0_18px_38px_rgba(79,70,229,0.26)]",
        brand:
          "border border-transparent bg-[linear-gradient(90deg,#0F172A_0%,#1E293B_100%)] px-6 py-3 text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] hover:-translate-y-[1px] hover:brightness-[1.04] hover:shadow-[0_16px_34px_rgba(15,23,42,0.24)]",
        destructive:
          "bg-destructive px-6 py-3 text-destructive-foreground shadow-[var(--shadow-sm)] hover:-translate-y-[1px] hover:bg-destructive/90",
        outline:
          "border border-slate-200 bg-white/92 px-6 py-3 text-foreground shadow-[0_8px_18px_rgba(15,23,42,0.05)] hover:-translate-y-[1px] hover:border-[rgba(79,70,229,0.22)] hover:bg-[rgba(248,250,255,0.96)] hover:shadow-[0_12px_24px_rgba(79,70,229,0.08)]",
        secondary:
          "border border-border bg-background-secondary px-6 py-3 text-foreground shadow-[0_6px_16px_rgba(15,23,42,0.03)] hover:-translate-y-[1px] hover:bg-background-tertiary hover:shadow-[0_10px_22px_rgba(15,23,42,0.06)]",
        ghost: "text-muted-foreground hover:bg-background-secondary hover:text-foreground",
        link: "px-0 py-0 text-primary underline-offset-4 hover:text-primary-hover hover:underline",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2 text-xs",
        lg: "h-[56px] px-6 py-3 text-sm",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
