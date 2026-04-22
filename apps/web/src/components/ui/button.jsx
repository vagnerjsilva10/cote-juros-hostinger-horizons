import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-[15px] font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 motion-reduce:transform-none",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-[#6D5EF3] px-5 py-3 text-white shadow-[0_6px_18px_rgba(109,94,243,0.25)] hover:-translate-y-[1px] hover:bg-[#5B4FE0] hover:text-white hover:shadow-[0_10px_24px_rgba(109,94,243,0.35)] active:translate-y-0",
        brand:
          "border border-transparent bg-[linear-gradient(90deg,#0F172A_0%,#1E293B_100%)] px-6 py-3 text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] hover:-translate-y-[1px] hover:brightness-[1.04] hover:shadow-[0_16px_34px_rgba(15,23,42,0.24)]",
        destructive:
          "bg-destructive px-6 py-3 text-destructive-foreground shadow-[var(--shadow-sm)] hover:-translate-y-[1px] hover:bg-destructive/90",
        outline:
          "border border-[#E5E7EB] bg-white px-5 py-3 text-[#0F172A] shadow-none hover:-translate-y-[1px] hover:border-[#D8DCE5] hover:bg-white hover:text-[#0F172A]",
        secondary:
          "border border-border bg-background-secondary px-6 py-3 text-foreground shadow-[0_6px_16px_rgba(15,23,42,0.03)] hover:-translate-y-[1px] hover:bg-background-tertiary hover:shadow-[0_10px_22px_rgba(15,23,42,0.06)]",
        ghost: "text-muted-foreground hover:bg-background-secondary hover:text-foreground",
        link: "px-0 py-0 text-primary underline-offset-4 hover:text-primary-hover hover:underline",
      },
      size: {
        default: "h-auto px-5 py-3",
        sm: "h-10 px-4 py-2 text-xs",
        lg: "h-auto px-5 py-3 text-[15px]",
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
