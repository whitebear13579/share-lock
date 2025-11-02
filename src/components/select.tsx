import { Select, SelectItem } from "@heroui/react";
import type { SelectProps, SelectItemProps } from "@heroui/react";
import React from "react";

type CustomSelectProps = Omit<SelectProps, "classNames" | "variant"> & {
    variant?: "blur";
    classNames?: Partial<SelectProps["classNames"]>;
};

const CustomSelect = React.forwardRef<HTMLSelectElement, CustomSelectProps>(
    (props, ref) => {
        const { variant = "blur", classNames, ...restProps } = props;

        const variantStyles = {
            blur: {
                trigger: "bg-white/10 border border-white/30 hover:bg-white/15 data-[hover=true]:bg-white/15 backdrop-blur-sm shadow-lg transition-all duration-200",
                label: "text-gray-200 group-data-[filled=true]:text-gray-200",
                value: "text-white group-data-[has-value=true]:text-white",
                selectorIcon: "text-gray-200",
                popoverContent: "bg-zinc-800/95 backdrop-blur-md border border-white/20 shadow-2xl",
                listboxWrapper: "max-h-[400px]",
                description: "text-gray-300",
                errorMessage: "text-red-400",
            },
        };

        const styles = variantStyles[variant];

        const mergedClassNames = {
            ...styles,
            ...classNames,
        };

        return (
            <Select
                ref={ref}
                classNames={mergedClassNames}
                {...restProps}
            />
        );
    }
);

CustomSelect.displayName = "CustomSelect";

const CustomSelectItem = SelectItem;

export { CustomSelect, CustomSelectItem };
export type { CustomSelectProps, SelectItemProps as CustomSelectItemProps };
