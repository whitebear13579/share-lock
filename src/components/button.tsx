import { Button, ButtonProps } from "@heroui/button";
import { forwardRef } from "react";

interface CustomButtonProps extends Omit<ButtonProps, "variant"> {
    variant?: "blur";
}

const CustomButton = forwardRef<HTMLButtonElement, CustomButtonProps>(
({ variant = "blur", className, children, size = "lg", ...props }, ref) => {
    const variantClasses = {
      blur: "relative flex items-center font-medium gap-2 bg-white/10 border border-white/30 transition-all duration-200 shadow-2xl text-base px-4 !active:scale-100",
    };

    return (
      <Button
        ref={ref}
        size={size}
        className={`${variantClasses[variant]} ${className || ""}`}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

CustomButton.displayName = "Button Components";

export default CustomButton;