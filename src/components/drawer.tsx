import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    DrawerProps,
} from "@heroui/react";
import { forwardRef, ReactNode } from "react";

interface CustomDrawerProps extends Omit<DrawerProps, "classNames"> {
    variant?: "blur" | "default";
    children: ReactNode;
    classNames?: {
        wrapper?: string;
        base?: string;
        backdrop?: string;
        header?: string;
        body?: string;
        footer?: string;
        closeButton?: string;
    };
}

interface CustomDrawerContentProps {
    children: ReactNode | ((onClose: () => void) => ReactNode);
    className?: string;
}

interface CustomDrawerHeaderProps {
    children: ReactNode;
    className?: string;
}

interface CustomDrawerBodyProps {
    children: ReactNode;
    className?: string;
}

interface CustomDrawerFooterProps {
    children: ReactNode;
    className?: string;
}

const CustomDrawer = forwardRef<HTMLDivElement, CustomDrawerProps>(
    ({ variant = "blur", classNames, children, placement = "right", size = "lg", ...props }, ref) => {
        const variantClasses = {
            blur: {
                wrapper: "",
                base: "bg-linear-205 from-slate-700  to-neutral-800 to-35% border-l-2 border-white/20 shadow-2xl rounded-none sm:rounded-s-3xl transition-all duration-200",
                backdrop: "",
                header: "border-b border-white/20 text-white",
                body: "py-4",
                footer: "justify-start border-t border-white/20",
                closeButton: "text-white hover:bg-white/20 active:bg-white/30",
            },
            default: {
                wrapper: "",
                base: "bg-white dark:bg-neutral-900",
                backdrop: "bg-black/50",
                header: "border-b border-gray-200 dark:border-white/20",
                body: "py-4",
                footer: "border-t border-gray-200 dark:border-white/20",
                closeButton: "text-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-white/20",
            },
        };

        const combinedClassNames = {
            wrapper: `${variantClasses[variant].wrapper} ${classNames?.wrapper || ""}`,
            base: `${variantClasses[variant].base} ${classNames?.base || ""}`,
            backdrop: `${variantClasses[variant].backdrop} ${classNames?.backdrop || ""}`,
            header: `${variantClasses[variant].header} ${classNames?.header || ""}`,
            body: `${variantClasses[variant].body} ${classNames?.body || ""}`,
            footer: `${variantClasses[variant].footer} ${classNames?.footer || ""}`,
            closeButton: `${variantClasses[variant].closeButton} ${classNames?.closeButton || ""}`,
        };

        return (
            <Drawer
                ref={ref}
                classNames={combinedClassNames}
                placement={placement}
                size={size}
                hideCloseButton={true}
                {...props}
            >
                {children}
            </Drawer>
        );
    }
);

const CustomDrawerContent = ({ children, className = "", ...props }: CustomDrawerContentProps) => {
    return (
        <DrawerContent className={className} {...props}>
            {children}
        </DrawerContent>
    );
};

const CustomDrawerHeader = ({ children, className = "", ...props }: CustomDrawerHeaderProps) => {
    return (
        <DrawerHeader className={`flex flex-col gap-1 text-white ${className}`} {...props}>
            {children}
        </DrawerHeader>
    );
};

const CustomDrawerBody = ({ children, className = "", ...props }: CustomDrawerBodyProps) => {
    return (
        <DrawerBody className={`px-6 py-4 overflow-y-auto ${className}`} {...props}>
            {children}
        </DrawerBody>
    );
};

const CustomDrawerFooter = ({ children, className = "", ...props }: CustomDrawerFooterProps) => {
    return (
        <DrawerFooter className={className} {...props}>
            {children}
        </DrawerFooter>
    );
};

CustomDrawer.displayName = "CustomDrawer";
CustomDrawerContent.displayName = "CustomDrawerContent";
CustomDrawerHeader.displayName = "CustomDrawerHeader";
CustomDrawerBody.displayName = "CustomDrawerBody";
CustomDrawerFooter.displayName = "CustomDrawerFooter";

export {
    CustomDrawer,
    CustomDrawerContent,
    CustomDrawerHeader,
    CustomDrawerBody,
    CustomDrawerFooter,
};

export type {
    CustomDrawerProps,
    CustomDrawerContentProps,
    CustomDrawerHeaderProps,
    CustomDrawerBodyProps,
    CustomDrawerFooterProps,
};
