"use client";
import React, { useState, useRef, useEffect } from "react";
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
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import gsap from "gsap";
import { ArrowUpFromLine } from "lucide-react";

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
    const [error, setError] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFileId, setUploadedFileId] = useState("");
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
        DEBUG_MODE.SHOW_SHARE_URL ? "https://sharelock.eu.org/share/abcd1234" : ""
    );
    const [isCreatingShare, setIsCreatingShare] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // 重置狀態
    const resetState = () => {
        setStep("select");
        setFiles([]);
        setUploadProgress({});
        setError("");
        setIsUploading(false);
        setUploadedFileId("");
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

        setFiles(filesArray);
        setError("");
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
        if (!email) return;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("請輸入有效的電子郵件");
            return;
        }

        if (shareSettings.recipients.includes(email)) {
            setError("此 Email 已新增");
            return;
        }

        if (shareSettings.recipients.length >= MAX_RECIPIENTS) {
            setError(`最多只能新增 ${MAX_RECIPIENTS} 位收件者`);
            return;
        }

        setShareSettings((prev) => ({
            ...prev,
            recipients: [...prev.recipients, email],
        }));
        setRecipientInput("");
        setError("");
    };

    const removeRecipient = (email: string) => {
        setShareSettings((prev) => ({
            ...prev,
            recipients: prev.recipients.filter((e) => e !== email),
        }));
    };

    // create share link
    const handleCreateShare = async () => {
        if (!user || !uploadedFileId) return;

        if (!shareSettings.displayName.trim()) {
            setError("請輸入檔案名稱");
            return;
        }

        if (shareSettings.maxDownloads < 1) {
            setError("下載次數至少為 1");
            return;
        }

        const daysDiff = Math.ceil(
            (shareSettings.expiresAt.getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        );
        if (daysDiff > MAX_DAYS || daysDiff < 1) {
            setError(`到期日必須在 1 到 ${MAX_DAYS} 天之間`);
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

            if (onSuccess) {
                onSuccess(shareId, url);
            }
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

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // TODO add tooltip and popover
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    // Step 動畫
    useEffect(() => {
        if (modalRef.current && isOpen) {
            gsap.fromTo(
                modalRef.current,
                { opacity: 0, scale: 0.9 },
                { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.4)" }
            );
        }
    }, [isOpen, step]);

    useEffect(() => {
        if (shareSettings.shareMode === "pin" && !generatedPin) {
            generatePin();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shareSettings.shareMode]);

    return (
        <CustomModal isOpen={isOpen} onOpenChange={handleClose} size="md">
            <CustomModalContent>
                {() => (
                    <>
                        <CustomModalHeader>
                            <div className="pt-4">
                                {step === "select" && "上傳檔案"}
                                {step === "uploading" && "檔案上傳中"}
                                {step === "settings" && (shareUrl ? "分享連結" : "分享設定")}
                            </div>
                        </CustomModalHeader>

                        <CustomModalBody>
                            {/* error messages */}
                            {error && (
                                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* select files */}
                            {step === "select" && (
                                <div className="flex flex-col gap-4">
                                    {!user && (
                                        <div className="p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-300">
                                            請先登入才能上傳檔案
                                        </div>
                                    )}

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

                                    {files.length > 0 && (
                                        <div className="flex flex-col gap-2">
                                            {files.map((file) => (
                                                <div
                                                    key={file.id}
                                                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                                                >
                                                    <div className="flex-1">
                                                        <div className="text-white font-medium">
                                                            {file.name}
                                                        </div>
                                                        <div className="text-gray-400 text-sm">
                                                            {formatBytes(file.size)}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setFiles([])}
                                                        className="text-red-400 hover:text-red-300"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* file uploading */}
                            {step === "uploading" && (
                                <div className="flex flex-col items-center gap-6 py-8">
                                    <CircularProgress
                                        size="lg"
                                        value={uploadProgress[files[0]?.id] || 0}
                                        showValueLabel
                                        aria-label="檔案上傳進度"
                                        classNames={{
                                            base: "w-32 h-32",
                                            svg: "w-32 h-32",
                                            indicator: "stroke-emerald-500",
                                            track: "stroke-white/20",
                                            value: "text-2xl font-semibold text-white",
                                        }}
                                        strokeWidth={3}
                                    />
                                </div>
                            )}

                            {/* share settings */}
                            {step === "settings" && !shareUrl && (
                                <div className="flex flex-col gap-4">
                                    <CustomInput
                                        label="檔案名稱"
                                        value={shareSettings.displayName}
                                        onChange={(e) =>
                                            setShareSettings((prev) => ({
                                                ...prev,
                                                displayName: e.target.value,
                                            }))
                                        }
                                    />

                                    <div className="flex gap-4">
                                        <DatePicker
                                            label="到期日"
                                            // @ts-expect-error - HeroUI uses internal @internationalized/date version
                                            value={parseDate(shareSettings.expiresAt.toISOString().split("T")[0])}
                                            onChange={(date: unknown) => {
                                                if (date && typeof date === 'object' && 'year' in date && 'month' in date && 'day' in date) {
                                                    const jsDate = new Date(
                                                        (date as { year: number; month: number; day: number }).year,
                                                        (date as { year: number; month: number; day: number }).month - 1,
                                                        (date as { year: number; month: number; day: number }).day
                                                    );
                                                    setShareSettings((prev) => ({
                                                        ...prev,
                                                        expiresAt: jsDate,
                                                    }));
                                                }
                                            }}
                                            minValue={parseDate(new Date().toISOString().split("T")[0])}
                                            maxValue={parseDate(new Date(Date.now() + MAX_DAYS * 24 * 60 * 60 * 1000).toISOString().split("T")[0])}
                                            className="flex-1"
                                            classNames={{
                                                base: "text-white",
                                                inputWrapper: "bg-white/10 border border-white/30 hover:bg-white/20",
                                                input: "text-white",
                                            }}
                                        />

                                        <NumberInput
                                            label="允許下載次數"
                                            value={shareSettings.maxDownloads}
                                            onValueChange={(value) =>
                                                setShareSettings((prev) => ({
                                                    ...prev,
                                                    maxDownloads: value || 1,
                                                }))
                                            }
                                            minValue={1}
                                            maxValue={999}
                                            className="flex-1"
                                            classNames={{
                                                base: "text-white",
                                                inputWrapper: "bg-white/10 border border-white/30 hover:bg-white/20",
                                                input: "text-white",
                                            }}
                                        />
                                    </div>

                                    <CustomSelect
                                        label="共享模式"
                                        selectedKeys={[shareSettings.shareMode]}
                                        onSelectionChange={(keys) => {
                                            const mode = Array.from(keys)[0] as ShareMode;
                                            setShareSettings((prev) => ({
                                                ...prev,
                                                shareMode: mode,
                                            }));
                                        }}
                                    >
                                        <CustomSelectItem key="public">
                                            未鎖定（任何人可存取）
                                        </CustomSelectItem>
                                        <CustomSelectItem key="pin">
                                            密碼鎖定（需輸入 PIN）
                                        </CustomSelectItem>
                                        <CustomSelectItem key="device">
                                            裝置綁定（首次裝置）
                                        </CustomSelectItem>
                                        <CustomSelectItem key="account">
                                            帳號綁定（首次帳號）
                                        </CustomSelectItem>
                                    </CustomSelect>

                                    {shareSettings.shareMode === "pin" && generatedPin && (
                                        <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                                            <div className="text-blue-300 text-sm mb-2">
                                                您的 PIN 碼（請妥善保存）：
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 text-2xl font-mono text-white tracking-widest">
                                                    {generatedPin}
                                                </code>
                                                <CustomButton
                                                    size="sm"
                                                    onClick={() =>
                                                        copyToClipboard(generatedPin)
                                                    }
                                                >
                                                    複製
                                                </CustomButton>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-2">
                                        <div className="text-gray-300 text-sm">
                                            收件者 Email（最多 {MAX_RECIPIENTS} 位）
                                        </div>
                                        <div className="flex gap-2">
                                            <CustomInput
                                                type="email"
                                                placeholder="example@email.com"
                                                value={recipientInput}
                                                onChange={(e) =>
                                                    setRecipientInput(e.target.value)
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        addRecipient();
                                                    }
                                                }}
                                                className="flex-1"
                                            />
                                            <CustomButton
                                                onClick={addRecipient}
                                                isDisabled={
                                                    shareSettings.recipients.length >=
                                                    MAX_RECIPIENTS
                                                }
                                            >
                                                新增
                                            </CustomButton>
                                        </div>

                                        {shareSettings.recipients.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {shareSettings.recipients.map((email) => (
                                                    <Chip
                                                        key={email}
                                                        onClose={() => removeRecipient(email)}
                                                        variant="flat"
                                                        color="primary"
                                                    >
                                                        {email}
                                                    </Chip>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* generate share link */}
                            {step === "settings" && shareUrl && (
                                <div className="flex flex-col gap-4 items-center py-4">
                                    <div className="text-green-400 text-xl font-semibold">
                                        ✓ 分享連結已建立！
                                    </div>
                                    <div className="w-full p-4 bg-white/10 border border-white/30 rounded-lg">
                                        <div className="text-gray-400 text-sm mb-2">
                                            分享連結：
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={shareUrl}
                                                readOnly
                                                className="flex-1 bg-transparent text-white border-none outline-none"
                                                aria-label="分享連結"
                                            />
                                            <CustomButton
                                                size="sm"
                                                onClick={() => copyToClipboard(shareUrl)}
                                            >
                                                複製
                                            </CustomButton>
                                        </div>
                                    </div>

                                    {shareSettings.shareMode === "pin" && generatedPin && (
                                        <div className="w-full p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                                            <div className="text-blue-300 text-sm mb-2">
                                                PIN 碼：
                                            </div>
                                            <code className="text-xl font-mono text-white tracking-widest">
                                                {generatedPin}
                                            </code>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CustomModalBody>

                        <CustomModalFooter>
                            <div className="flex gap-2 w-full justify-end">
                                {step === "select" && (
                                    <>
                                        <CustomButton
                                            variant="blur"
                                            onClick={handleClose}
                                        >
                                            取消
                                        </CustomButton>
                                        <CustomButton
                                            onClick={handleUpload}
                                            isDisabled={
                                                !user || files.length === 0 || isUploading
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
                                        >
                                            取消
                                        </CustomButton>
                                        <CustomButton
                                            onClick={handleCreateShare}
                                            isDisabled={isCreatingShare}
                                            isLoading={isCreatingShare}
                                        >
                                            建立分享
                                        </CustomButton>
                                    </>
                                )}

                                {step === "settings" && shareUrl && (
                                    <CustomButton onClick={handleClose}>
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
