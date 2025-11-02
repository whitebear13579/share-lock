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
    ({ variant = "blur", classNames, children, backdrop = "blur", placement = "center", ...props }, ref) => {
        const variantClasses = {
            blur: {
                wrapper: "",
                base: "bg-zinc-800/65 backdrop-blur-xs border-2 border-white/20 shadow-2xl transition-all",
                backdrop: "bg-black/40 backdrop-blur-xs",
                header: "border-white/20 bg-transparent text-center tracking-wider text-2xl font-semibold flex flex-col",
                body: "bg-transparent flex flex-col gap-6",
                footer: "border-white/20 bg-transparent",
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
                hideCloseButton={true}
                placement={placement}
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
