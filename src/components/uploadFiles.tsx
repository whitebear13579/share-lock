"use client";
import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { useAuth } from "@/utils/authProvider";
import { db, storage } from "@/utils/firebase";
import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    UploadTaskSnapshot,
} from "firebase/storage";
import {
    collection,
    doc,
    setDoc,
    getDoc,
    Timestamp,
    writeBatch,
} from "firebase/firestore";
import {
    CustomModal,
    CustomModalContent,
    CustomModalHeader,
    CustomModalBody,
    CustomModalFooter,
} from "@/components/modal";
import CustomButton from "@/components/button";
import CustomInput from "@/components/input";
import { CustomSelect, CustomSelectItem } from "@/components/select";
import {
    CircularProgress,
    Chip,
    DatePicker,
    NumberInput,
    Button,
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import gsap from "gsap";
import { ArrowUpFromLine, Check, CircleAlert, Copy, Link, Plus, Trash } from "lucide-react";

type Step = "select" | "uploading" | "settings";
type ShareMode = "device" | "account" | "pin" | "public";

interface FileWithId extends File {
    id: string;
}

interface UploadProgress {
    [fileId: string]: number;
}

interface ShareSettings {
    displayName: string;
    expiresAt: Date;
    maxDownloads: number;
    shareMode: ShareMode;
    pin?: string;
    recipients: string[];
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (shareId: string, shareUrl: string) => void;
}

const STORAGE_QUOTA_BYTES = 1024 * 1024 * 1024; // 1GB
const MAX_DAYS = 14;
const MAX_RECIPIENTS = 10;

// debug
const DEBUG_MODE = {
    SHOW_UPLOADING: false,
    SHOW_SETTINGS: false,
    SHOW_SHARE_URL: false,     // also need SHOW_SETTINGS to be true
    SHOW_ERROR: false,          // show error message for testing animation
    ERROR_MESSAGE: "test debug msg",
};

// Truncate string to show first and last parts with "..." in the middle
const truncateString = (str: string, maxLength: number = 35): string => {
    if (str.length <= maxLength) return str;

    const ellipsis = "...";
    const charsToShow = maxLength - ellipsis.length;
    const frontChars = Math.ceil(charsToShow / 2);
    const backChars = Math.floor(charsToShow / 2);

    return str.substring(0, frontChars) + ellipsis + str.substring(str.length - backChars);
};

export default function UploadFiles({ isOpen, onClose, onSuccess }: Props) {
    const { user } = useAuth();
    const [step, setStep] = useState<Step>(
        DEBUG_MODE.SHOW_UPLOADING ? "uploading" :
            DEBUG_MODE.SHOW_SETTINGS ? "settings" :
                "select"
    );
    const [files, setFiles] = useState<FileWithId[]>(
        DEBUG_MODE.SHOW_UPLOADING || DEBUG_MODE.SHOW_SETTINGS
            ? [{
                id: "debug-file-1",
                name: "測試檔案.pdf",
                size: 1024 * 1024 * 5, // 5MB
                type: "application/pdf",
                lastModified: Date.now(),
            } as FileWithId]
            : []
    );
    const [uploadProgress, setUploadProgress] = useState<UploadProgress>(
        DEBUG_MODE.SHOW_UPLOADING ? { "debug-file-1": 65 } : {}
    );
    const [error, setError] = useState(
        DEBUG_MODE.SHOW_ERROR ? DEBUG_MODE.ERROR_MESSAGE : ""
    );
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFileId, setUploadedFileId] = useState("");
    const [uploadedShareId, setUploadedShareId] = useState(
        DEBUG_MODE.SHOW_SHARE_URL ? "abcd1234" : ""
    );
    const [shareSettings, setShareSettings] = useState<ShareSettings>({
        displayName: "",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxDownloads: 10,
        shareMode: "public",
        pin: "",
        recipients: [],
    });
    const [recipientInput, setRecipientInput] = useState("");
    const [generatedPin, setGeneratedPin] = useState(
        DEBUG_MODE.SHOW_SETTINGS ? "123456" : ""
    );
    const [shareUrl, setShareUrl] = useState(
        DEBUG_MODE.SHOW_SHARE_URL ? "sharelock.eu.org/share/abcd1234" : ""
    );
    const [isCreatingShare, setIsCreatingShare] = useState(false);
    const [maxDownloadsError, setMaxDownloadsError] = useState("");
    const [expiresAtError, setExpiresAtError] = useState("");
    const [recipientEmailError, setRecipientEmailError] = useState("");
    const [showCopyPopover, setShowCopyPopover] = useState(false);
    const [showUrlCopyPopover, setShowUrlCopyPopover] = useState(false);
    const [showIdCopyPopover, setShowIdCopyPopover] = useState(false);
    const [showPinCopyPopover, setShowPinCopyPopover] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const dropZoneContainerRef = useRef<HTMLDivElement>(null);
    const fileListContainerRef = useRef<HTMLDivElement>(null);
    const errorBoxRef = useRef<HTMLDivElement>(null);
    const pinBoxRef = useRef<HTMLDivElement>(null);
    const chipRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const progressValueRef = useRef<HTMLDivElement>(null);
    const [displayProgress, setDisplayProgress] = useState(0);
    const lastProgressRef = useRef(0);

    const resetState = () => {
        setStep("select");
        setFiles([]);
        setUploadProgress({});
        setError("");
        setIsUploading(false);
        setUploadedFileId("");
        setUploadedShareId("");
        setShareSettings({
            displayName: "",
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            maxDownloads: 10,
            shareMode: "public",
            pin: "",
            recipients: [],
        });
        setRecipientInput("");
        setGeneratedPin("");
        setShareUrl("");
        setIsCreatingShare(false);
        setDisplayProgress(0);
        lastProgressRef.current = 0;
    };

    const checkUserQuota = async (
        requiredBytes: number
    ): Promise<boolean> => {
        if (!user) return false;

        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const usedBytes = userDoc.data()?.storageQuotaUsed || 0;
            const available = STORAGE_QUOTA_BYTES - usedBytes;

            if (requiredBytes > available) {
                setError(
                    `您的可用儲存空間不足`
                );
                return false;
            }
            return true;
        } catch (err) {
            console.error("check user quota failed:", err);
            setError("無法檢查您的剩餘空間，請稍後再試");
            return false;
        }
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    };

    const handleFileSelect = (selectedFiles: FileList | null) => {
        if (!selectedFiles || selectedFiles.length === 0) return;
        if (!user) {
            setError("請先登入才能上傳檔案");
            return;
        }

        const filesArray = Array.from(selectedFiles).map((file) => {
            const fileWithId = file as FileWithId;
            fileWithId.id = `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 11)}`;
            return fileWithId;
        });

        // Animate out the drop zone
        if (dropZoneContainerRef.current) {
            gsap.to(dropZoneContainerRef.current, {
                opacity: 0,
                scale: 0.95,
                duration: 0.2,
                ease: "power2.in",
                onComplete: () => {
                    setFiles(filesArray);
                    setError("");
                }
            });
        } else {
            setFiles(filesArray);
            setError("");
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (dropZoneRef.current) {
            dropZoneRef.current.classList.add("border-emerald-500", "bg-emerald-500/10");
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (dropZoneRef.current) {
            dropZoneRef.current.classList.remove("border-emerald-500", "bg-emerald-500/10");
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (dropZoneRef.current) {
            dropZoneRef.current.classList.remove("border-emerald-500", "bg-emerald-500/10");
        }
        handleFileSelect(e.dataTransfer.files);
    };

    const handleUpload = async () => {
        if (!user || files.length === 0) return;

        const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
        const canUpload = await checkUserQuota(totalBytes);
        if (!canUpload) return;

        setIsUploading(true);
        setStep("uploading");
        setError("");

        try {
            const file = files[0];
            const storagePath = `user_uploads/${user.uid}/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, storagePath);

            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                "state_changed",
                (snapshot: UploadTaskSnapshot) => {
                    const progress =
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress((prev) => ({
                        ...prev,
                        [file.id]: progress,
                    }));
                },
                (error) => {
                    console.error("upload failed:", error);
                    setError("檔案上傳失敗，請重試");
                    setIsUploading(false);
                },
                async () => {
                    // create firestore related file metadata
                    const downloadURL = await getDownloadURL(
                        uploadTask.snapshot.ref
                    );
                    const fileId = doc(collection(db, "files")).id;

                    await setDoc(doc(db, "files", fileId), {
                        ownerUid: user.uid,
                        originalName: file.name,
                        displayName: file.name,
                        size: file.size,
                        contentType: file.type,
                        storagePath,
                        downloadURL,
                        createdAt: Timestamp.now(),
                        expiresAt: Timestamp.fromDate(
                            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                        ),
                        maxDownloads: 10,
                        remainingDownloads: 10,
                        shareMode: "public",
                        revoked: false,
                        allowedDevices: [],
                    });

                    setUploadedFileId(fileId);
                    setShareSettings((prev) => ({
                        ...prev,
                        displayName: file.name,
                    }));
                    setIsUploading(false);
                    setStep("settings");
                }
            );
        } catch (err) {
            console.error("file processing failed:", err);
            setError("處理檔案時發生錯誤，請重試");
            setIsUploading(false);
        }
    };

    const generatePin = () => {
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedPin(pin);
        setShareSettings((prev) => ({ ...prev, pin }));
    };

    const addRecipient = () => {
        const email = recipientInput.trim();
        if (!email) {
            setRecipientEmailError("請輸入電子郵件");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setRecipientEmailError("電子郵件格式不正確");
            return;
        }

        if (shareSettings.recipients.includes(email)) {
            setRecipientEmailError("此 Email 已新增");
            return;
        }

        if (shareSettings.recipients.length >= MAX_RECIPIENTS) {
            setRecipientEmailError(`最多只能新增 ${MAX_RECIPIENTS} 位收件者`);
            return;
        }

        setShareSettings((prev) => ({
            ...prev,
            recipients: [...prev.recipients, email],
        }));
        setRecipientInput("");
        setRecipientEmailError("");
    };

    const removeRecipient = (email: string) => {
        const chipElement = chipRefs.current.get(email);
        if (chipElement) {
            gsap.to(chipElement, {
                opacity: 0,
                scale: 0.8,
                duration: 0.2,
                ease: "power2.in",
                onComplete: () => {
                    chipRefs.current.delete(email);
                    setShareSettings((prev) => ({
                        ...prev,
                        recipients: prev.recipients.filter((e) => e !== email),
                    }));
                }
            });
        } else {
            setShareSettings((prev) => ({
                ...prev,
                recipients: prev.recipients.filter((e) => e !== email),
            }));
        }
    };

    // create share link
    const handleCreateShare = async () => {
        if (!user || !uploadedFileId) return;

        // Clear previous errors
        setMaxDownloadsError("");
        setExpiresAtError("");

        if (!shareSettings.displayName.trim()) {
            setError("請輸入檔案名稱");
            return;
        }

        if (shareSettings.maxDownloads < 1) {
            setMaxDownloadsError("下載次數至少為 1");
            return;
        }

        if (shareSettings.maxDownloads > 999) {
            setMaxDownloadsError("下載次數最多為 999");
            return;
        }

        const daysDiff = Math.ceil(
            (shareSettings.expiresAt.getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        );
        if (daysDiff > MAX_DAYS) {
            setExpiresAtError(`到期日最多為 ${MAX_DAYS} 天`);
            return;
        }
        if (daysDiff < 1) {
            setExpiresAtError("到期日必須為今天或之後");
            return;
        }

        if (shareSettings.shareMode === "pin" && !shareSettings.pin) {
            setError("請產生 PIN 碼");
            return;
        }

        setIsCreatingShare(true);
        setError("");

        try {
            const batch = writeBatch(db);

            const fileRef = doc(db, "files", uploadedFileId);
            batch.set(fileRef, {
                displayName: shareSettings.displayName,
                expiresAt: Timestamp.fromDate(shareSettings.expiresAt),
                maxDownloads: shareSettings.maxDownloads,
                remainingDownloads: shareSettings.maxDownloads,
                shareMode: shareSettings.shareMode,
                ...(shareSettings.shareMode === "pin" && {
                    pinHash: await hashPin(shareSettings.pin!),
                }),
            }, { merge: true });

            const shareId = doc(collection(db, "shares")).id;
            const shareRef = doc(db, "shares", shareId);
            batch.set(shareRef, {
                fileId: uploadedFileId,
                ownerUid: user.uid,
                createdAt: Timestamp.now(),
                valid: true,
                shareMode: shareSettings.shareMode,
                ...(shareSettings.shareMode === "pin" && {
                    pinHash: await hashPin(shareSettings.pin!),
                }),
            });

            // create notification (if have recipients)
            for (const email of shareSettings.recipients) {
                const notifRef = doc(collection(db, "notifications"));
                batch.set(notifRef, {
                    type: "share-invite",
                    toEmail: email,
                    shareId,
                    fileId: uploadedFileId,
                    createdAt: Timestamp.now(),
                    delivered: false,
                });
            }

            await batch.commit();

            const url = `${window.location.origin}/share/${shareId}`;
            setShareUrl(url);
            setUploadedShareId(shareId);

            // Don't call onSuccess here - let user see the share URL first
            // onSuccess will be called when user clicks "完成" button
        } catch (err) {
            console.error("Create share URL error:", err);
            setError("建立分享失敗，請重試");
        } finally {
            setIsCreatingShare(false);
        }
    };

    // hashed pin
    const hashPin = async (pin: string): Promise<string> => {
        const encoder = new TextEncoder();
        const data = encoder.encode(pin);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    };

    const copyToClipboard = async (text: string) => {
        try {
            // Check if Clipboard API is available
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for older browsers or non-secure contexts
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();

                try {
                    document.execCommand('copy');
                } finally {
                    document.body.removeChild(textArea);
                }
            }

            setShowCopyPopover(true);
            setTimeout(() => {
                setShowCopyPopover(false);
            }, 2000);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            setError('複製失敗，請手動複製');
        }
    };

    const handleClose = () => {
        // Call onSuccess if share was created successfully
        if (shareUrl && uploadedShareId && onSuccess) {
            onSuccess(uploadedShareId, shareUrl);
        }
        resetState();
        onClose();
    };

    const animateProgressChange = useCallback((newValue: number) => {
        const rounded = Math.round(newValue);
        const valueRef = progressValueRef.current;

        if (valueRef && rounded !== displayProgress) {
            const tl = gsap.timeline();

            tl.to(valueRef, {
                y: -12,
                opacity: 0,
                duration: 0.1,
                ease: "power2.in",
            })
                .call(() => setDisplayProgress(rounded))
                .set(valueRef, { y: 12 })
                .to(valueRef, {
                    y: 0,
                    opacity: 1,
                    duration: 0.12,
                    ease: "power2.out",
                });
        } else {
            setDisplayProgress(rounded);
        }
    }, [displayProgress]);

    useEffect(() => {
        const currentProgress = Math.round(uploadProgress[files[0]?.id] || 0);

        if (currentProgress !== lastProgressRef.current) {
            animateProgressChange(currentProgress);
            lastProgressRef.current = currentProgress;
        }
    }, [uploadProgress, files, animateProgressChange]);

    useEffect(() => {
        if (shareSettings.shareMode === "pin" && !generatedPin) {
            generatePin();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shareSettings.shareMode]);

    // animation setup
    useEffect(() => {
        if (modalRef.current && isOpen) {
            const modalContent = modalRef.current.querySelector('[role="dialog"]');
            if (modalContent) {
                gsap.fromTo(
                    modalContent,
                    { opacity: 0, scale: 0.9 },
                    { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.4)" }
                );
            }
        }

        // Initialize error box state when modal opens
        if (isOpen && errorBoxRef.current) {
            if (error) {
                // If there's an error, ensure it starts hidden and will animate in
                gsap.set(errorBoxRef.current, {
                    scale: 0.8,
                    opacity: 0,
                    height: 0,
                    display: "flex",
                });
            } else {
                // If no error, ensure it's hidden
                gsap.set(errorBoxRef.current, {
                    opacity: 0,
                    height: 0,
                    display: "none",
                });
            }
        }
    }, [isOpen, step, error]);

    useEffect(() => {
        if (files.length > 0 && fileListContainerRef.current && step === "select") {
            gsap.fromTo(
                fileListContainerRef.current,
                { opacity: 0, y: 20, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power2.out", delay: 0.1 }
            );
        }
    }, [files.length, step]);

    // Animate drop zone when it appears
    useEffect(() => {
        if (files.length === 0 && dropZoneContainerRef.current && step === "select") {
            gsap.fromTo(
                dropZoneContainerRef.current,
                { opacity: 0, scale: 0.95 },
                { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
            );
        }
    }, [files.length, step]);

    // Animate PIN box when it appears
    useEffect(() => {
        if (shareSettings.shareMode === "pin" && generatedPin && pinBoxRef.current && step === "settings") {
            gsap.fromTo(
                pinBoxRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.3, ease: "power2.out", delay: 0.1 }
            );
        }
    }, [shareSettings.shareMode, generatedPin, step]);

    // Error box animation
    const animateErrorBox = () => {
        if (!errorBoxRef.current) return;

        const currentOpacity = gsap.getProperty(errorBoxRef.current, "opacity") as number;
        const isCurrentlyVisible = currentOpacity > 0;

        if (isCurrentlyVisible) {
            // Re-animate if already visible (content changed)
            gsap.killTweensOf(errorBoxRef.current);

            const tl = gsap.timeline();
            tl.to(errorBoxRef.current, {
                scale: 0.8,
                duration: 0.1,
                ease: "power2.in",
            }).to(errorBoxRef.current, {
                scale: 1.1,
                duration: 0.2,
                ease: "power2.out",
            }).to(errorBoxRef.current, {
                scale: 1,
                duration: 0.3,
                ease: "back.out(1.7)",
            });
        } else {
            // Initial appearance
            gsap.killTweensOf(errorBoxRef.current);

            gsap.set(errorBoxRef.current, {
                scale: 0.8,
                opacity: 0,
                height: 0,
                display: "flex",
            });

            const tl = gsap.timeline();

            tl.to(errorBoxRef.current, {
                height: "auto",
                duration: 0.2,
                ease: "power2.out",
            }).to(
                errorBoxRef.current,
                {
                    scale: 1,
                    opacity: 1,
                    duration: 0.3,
                    ease: "back.out(1.4)",
                },
                "-=0.1"
            );
        }
    };

    const hideErrorBox = () => {
        if (!errorBoxRef.current) return;

        gsap.killTweensOf(errorBoxRef.current);

        const tl = gsap.timeline();

        tl.to(errorBoxRef.current, {
            scale: 0.8,
            opacity: 0,
            duration: 0.2,
            ease: "power2.in",
        }).to(
            errorBoxRef.current,
            {
                height: 0,
                duration: 0.2,
                ease: "power2.in",
                onComplete: () => {
                    if (errorBoxRef.current) {
                        gsap.set(errorBoxRef.current, { display: "none" });
                    }
                }
            },
            "-=0.1"
        );
    };

    useEffect(() => {
        // Only animate if modal is open
        if (!isOpen) return;

        if (error && errorBoxRef.current) {
            // Small delay to ensure DOM is ready after modal opens
            const timer = setTimeout(() => {
                animateErrorBox();
            }, 50);
            return () => clearTimeout(timer);
        } else if (!error && errorBoxRef.current) {
            hideErrorBox();
        }
    }, [error, isOpen]);

    // Track previous height for animation
    const prevHeightRef = useRef<number | null>(null);
    const isAnimatingRef = useRef(false);

    useLayoutEffect(() => {
        if (!isOpen || isAnimatingRef.current) return;

        const dialogElement = document.querySelector('[role="dialog"]') as HTMLElement;
        if (dialogElement && prevHeightRef.current === null) {
            prevHeightRef.current = dialogElement.getBoundingClientRect().height;
        }
    });

    useLayoutEffect(() => {
        if (!isOpen) {
            prevHeightRef.current = null;
            return;
        }

        const dialogElement = document.querySelector('[role="dialog"]') as HTMLElement;
        if (!dialogElement) return;

        const currentHeight = dialogElement.getBoundingClientRect().height;

        if (prevHeightRef.current !== null && Math.abs(prevHeightRef.current - currentHeight) > 1) {
            const oldHeight = prevHeightRef.current;
            const newHeight = currentHeight;

            isAnimatingRef.current = true;

            dialogElement.style.height = `${oldHeight}px`;

            void dialogElement.offsetHeight;

            requestAnimationFrame(() => {
                dialogElement.style.height = `${newHeight}px`;

                setTimeout(() => {
                    dialogElement.style.height = 'auto';
                    prevHeightRef.current = newHeight;
                    isAnimatingRef.current = false;
                }, 400);
            });
        } else {
            prevHeightRef.current = currentHeight;
        }
    }, [files.length, step, shareUrl, error, isOpen, generatedPin, shareSettings.shareMode, shareSettings.recipients.length, recipientEmailError]);

    return (
        <CustomModal ref={modalRef} isOpen={isOpen} onOpenChange={handleClose} size="md">
            <CustomModalContent>
                {() => (
                    <>
                        <CustomModalHeader>
                            <div className="pt-4">
                                {step === "select" && "上傳檔案"}
                                {step === "uploading" && "檔案上傳中"}
                                {step === "settings" && (shareUrl ? "已建立分享連結" : "分享設定")}
                            </div>
                        </CustomModalHeader>

                        <CustomModalBody>
                            {/* error messages */}
                            {error && (
                                <div
                                    ref={errorBoxRef}
                                    className="p-1.5 bg-red-500/20 border-2 border-red-500/50 rounded-lg text-red-300 text-sm flex flex-row items-center justify-center gap-2"
                                >
                                    <CircleAlert size={18} />{error}
                                </div>
                            )}

                            {/* select files */}
                            {step === "select" && (
                                <div className="flex flex-col gap-4">
                                    {!user ? (
                                        <>
                                            <div className="p-1.5 bg-yellow-500/20 border-2 border-yellow-500/50 rounded-lg text-yellow-300 text-sm flex flex-row items-center justify-center gap-2 tracking-wider">
                                                <CircleAlert size={18} />請先登入
                                            </div>
                                            <div
                                                className="border-2 border-dashed border-white/30 rounded-lg p-12 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-500/5 transition-all duration-200 group"
                                            >
                                                <div className="flex justify-center mb-4">
                                                    <ArrowUpFromLine className="w-12 h-12 text-gray-300 group-hover:text-emerald-500 transition-all duration-200" />
                                                </div>
                                                <div className="text-gray-300 text-lg mb-2 group-hover:text-emerald-500 transition-all duration-200">
                                                    拖曳或點擊來上傳檔案
                                                </div>
                                                <div className="text-gray-400 text-sm">
                                                    單一檔案最大限制為 300MB
                                                </div>
                                            </div>
                                        </>
                                    ) : files.length === 0 ? (
                                        <div ref={dropZoneContainerRef}>
                                            <div
                                                ref={dropZoneRef}
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border-2 border-dashed border-white/30 rounded-lg p-12 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-500/5 transition-all duration-200 group"
                                            >
                                                <div className="flex justify-center mb-4">
                                                    <ArrowUpFromLine className="w-12 h-12 text-gray-300 group-hover:text-emerald-500 transition-all duration-200" />
                                                </div>
                                                <div className="text-gray-300 text-lg mb-2 group-hover:text-emerald-500 transition-all duration-200">
                                                    拖曳或點擊來上傳檔案
                                                </div>
                                                <div className="text-gray-400 text-sm">
                                                    單一檔案最大限制為 300MB
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div ref={fileListContainerRef} className="flex flex-col gap-2">
                                            {files.map((file) => (
                                                <div
                                                    key={file.id}
                                                    className="flex items-center justify-between p-3 bg-white/8 rounded-xl shadow-2xl"
                                                >
                                                    <div className="flex-1 space-y-1 pl-2">
                                                        <div className="text-white font-medium text-lg">
                                                            {file.name}
                                                        </div>
                                                        <div className="text-gray-400 text-sm">
                                                            {formatBytes(file.size)}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        isIconOnly
                                                        radius="full"
                                                        className="custom-button-trans-override bg-zinc-400/40 shadow-xl h-8 w-8 p-0 group"
                                                        onPress={() => {
                                                            if (fileListContainerRef.current) {
                                                                gsap.to(fileListContainerRef.current, {
                                                                    opacity: 0,
                                                                    scale: 0.95,
                                                                    duration: 0.2,
                                                                    ease: "power2.in",
                                                                    onComplete: () => setFiles([])
                                                                });
                                                            } else {
                                                                setFiles([]);
                                                            }
                                                        }}
                                                    >
                                                        <Trash size={16} className="text-neutral-900 cursor-pointer group-hover:text-rose-500 transition-all duration-200" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="*/*,image/*,video/*,audio/*,application/*,text/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z"
                                        className="hidden"
                                        onChange={(e) =>
                                            handleFileSelect(e.target.files)
                                        }
                                        aria-label="選擇檔案"
                                    />
                                </div>
                            )}
                            {/* file uploading */}
                            {step === "uploading" && (
                                <div className="flex flex-col items-center gap-6 py-8">
                                    <CircularProgress
                                        size="lg"
                                        value={Math.round(uploadProgress[files[0]?.id] || 0)}
                                        showValueLabel={true}
                                        aria-label="檔案上傳進度"
                                        classNames={{
                                            base: "w-32 h-32",
                                            svg: "w-32 h-32",
                                            indicator: "stroke-emerald-500",
                                            track: "stroke-white/20",
                                        }}
                                        strokeWidth={3}
                                        valueLabel={
                                            <div className="flex items-center justify-center w-full h-full">
                                                <div
                                                    ref={progressValueRef}
                                                    className="text-2xl font-semibold text-white tabular-nums"
                                                >
                                                    {Math.round(displayProgress)}%
                                                </div>
                                            </div>
                                        }
                                    />
                                </div>
                            )}

                            {/* share settings */}
                            {step === "settings" && !shareUrl && (
                                <div className="flex flex-col gap-4 space-y-1">
                                    <div className="custom-input-trans-animate" >
                                        <CustomInput
                                            label="檔案名稱"
                                            size="md"
                                            value={shareSettings.displayName}
                                            onChange={(e) =>
                                                setShareSettings((prev) => ({
                                                    ...prev,
                                                    displayName: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="custom-input-trans-animate flex-1 dark">
                                            <DatePicker
                                                label="設定到期日"
                                                radius="full"
                                                isRequired={true}
                                                // @ts-expect-error - HeroUI uses internal @internationalized/date version
                                                value={parseDate(shareSettings.expiresAt.toISOString().split("T")[0])}
                                                onChange={(date: unknown) => {
                                                    if (date && typeof date === 'object' && 'year' in date && 'month' in date && 'day' in date) {
                                                        const jsDate = new Date(
                                                            (date as { year: number; month: number; day: number }).year,
                                                            (date as { year: number; month: number; day: number }).month - 1,
                                                            (date as { year: number; month: number; day: number }).day
                                                        );

                                                        // Validate date immediately
                                                        const daysDiff = Math.ceil(
                                                            (jsDate.getTime() - Date.now()) /
                                                            (1000 * 60 * 60 * 24)
                                                        );

                                                        if (daysDiff > MAX_DAYS) {
                                                            setExpiresAtError(`*到期日最多為 ${MAX_DAYS} 天`);
                                                        } else if (daysDiff < 1) {
                                                            setExpiresAtError("*到期日必須為今天或之後");
                                                        } else {
                                                            setExpiresAtError("");
                                                        }

                                                        setShareSettings((prev) => ({
                                                            ...prev,
                                                            expiresAt: jsDate,
                                                        }));
                                                    }
                                                }}
                                                minValue={parseDate(new Date().toISOString().split("T")[0])}
                                                maxValue={parseDate(new Date(Date.now() + MAX_DAYS * 24 * 60 * 60 * 1000).toISOString().split("T")[0])}
                                                isInvalid={!!expiresAtError}
                                                errorMessage={expiresAtError}
                                                popoverProps={{
                                                    classNames: {
                                                        content: "dark",
                                                    },
                                                }}
                                                classNames={{
                                                    base: "",
                                                    label: "pl-4 !text-gray-200 !text-sm !scale-100",
                                                    inputWrapper: expiresAtError
                                                        ? "hover:!bg-red-500/40 focus-within:!bg-red-500/40 data-[hover=true]:!bg-red-500/40 !bg-red-500/20 !border-2 !border-red-500/60"
                                                        : "bg-white/10 border border-white/30 hover:!bg-white/20 data-[hover=true]:!bg-white/20 focus-within:hover:!bg-white/20",
                                                    innerWrapper: "!h-auto items-center",
                                                    selectorButton: "!absolute !right-3 !top-1/2 !-translate-y-1/2 pr-2",
                                                    input: "pl-4",
                                                    segment: "!text-white ",
                                                    errorMessage: "px-2 text-xs text-red-500 font-semibold italic",
                                                }}
                                            />
                                        </div>

                                        <div className="custom-input-trans-animate flex-1 ">
                                            <NumberInput
                                                label="設定下載次數"
                                                radius="full"
                                                isRequired={true}
                                                value={shareSettings.maxDownloads}
                                                onValueChange={(value) => {
                                                    setShareSettings((prev) => ({
                                                        ...prev,
                                                        maxDownloads: value || 1,
                                                    }));
                                                    // Clear error when user changes value
                                                    if (maxDownloadsError) {
                                                        setMaxDownloadsError("");
                                                    }
                                                }}
                                                minValue={1}
                                                maxValue={999}
                                                isInvalid={!!maxDownloadsError}
                                                errorMessage={maxDownloadsError ? `*${maxDownloadsError}` : ""}
                                                classNames={{
                                                    base: "",
                                                    label: "pl-3 !text-gray-200 !text-sm !scale-100 !-translate-y-[10px]",
                                                    input: "pl-3 !text-white !translate-y-[3px]",
                                                    inputWrapper: maxDownloadsError
                                                        ? "hover:!bg-red-500/40 focus-within:!bg-red-500/40 data-[hover=true]:!bg-red-500/40 !bg-red-500/20 !border-2 !border-red-500/60"
                                                        : "bg-white/10 border border-white/30 data-[hover=true]:bg-white/20 data-[focus=true]:bg-white/20",
                                                    stepperButton: "!text-white",
                                                    errorMessage: "px-2 text-xs text-red-500 font-semibold italic",
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <CustomSelect
                                        variant="blur"
                                        label="分享模式"
                                        selectedKeys={[shareSettings.shareMode]}
                                        className="custom-button-trans-override"
                                        onSelectionChange={(keys) => {
                                            const mode = Array.from(keys)[0] as ShareMode;
                                            setShareSettings((prev) => ({
                                                ...prev,
                                                shareMode: mode,
                                            }));
                                        }}
                                    >
                                        <CustomSelectItem key="public">
                                            未鎖定（任何人皆可存取）
                                        </CustomSelectItem>
                                        <CustomSelectItem key="pin">
                                            密碼鎖定（輸入 PIN 碼）
                                        </CustomSelectItem>
                                        <CustomSelectItem key="device">
                                            裝置綁定（首個綁定裝置）
                                        </CustomSelectItem>
                                        <CustomSelectItem key="account">
                                            帳號綁定（首個綁定帳號）
                                        </CustomSelectItem>
                                    </CustomSelect>

                                    {shareSettings.shareMode === "pin" && generatedPin && (
                                        <div ref={pinBoxRef} className="p-3 bg-blue-500/20 border-2 border-blue-500/50 rounded-2xl custom-button-trans-override flex items-center gap-3">
                                            <div className="flex-1">
                                                <div className="text-blue-300 text-sm mb-2 pl-1">
                                                    請妥善保存您的 PIN 碼：
                                                </div>
                                                <code className="text-xl font-mono text-white tracking-widest pl-1">
                                                    {generatedPin}
                                                </code>
                                            </div>
                                            <Popover
                                                isOpen={showCopyPopover}
                                                onOpenChange={setShowCopyPopover}
                                                placement="top"
                                                showArrow={true}
                                                offset={8}
                                                classNames={{
                                                    base: [
                                                        'before:bg-emerald-700',
                                                    ],
                                                    content: [
                                                        'bg-emerald-600 border-emerald-700',
                                                        "border-2",
                                                    ].join(" "),
                                                }}
                                            >
                                                <PopoverTrigger>
                                                    <div className="transition-all duration-200 pr-1 shadow-xl" >
                                                        <CustomButton
                                                            size="md"
                                                            onClick={() =>
                                                                copyToClipboard(generatedPin)
                                                            }
                                                            startContent={
                                                                <Copy size={18} className="flex-shrink-0" />
                                                            }
                                                            className="text-gray-300"
                                                            isIconOnly={true}
                                                        >
                                                        </CustomButton>
                                                    </div>
                                                </PopoverTrigger>
                                                <PopoverContent>
                                                    <div className="px-3 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <Check size={20} className="text-white" />
                                                            <span className="text-base text-white font-medium">已複製到剪貼簿！</span>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-2 -mt-1">
                                        <div className="text-gray-300 text-sm pl-2">
                                            收件者 Email（最多 {MAX_RECIPIENTS} 位）
                                        </div>
                                        <div className="flex gap-3">
                                            <CustomInput
                                                type="email"
                                                placeholder="example@email.com"
                                                size="lg"
                                                value={recipientInput}
                                                onChange={(e) => {
                                                    setRecipientInput(e.target.value);
                                                    if (recipientEmailError) {
                                                        setRecipientEmailError("");
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        addRecipient();
                                                    }
                                                }}
                                                isInvalid={!!recipientEmailError}
                                                errorMessage={recipientEmailError ? `*${recipientEmailError}` : ""}
                                                className="flex-1"
                                            />
                                            <CustomButton
                                                radius="full"
                                                className="text-gray-300"
                                                onClick={addRecipient}
                                                isDisabled={
                                                    shareSettings.recipients.length >=
                                                    MAX_RECIPIENTS
                                                }
                                                startContent={<Plus size={20} className="flex-shrink-0" />}
                                                isIconOnly={true}
                                            >
                                            </CustomButton>
                                        </div>

                                        {shareSettings.recipients.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2 space-y-1">
                                                {shareSettings.recipients.map((email) => (
                                                    <div
                                                        key={email}
                                                        ref={(el) => {
                                                            if (el) {
                                                                chipRefs.current.set(email, el);
                                                            }
                                                        }}
                                                    >
                                                        <Chip
                                                            onClose={() => removeRecipient(email)}
                                                            variant="solid"
                                                            color="primary"
                                                            classNames={{
                                                                base: "flex-row-reverse",
                                                            }}
                                                        >
                                                            {email}
                                                        </Chip>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* generate share link */}
                            {step === "settings" && shareUrl && (
                                <div className="flex flex-col gap-4 items-center py-4">
                                    <div className="w-full space-y-6 bg-white/8 rounded-2xl px-4 py-6 shadow-2xl">
                                        <div className="space-y-2 ">
                                            <div className="text-white text-lg tracking-wider">
                                                分享連結：
                                            </div>
                                            <div className="flex gap-2 items-center">
                                                <code className="flex-1 px-3 py-2 bg-white/10 border border-white/30 rounded-xl text-white text-sm tracking-tight h-10 flex items-center shadow-xl">
                                                    {truncateString(shareUrl.replace(/^https?:\/\//, ''), 35)}
                                                </code>
                                                <Popover
                                                    isOpen={showUrlCopyPopover}
                                                    onOpenChange={setShowUrlCopyPopover}
                                                    placement="top"
                                                    showArrow={true}
                                                    offset={8}
                                                    classNames={{
                                                        base: [
                                                            'before:bg-emerald-700',
                                                        ],
                                                        content: [
                                                            'bg-emerald-600 border-emerald-700',
                                                            "border-2",
                                                        ].join(" "),
                                                    }}
                                                >
                                                    <PopoverTrigger>
                                                        <div className="transition-all duration-200 shadow-xl">
                                                            <CustomButton
                                                                size="md"
                                                                onClick={() => {
                                                                    copyToClipboard(shareUrl);
                                                                    setShowUrlCopyPopover(true);
                                                                    setTimeout(() => setShowUrlCopyPopover(false), 2000);
                                                                }}
                                                                isIconOnly={true}
                                                                startContent={
                                                                    <Copy size={18} className="flex-shrink-0 text-gray-300" />
                                                                }
                                                            >
                                                            </CustomButton>
                                                        </div>
                                                    </PopoverTrigger>
                                                    <PopoverContent>
                                                        <div className="px-3 py-2">
                                                            <div className="flex items-center gap-2">
                                                                <Check size={20} className="text-white" />
                                                                <span className="text-base text-white font-medium">已複製到剪貼簿！</span>
                                                            </div>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="text-white text-lg tracking-wider">
                                                或者，直接使用分享代碼：
                                            </div>
                                            <div className="flex gap-2 items-center">
                                                <code className="flex-1 px-3 py-2 bg-white/10 border border-white/30 rounded-xl text-white text-sm font-mono tracking-wider h-10 flex items-center shadow-xl">
                                                    {truncateString(uploadedShareId, 35)}
                                                </code>
                                                <Popover
                                                    isOpen={showIdCopyPopover}
                                                    onOpenChange={setShowIdCopyPopover}
                                                    placement="top"
                                                    showArrow={true}
                                                    offset={8}
                                                    classNames={{
                                                        base: [
                                                            'before:bg-emerald-700',
                                                        ],
                                                        content: [
                                                            'bg-emerald-600 border-emerald-700',
                                                            "border-2",
                                                        ].join(" "),
                                                    }}
                                                >
                                                    <PopoverTrigger>
                                                        <div className="transition-all duration-200 shadow-xl">
                                                            <CustomButton
                                                                size="md"
                                                                onClick={() => {
                                                                    copyToClipboard(uploadedShareId);
                                                                    setShowIdCopyPopover(true);
                                                                    setTimeout(() => setShowIdCopyPopover(false), 2000);
                                                                }}
                                                                isIconOnly={true}
                                                                startContent={<Copy size={18} className="flex-shrink-0 text-gray-300" />}
                                                            >
                                                            </CustomButton>
                                                        </div>
                                                    </PopoverTrigger>
                                                    <PopoverContent>
                                                        <div className="px-3 py-2">
                                                            <div className="flex items-center gap-2">
                                                                <Check size={20} className="text-white" />
                                                                <span className="text-base text-white font-medium">已複製到剪貼簿！</span>
                                                            </div>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>
                                    </div>

                                    {shareSettings.shareMode === "pin" && generatedPin && (
                                        <div className="w-full p-3 bg-blue-500/20 border-2 border-blue-500/50 rounded-2xl flex items-center gap-3">
                                            <div className="flex-1">
                                                <div className="text-blue-300 text-sm mb-2 pl-1">
                                                    請妥善保存您的 PIN 碼：
                                                </div>
                                                <code className="text-xl font-mono text-white tracking-widest pl-1">
                                                    {generatedPin}
                                                </code>
                                            </div>
                                            <Popover
                                                isOpen={showPinCopyPopover}
                                                onOpenChange={setShowPinCopyPopover}
                                                placement="top"
                                                showArrow={true}
                                                offset={8}
                                                classNames={{
                                                    base: [
                                                        'before:bg-emerald-700',
                                                    ],
                                                    content: [
                                                        'bg-emerald-600 border-emerald-700',
                                                        "border-2",
                                                    ].join(" "),
                                                }}
                                            >
                                                <PopoverTrigger>
                                                    <div className="transition-all duration-200 pr-1 shadow-xl">
                                                        <CustomButton
                                                            size="md"
                                                            onClick={() => {
                                                                copyToClipboard(generatedPin);
                                                                setShowPinCopyPopover(true);
                                                                setTimeout(() => setShowPinCopyPopover(false), 2000);
                                                            }}
                                                            startContent={
                                                                <Copy size={18} className="flex-shrink-0" />
                                                            }
                                                            className="text-gray-300"
                                                            isIconOnly={true}
                                                        >
                                                        </CustomButton>
                                                    </div>
                                                </PopoverTrigger>
                                                <PopoverContent>
                                                    <div className="px-3 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <Check size={20} className="text-white" />
                                                            <span className="text-base text-white font-medium">已複製到剪貼簿！</span>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CustomModalBody>

                        <CustomModalFooter>
                            <div className="flex gap-4 w-full justify-end">
                                {step === "select" && (
                                    <>
                                        <CustomButton
                                            variant="blur"
                                            onClick={handleClose}
                                            className="text-gray-300"
                                        >
                                            取消
                                        </CustomButton>
                                        <CustomButton
                                            onClick={handleUpload}
                                            className="text-blue-400 border-blue-500/50 border-2 text-base"
                                            isDisabled={
                                                !user || files.length === 0 || isUploading
                                            }
                                            startContent={
                                                <ArrowUpFromLine size={18} />
                                            }
                                        >
                                            開始上傳
                                        </CustomButton>
                                    </>
                                )}

                                {step === "settings" && !shareUrl && (
                                    <>
                                        <CustomButton
                                            variant="blur"
                                            onClick={handleClose}
                                            className="text-gray-300"
                                        >
                                            取消
                                        </CustomButton>
                                        <CustomButton
                                            onClick={handleCreateShare}
                                            isDisabled={isCreatingShare}
                                            isLoading={isCreatingShare}
                                            className="text-emerald-400 border-emerald-500/50 border-2 text-base"
                                            startContent={
                                                <Link size={18} />
                                            }
                                        >
                                            建立分享
                                        </CustomButton>
                                    </>
                                )}

                                {step === "settings" && shareUrl && (
                                    <CustomButton onClick={handleClose} className="text-gray-300" >
                                        完成
                                    </CustomButton>
                                )}
                            </div>
                        </CustomModalFooter>
                    </>
                )}
            </CustomModalContent>
        </CustomModal>
    );
}
