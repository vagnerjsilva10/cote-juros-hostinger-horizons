import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#0F172A] text-white shadow-[0_14px_32px_rgba(15,23,42,0.16)] hover:-translate-y-px hover:scale-[1.01] hover:bg-slate-900 hover:shadow-[0_18px_42px_rgba(15,23,42,0.2)]",
        brand:
          "bg-primary text-primary-foreground shadow-[0_14px_32px_rgba(37,99,235,0.22)] hover:-translate-y-px hover:scale-[1.01] hover:bg-primary-hover hover:shadow-[0_18px_42px_rgba(37,99,235,0.28)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[var(--shadow-sm)] hover:-translate-y-px hover:bg-destructive/90",
        outline:
          "border border-input bg-background text-foreground shadow-none hover:-translate-y-px hover:scale-[1.01] hover:bg-background-secondary hover:shadow-[var(--shadow-sm)]",
        secondary:
          "border border-border bg-background-secondary text-foreground shadow-none hover:-translate-y-px hover:bg-background-tertiary",
        ghost: "text-muted-foreground hover:bg-background-secondary hover:text-foreground",
        link: "text-primary underline-offset-4 hover:text-primary-hover hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-5 text-sm",
        icon: "h-10 w-10",
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
