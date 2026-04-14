import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 motion-reduce:transform-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#0F172A] px-6 py-3 text-white shadow-[0_10px_30px_rgba(15,23,42,0.16)] hover:scale-[1.02] hover:bg-[#020617] hover:shadow-[0_20px_40px_rgba(15,23,42,0.2)]",
        brand:
          "bg-[#2563EB] px-6 py-3 text-white shadow-[0_10px_30px_rgba(37,99,235,0.22)] hover:scale-[1.02] hover:bg-[#1D4ED8] hover:shadow-[0_20px_40px_rgba(37,99,235,0.28)]",
        destructive:
          "bg-destructive px-6 py-3 text-destructive-foreground shadow-[var(--shadow-sm)] hover:scale-[1.02] hover:bg-destructive/90",
        outline:
          "border border-input bg-background px-6 py-3 text-foreground shadow-none hover:scale-[1.02] hover:bg-background-secondary hover:shadow-[var(--shadow-sm)]",
        secondary:
          "border border-border bg-background-secondary px-6 py-3 text-foreground shadow-none hover:scale-[1.02] hover:bg-background-tertiary",
        ghost: "text-muted-foreground hover:bg-background-secondary hover:text-foreground",
        link: "px-0 py-0 text-primary underline-offset-4 hover:text-primary-hover hover:underline",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2 text-xs",
        lg: "h-12 px-6 py-3 text-sm",
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
