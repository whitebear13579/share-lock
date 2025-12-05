import { Input, InputProps } from "@heroui/input";
import { forwardRef, useState } from "react";

interface CustomInputProps extends Omit<InputProps, "variant"> {
    variant?: "blur";
    isInvalid?: boolean;
    errorMessage?: string;
}

const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
    (
        {
            variant = "blur",
            className,
            children,
            size = "lg",
            value,
            defaultValue,
            onChange,
            isInvalid,
            errorMessage,
            ...props
        },
        ref
    ) => {
        const isControlled = value !== undefined;
        const [internalValue, setInternalValue] = useState(defaultValue || "");
        const [isFocused, setIsFocused] = useState(false);

        const currentValue = isControlled ? value : internalValue;
        const hasValue = currentValue !== "";

        const shouldShowSmallLabel = hasValue || isFocused;
        const variantClasses = {
            blur: {
                label: [
                    "!text-gray-200",
                    "px-4",
                    "transition-all",
                    "duration-200",
                    "transform",
                    "origin-left",
                    "tracking-wider",
                    ...(shouldShowSmallLabel
                        ? ["!text-xs", "!font-thin", "!-translate-y-3"]
                        : ["!text-lg"]),
                ],
                input: [
                    "text-gray-200",
                    "text-base",
                    "tracking-wider",
                    "!text-white",
                    "px-4",
                    "placeholder:text-gray-400",
                    "transition-all",
                    "duration-200",
                ],
                innerWrapper: ["bg-transparent", "placeholder:text-gray-200"],
                inputWrapper: isInvalid
                    ? [
                        "hover:!bg-red-500/40",
                        "focus-within:!bg-red-500/40",
                        "data-[hover=true]:!bg-red-500/40",
                        "!bg-red-500/20",
                        "!border-2",
                        "!border-red-500/60",
                    ]
                    : [
                        "bg-white/10",
                        "border",
                        "border-white/30",
                        "hover:!bg-white/20",
                        "data-[hover=true]:!bg-white/20",
                        "focus-within:!bg-white/20",
                        "transition-all",
                        "duration-200",
                        "shadow-2xl",
                        "group",
                    ],
                errorMessage: [
                    "px-2",
                    "text-xs",
                    "text-red-500",
                    "font-semibold",
                    "italic",
                    "",
                ],
            },
        };

        return (
            <Input
                ref={ref}
                size={size}
                radius="full"
                classNames={variantClasses[variant]}
                className={
                    shouldShowSmallLabel
                        ? "[&_label]:!text-xs [&_label]:!font-thin [&_label]:!-translate-y-3 [&_label]:!scale-90"
                        : "[&_label]:!text-lg"
                }
                value={value}
                defaultValue={defaultValue}
                isInvalid={isInvalid}
                errorMessage={errorMessage}
                onChange={(e) => {
                    // 只在非受控模式時更新內部 state
                    if (!isControlled) {
                        setInternalValue(e.target.value);
                    }
                    onChange?.(e);
                }}
                onFocus={(e) => {
                    setIsFocused(true);
                    props.onFocus?.(e);
                }}
                onBlur={(e) => {
                    setIsFocused(false);
                    props.onBlur?.(e);
                }}
                {...props}
            >
                {children}
            </Input>
        );
    }
);

CustomInput.displayName = "Button Components";

export default CustomInput;
