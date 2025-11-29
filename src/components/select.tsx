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
                trigger: "rounded-2xl !bg-white/10 border border-white/30 hover:bg-white/15 data-[hover=true]:bg-white/15 backdrop-blur-sm shadow-lg transition-all duration-200",
                label: "text-gray-200 group-data-[filled=true]:text-gray-200",
                value: "text-white group-data-[has-value=true]:text-white ",
                selectorIcon: "text-gray-200",
                popoverContent: "bg-neutral-800 border-2 border-white/20",
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
                listboxProps={{
                    itemClasses: {
                        base: [
                            "data-[hover=true]:bg-white/15",
                            "data-[hovered=true]:bg-white/15",
                            "hover:bg-white/15",
                            "data-[focus=true]:bg-white/15",
                            "data-[focused=true]:bg-white/15",
                            "data-[selected=true]:bg-white/15",
                            "data-[selectable=true]:focus:bg-white/15",
                            "transition-all",
                            "duration-200"
                        ].join(" "),
                        title: "text-white group-data-[selected=true]:text-white",
                        description: "text-gray-400",
                        selectedIcon: "text-success font-black"
                    }
                }}
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
