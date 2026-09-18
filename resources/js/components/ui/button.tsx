import * as React from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-display font-bold whitespace-nowrap outline-none transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-[3px_10px_0_#9c4913] hover:bg-primary-dark",
        outline:
          "border-2 border-slate-200 bg-white text-slate-600 shadow-[3px_10px_0_#e2e8f0] hover:border-slate-300 hover:text-slate-700",
        explorer:
          "bg-explorer text-white shadow-[3px_10px_0_#3a995d] hover:bg-green-600",
        ghost: "text-slate-600 hover:bg-orange-50 hover:text-primary",
        close:
          "border-2 border-slate-200 bg-white text-slate-600 shadow-[3px_10px_0_#e2e8f0] hover:border-slate-300 hover:text-slate-700",
      },
      size: {
        default: "px-7 py-[18px] text-base",
        sm: "px-4 py-2.5 text-sm",
        lg: "px-8 py-5 text-lg",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

type BaseButtonProps = React.ComponentProps<typeof BaseButton>;

interface ButtonProps
  extends Omit<BaseButtonProps, "className">,
    VariantProps<typeof buttonVariants> {
  className?: string;
  href?: string;
}

export function Button({
  variant = "primary",
  size = "default",
  className,
  href,
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      nativeButton={href ? false : undefined}
      render={href ? <a href={href} /> : undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
