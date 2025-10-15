import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalProps,
} from "@heroui/react";
import { forwardRef, ReactNode } from "react";

interface CustomModalProps extends Omit<ModalProps, "classNames"> {
    variant?: "blur";
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

interface CustomModalContentProps {
    children: ReactNode | ((onClose: () => void) => ReactNode);
    className?: string;
}

interface CustomModalHeaderProps {
    children: ReactNode;
    className?: string;
}

interface CustomModalBodyProps {
    children: ReactNode;
    className?: string;
}

interface CustomModalFooterProps {
    children: ReactNode;
    className?: string;
}

const CustomModal = forwardRef<HTMLDivElement, CustomModalProps>(
    ({ variant = "blur", classNames, children, backdrop = "blur", ...props }, ref) => {
        const variantClasses = {
            blur: {
                wrapper: "",
                base: "bg-neutral-800/60 backdrop-blur-xl border border-white/30 shadow-2xl",
                backdrop: "bg-black/50 backdrop-blur-sm",
                header: "border-b border-white/20 bg-transparent",
                body: "bg-transparent",
                footer: "border-t border-white/20 bg-transparent",
                closeButton: "text-white hover:bg-white/20 active:bg-white/30",
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
            <Modal
                ref={ref}
                backdrop={backdrop}
                classNames={combinedClassNames}
                {...props}
            >
                {children}
            </Modal>
        );
    }
);

const CustomModalContent = ({ children, className = "", ...props }: CustomModalContentProps) => {
    return (
        <ModalContent className={className} {...props}>
            {children}
        </ModalContent>
    );
};

const CustomModalHeader = ({ children, className = "", ...props }: CustomModalHeaderProps) => {
    return (
        <ModalHeader className={`text-white ${className}`} {...props}>
            {children}
        </ModalHeader>
    );
};

const CustomModalBody = ({ children, className = "", ...props }: CustomModalBodyProps) => {
    return (
        <ModalBody className={`text-gray-200 ${className}`} {...props}>
            {children}
        </ModalBody>
    );
};

const CustomModalFooter = ({ children, className = "", ...props }: CustomModalFooterProps) => {
    return (
        <ModalFooter className={className} {...props}>
            {children}
        </ModalFooter>
    );
};

CustomModal.displayName = "CustomModal";
CustomModalContent.displayName = "CustomModalContent";
CustomModalHeader.displayName = "CustomModalHeader";
CustomModalBody.displayName = "CustomModalBody";
CustomModalFooter.displayName = "CustomModalFooter";

export {
    CustomModal,
    CustomModalContent,
    CustomModalHeader,
    CustomModalBody,
    CustomModalFooter,
};

export type {
    CustomModalProps,
    CustomModalContentProps,
    CustomModalHeaderProps,
    CustomModalBodyProps,
    CustomModalFooterProps,
};
