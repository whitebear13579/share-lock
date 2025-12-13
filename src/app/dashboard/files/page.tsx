"use client";
import React, { useEffect, useState, useCallback, useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { useRouter } from "next/navigation";
import { useAuth } from "@/utils/authProvider";
import NextLink from "next/link";
import {
    Cog,
    Folder,
    House,
    LogOut,
    Star,
    Search,
    Clock,
    Share2,
    Calendar,
    FileText,
    Download,
    Trash2,
    MoreVertical,
    Users,
    Eye,
    MessageCircleQuestionMark,
    Plus,
    Upload,
    Copy,
    ExternalLink,
    Edit3,
    Ban,
    FileArchive,
    File,
    FileSpreadsheet,
    Presentation,
    Check,
    Info,
    Lock,
    LockOpen,
    AlertTriangle,
    CircleAlert,
    ImageIcon,
    SquarePlay,
    AudioLinesIcon,
    CodeIcon,
    Link2,
    RotateCwIcon,
    ClockFading,
} from "lucide-react";
import {
    Spinner,
    Card,
    CardBody,
    CardHeader,
    Avatar,
    Chip,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Link,
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarMenuToggle,
    NavbarMenu,
    NavbarMenuItem,
    Tooltip,
    addToast,
    Button,
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@heroui/react";
import {
    CustomModal,
    CustomModalContent,
    CustomModalHeader,
    CustomModalBody,
    CustomModalFooter,
} from "@/components/modal";
import CustomButton from "@/components/button";
import CustomInput from "@/components/input";
import CustomTabs from "@/components/tabs";
import { motion, AnimatePresence } from "framer-motion";
import UploadFiles from "@/components/uploadFiles";
import DashboardNavigation from "@/components/dashboardNavigation";
import DashboardContentTransition from "@/components/dashboardContentTransition";

// File data interface
interface FileData {
    id: string;
    fileId?: string; // For sharedWithMe items
    name: string;
    size: string;
    sizeBytes?: number;
    sharedWith?: string[];
    expiryDate: string;
    revokedDate?: string | null;
    status: "active" | "expired";
    isProtected: boolean;
    sharedDate: string;
    views: number;
    downloads: number;
    contentType?: string;
    shareMode?: string;
    remainingDownloads?: number;
    maxDownloads?: number;
    shareId?: string;
    ownerEmail?: string;
    revoked?: boolean;
}

// File detail interface for modal
interface FileDetail {
    id: string;
    name: string;
    originalName: string;
    size: number;
    contentType: string;
    shareMode: string;
    maxDownloads: number;
    remainingDownloads: number;
    createdAt: string;
    expiresAt: string;
    revoked: boolean;
    views: number;
    downloads: number;
    isOwner: boolean;
    ownerEmail?: string;
    shareInfo?: {
        shareId: string;
        shareUrl: string;
        valid: boolean;
        createdAt: string;
    };
    recipients: Array<{ email: string; photoURL?: string; displayName?: string }>;
}

// Get file type icon based on content type
const getFileIcon = (contentType?: string, className?: string) => {
    if (!contentType) return <File className={className} />;

    const iconClass = className || "text-blue-400";

    // Images
    if (contentType.startsWith("image/")) {
        return <ImageIcon className={`${iconClass} !text-pink-400`} />;
    }

    // Videos
    if (contentType.startsWith("video/")) {
        return <SquarePlay className={`${iconClass} !text-purple-400`} />;
    }

    // Audio
    if (contentType.startsWith("audio/")) {
        return <AudioLinesIcon className={`${iconClass} !text-green-400`} />;
    }

    // Archives
    if (
        contentType.includes("zip") ||
        contentType.includes("rar") ||
        contentType.includes("tar") ||
        contentType.includes("7z") ||
        contentType.includes("archive") ||
        contentType.includes("compressed")
    ) {
        return <FileArchive className={`${iconClass} !text-amber-400`} />;
    }

    // Code files
    if (
        contentType.includes("javascript") ||
        contentType.includes("typescript") ||
        contentType.includes("python") ||
        contentType.includes("java") ||
        contentType.includes("html") ||
        contentType.includes("css") ||
        contentType.includes("json") ||
        contentType.includes("xml") ||
        contentType.includes("text/x-")
    ) {
        return <CodeIcon className={`${iconClass} !text-cyan-400`} />;
    }

    // Spreadsheets
    if (
        contentType.includes("spreadsheet") ||
        contentType.includes("excel") ||
        contentType.includes("csv")
    ) {
        return <FileSpreadsheet className={`${iconClass} !text-emerald-400`} />;
    }

    // Presentations
    if (
        contentType.includes("presentation") ||
        contentType.includes("powerpoint")
    ) {
        return <Presentation className={`${iconClass} !text-orange-400`} />;
    }

    // Documents (PDF, Word, etc.)
    if (
        contentType.includes("pdf") ||
        contentType.includes("document") ||
        contentType.includes("word") ||
        contentType.includes("text/plain")
    ) {
        return <FileText className={`${iconClass} !text-blue-400`} />;
    }

    // Default
    return <File className={iconClass} />;
};

// Get file icon background color based on content type
const getFileIconBgColor = (contentType?: string, isExpired?: boolean): string => {
    if (isExpired) return "bg-gray-500/20 group-hover:bg-gray-500/30";
    if (!contentType) return "bg-blue-500/20 group-hover:bg-blue-500/30";

    if (contentType.startsWith("image/")) return "bg-pink-500/20 group-hover:bg-pink-500/30";
    if (contentType.startsWith("video/")) return "bg-purple-500/20 group-hover:bg-purple-500/30";
    if (contentType.startsWith("audio/")) return "bg-green-500/20 group-hover:bg-green-500/30";
    if (contentType.includes("zip") || contentType.includes("rar") || contentType.includes("tar") || contentType.includes("7z") || contentType.includes("archive") || contentType.includes("compressed")) return "bg-amber-500/20 group-hover:bg-amber-500/30";
    if (contentType.includes("javascript") || contentType.includes("typescript") || contentType.includes("python") || contentType.includes("java") || contentType.includes("html") || contentType.includes("css") || contentType.includes("json") || contentType.includes("xml") || contentType.includes("text/x-")) return "bg-cyan-500/20 group-hover:bg-cyan-500/30";
    if (contentType.includes("spreadsheet") || contentType.includes("excel") || contentType.includes("csv")) return "bg-emerald-500/20 group-hover:bg-emerald-500/30";
    if (contentType.includes("presentation") || contentType.includes("powerpoint")) return "bg-orange-500/20 group-hover:bg-orange-500/30";
    if (contentType.includes("pdf") || contentType.includes("document") || contentType.includes("word") || contentType.includes("text/plain")) return "bg-blue-500/20 group-hover:bg-blue-500/30";

    return "bg-blue-500/20 group-hover:bg-blue-500/30";
};

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
};

const truncateFileName = (name: string, maxLength: number = 15): string => {
    if (name.length <= maxLength) return name;
    const keepLength = Math.floor((maxLength - 3) / 2);
    return `${name.slice(0, keepLength)}...${name.slice(-keepLength)}`;
};

export default function MyFiles() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const fakeMainRef = useRef<HTMLDivElement>(null);
    const fakeFooterRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState("myFiles");
    const [searchQuery, setSearchQuery] = useState("");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [files, setFiles] = useState<FileData[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [filesError, setFilesError] = useState<string | null>(null);

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
    const [fileDetail, setFileDetail] = useState<FileDetail | null>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<FileData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [fileToRename, setFileToRename] = useState<FileData | null>(null);
    const [isRenaming, setIsRenaming] = useState(false);
    const renameInputRef = useRef<HTMLInputElement>(null);

    const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

    const [fileActionFeedback, setFileActionFeedback] = useState<{
        fileId: string | null;
        message: string;
        type: 'success' | 'error';
        isOpen: boolean;
    }>({ fileId: null, message: '', type: 'success', isOpen: false });

    const [detailModalFeedback, setDetailModalFeedback] = useState<{
        message: string;
        type: 'success' | 'error';
        isOpen: boolean;
    }>({ message: '', type: 'success', isOpen: false });

    const [isRecipientsModalOpen, setIsRecipientsModalOpen] = useState(false);

    const [fileToCreateShare, setFileToCreateShare] = useState<FileData | null>(null);

    const detailModalBodyRef = useRef<HTMLDivElement>(null);
    const renameModalBodyRef = useRef<HTMLDivElement>(null);

    const detailPrevHeightRef = useRef<number | null>(null);
    const detailIsAnimatingRef = useRef(false);

    const cardDownloadCountRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
    const cardRemainingCountRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
    const modalDownloadCountRef = useRef<HTMLSpanElement>(null);
    const modalRemainingCountRef = useRef<HTMLSpanElement>(null);

    const showActionFeedback = (fileId: string, message: string, type: 'success' | 'error') => {
        setFileActionFeedback({ fileId, message, type, isOpen: true });
        setTimeout(() => {
            setFileActionFeedback({ fileId: null, message: '', type: 'success', isOpen: false });
        }, 2500);
    };

    const showDetailModalFeedback = (message: string, type: 'success' | 'error') => {
        setDetailModalFeedback({ message, type, isOpen: true });
        setTimeout(() => {
            setDetailModalFeedback({ message: '', type: 'success', isOpen: false });
        }, 2500);
    };

    const animateNumber = useCallback((element: HTMLElement | null, newValue: number) => {
        if (!element) return;

        const currentValue = parseInt(element.textContent || '0', 10);
        if (currentValue === newValue) return;

        gsap.killTweensOf(element);

        const tl = gsap.timeline();

        tl.to(element, {
            y: -20,
            opacity: 0,
            duration: 0.25,
            ease: "power2.in",
        })
            .call(() => {
                element.textContent = String(newValue);
            })
            .set(element, {
                y: 20,
            })
            .to(element, {
                y: 0,
                opacity: 1,
                duration: 0.35,
                ease: "back.out(2)",
            });
    }, []);

    const updateDownloadCount = useCallback((fileId: string, fromModal: boolean) => {
        setFiles(prevFiles => prevFiles.map(f => {
            if (f.id === fileId || f.fileId === fileId) {
                const newDownloads = f.downloads + 1;
                const newRemaining = f.maxDownloads && f.maxDownloads > 0 && f.remainingDownloads !== undefined
                    ? Math.max(0, f.remainingDownloads - 1)
                    : f.remainingDownloads;

                const downloadElement = cardDownloadCountRefs.current.get(f.id);
                animateNumber(downloadElement ?? null, newDownloads);

                if (f.maxDownloads && f.maxDownloads > 0) {
                    const remainingElement = cardRemainingCountRefs.current.get(f.id);
                    animateNumber(remainingElement ?? null, newRemaining ?? 0);
                }

                return {
                    ...f,
                    downloads: newDownloads,
                    remainingDownloads: newRemaining,
                };
            }
            return f;
        }));

        if (fromModal && fileDetail) {
            const newDownloads = fileDetail.downloads + 1;
            const newRemaining = fileDetail.maxDownloads > 0
                ? Math.max(0, fileDetail.remainingDownloads - 1)
                : fileDetail.remainingDownloads;

            animateNumber(modalDownloadCountRef.current, newDownloads);

            if (fileDetail.maxDownloads > 0) {
                animateNumber(modalRemainingCountRef.current, newRemaining);
            }

            setFileDetail(prev => prev ? {
                ...prev,
                downloads: newDownloads,
                remainingDownloads: newRemaining,
            } : null);
        }

    }, [fileDetail, animateNumber]);

    const handleLogout = async () => {
        return new Promise<void>((resolve) => {
            const tl = gsap.timeline({
                onComplete: () => {
                    (async () => {
                        const overlayContainer = document.createElement("div");
                        overlayContainer.id = "logout-transition-overlay";
                        overlayContainer.className = "fixed inset-0 z-[9999] pointer-events-none bg-neutral-800";

                        const bgPanel = document.createElement("div");
                        bgPanel.className = "absolute top-0 left-0 right-0 bg-gradient-to-tr from-indigo-900 from-25% to-sky-800 rounded-b-5xl border-b-2 border-b-gray-500 shadow-2xl";
                        bgPanel.style.bottom = "64px";
                        overlayContainer.appendChild(bgPanel);

                        const footer = document.createElement("div");
                        const isDesktop = window.matchMedia('(min-width: 768px)').matches;
                        footer.className = `absolute bottom-0 left-0 right-0 px-6 py-5 bg-neutral-800 flex flex-shrink-0 ${isDesktop ? 'justify-start' : 'justify-center'}`;
                        footer.innerHTML = `
                            <p class="text-center md:text-left px-0 md:px-8 text-gray-300 whitespace-nowrap">
                                © 2025 <span class="text-blue-500 font-bold">Share Lock</span>&nbsp;.&nbsp;&nbsp;&nbsp;All Rights Reserved.
                            </p>
                        `;
                        overlayContainer.appendChild(footer);

                        document.body.appendChild(overlayContainer);

                        if (typeof window !== "undefined") {
                            sessionStorage.setItem("fromDashboardLogout", "true");
                        }
                        await router.push("/login");
                        await logout();
                        resolve();
                    })();
                },
            });

            tl.set([fakeMainRef.current, fakeFooterRef.current], {
                opacity: 1
            });

            const footerHeight = 64;
            tl.to(
                fakeMainRef.current,
                {
                    y: -footerHeight,
                    duration: 0.8,
                    ease: "power2.inOut",
                },
                "0"
            );

            tl.to(
                fakeFooterRef.current,
                {
                    translateY: "0%",
                    duration: 0.6,
                    ease: "power2.out"
                },
                "-=0.4"
            );
        });
    };

    const fetchFiles = useCallback(async (type: string) => {
        if (!user) return;

        setIsLoadingFiles(true);
        setFilesError(null);

        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`/api/files/list?type=${type}`, {
                headers: {
                    Authorization: `Bearer ${idToken}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
                console.error("API Error:", response.status, errorData);
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }

            const data = await response.json();
            setFiles(data.files || []);
        } catch (error) {
            console.error("Error fetching files:", error);
            const errorMessage = error instanceof Error ? error.message : "無法載入檔案列表";
            setFilesError(errorMessage);
            setFiles([]);
        } finally {
            setIsLoadingFiles(false);
        }
    }, [user]);

    // Fetch file details
    const fetchFileDetail = useCallback(async (fileId: string) => {
        if (!user) return;

        setIsLoadingDetail(true);
        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`/api/files/detail?fileId=${fileId}`, {
                headers: {
                    Authorization: `Bearer ${idToken}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch file details");
            }

            const data = await response.json();
            setFileDetail(data.file);
        } catch (error) {
            console.error("Error fetching file details:", error);
            addToast({
                title: "載入失敗",
                description: "無法載入檔案詳細資訊",
                color: "danger",
            });
        } finally {
            setIsLoadingDetail(false);
        }
    }, [user]);

    const handleViewDetails = (file: FileData) => {
        setSelectedFile(file);
        setIsDetailModalOpen(true);
        fetchFileDetail(file.fileId || file.id);
    };

    const handleDownload = async (file: FileData, fromModal: boolean = false) => {
        if (!user) return;

        setDownloadingFileId(file.id);
        try {
            const idToken = await user.getIdToken();
            const response = await fetch("/api/files/download", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${idToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fileId: file.fileId || file.id,
                    shareId: file.shareId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Download failed");
            }

            if (data.requiresVerification) {
                addToast({
                    title: "需要驗證",
                    description: "正在導向驗證頁面...",
                    color: "warning",
                });
                router.push(data.redirectUrl);
            } else {
                const downloadUrl = data.downloadUrl;
                const link = document.createElement("a");
                link.href = downloadUrl;
                link.download = file.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                updateDownloadCount(file.id, fromModal);
            }
        } catch (error) {
            console.error("Download error:", error);
            if (fromModal) {
                showDetailModalFeedback(error instanceof Error ? error.message : '下載失敗', 'error');
            } else {
                showActionFeedback(file.id, error instanceof Error ? error.message : '下載失敗', 'error');
            }
        } finally {
            setDownloadingFileId(null);
        }
    };

    const handleDelete = async () => {
        if (!user || !fileToDelete) return;

        setIsDeleting(true);
        try {
            const idToken = await user.getIdToken();
            const response = await fetch("/api/files/delete", {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${idToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fileId: fileToDelete.id,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Delete failed");
            }

            addToast({
                title: "刪除成功",
                description: `已刪除 ${fileToDelete.name}`,
                color: "success",
            });

            setIsDeleteModalOpen(false);
            setFileToDelete(null);
            fetchFiles(activeTab);
        } catch (error) {
            console.error("Delete error:", error);
            addToast({
                title: "刪除失敗",
                description: error instanceof Error ? error.message : "無法刪除檔案",
                color: "danger",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle rename
    const handleRename = async () => {
        const newFileName = renameInputRef.current?.value || '';
        if (!user || !fileToRename || !newFileName.trim()) return;

        setIsRenaming(true);
        try {
            const idToken = await user.getIdToken();
            const response = await fetch("/api/files/update", {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${idToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fileId: fileToRename.id,
                    updates: {
                        displayName: newFileName.trim(),
                    },
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Rename failed");
            }

            setFiles(prevFiles => prevFiles.map(f =>
                f.id === fileToRename.id ? { ...f, name: newFileName.trim() } : f
            ));

            setIsRenameModalOpen(false);
            showActionFeedback(fileToRename.id, '重新命名成功！', 'success');
            setFileToRename(null);
        } catch (error) {
            console.error("Rename error:", error);
            showActionFeedback(fileToRename.id, error instanceof Error ? error.message : '重新命名失敗', 'error');
        } finally {
            setIsRenaming(false);
        }
    };

    // Handle copy share link
    const handleCopyShareLink = async (file: FileData) => {
        if (!user) return;

        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`/api/files/detail?fileId=${file.fileId || file.id}`, {
                headers: {
                    Authorization: `Bearer ${idToken}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to get share link");
            }

            const data = await response.json();
            if (data.file?.shareInfo?.shareUrl) {
                await navigator.clipboard.writeText(data.file.shareInfo.shareUrl);
                showActionFeedback(file.id, '連結已複製！', 'success');
            } else {
                throw new Error("No share link available");
            }
        } catch (error) {
            console.error("Copy error:", error);
            showActionFeedback(file.id, '複製失敗', 'error');
        }
    };

    // Handle copy share link from detail modal
    const handleCopyDetailShareLink = async (shareUrl: string) => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            showDetailModalFeedback('代碼已複製！', 'success');
        } catch (error) {
            console.error("Copy error:", error);
            showDetailModalFeedback('複製失敗', 'error');
        }
    };

    // Handle revoke share
    const handleRevokeShare = async (file: FileData) => {
        if (!user) return;

        try {
            const idToken = await user.getIdToken();
            const response = await fetch("/api/files/update", {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${idToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fileId: file.id,
                    updates: {
                        revoked: true,
                    },
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Revoke failed");
            }

            showActionFeedback(file.id, '分享已撤銷！', 'success');

            setFiles(prevFiles => prevFiles.map(f =>
                f.id === file.id ? { ...f, status: 'expired' as const, revoked: true } : f
            ));
        } catch (error) {
            console.error("Revoke error:", error);
            showActionFeedback(file.id, error instanceof Error ? error.message : '撤銷失敗', 'error');
        }
    };

    useEffect(() => {
        const forceCleanupLoginElements = () => {
            const allFixedElements = Array.from(document.querySelectorAll('.fixed'));

            allFixedElements.forEach((el) => {
                const element = el as HTMLElement;

                if (element === fakeMainRef.current || element === fakeFooterRef.current) {
                    return;
                }

                const hasInset = element.classList.contains('inset-0');

                const isFakeBg = element.classList.contains('bg-linear-205') && hasInset;
                const isFakeTab = element.classList.contains('pointer-events-none') &&
                    element.classList.contains('z-10') &&
                    hasInset;

                if (isFakeBg || isFakeTab) {
                    element.remove();
                }
            });
        };

        forceCleanupLoginElements();

        const fromHome = sessionStorage.getItem("pageTransition") === "fromHome";
        if (fromHome) {
            sessionStorage.removeItem("pageTransition");

            setTimeout(forceCleanupLoginElements, 0);
            setTimeout(forceCleanupLoginElements, 50);
        }

        if (fakeMainRef.current && fakeFooterRef.current) {
            gsap.set([fakeMainRef.current, fakeFooterRef.current], {
                opacity: 0
            });
        }
    }, []);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 1536);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    useEffect(() => {
        if (user) {
            fetchFiles(activeTab);
        }
    }, [activeTab, user, fetchFiles]);

    useLayoutEffect(() => {
        if (!isDetailModalOpen) {
            detailPrevHeightRef.current = null;
            return;
        }

        const dialogElements = document.querySelectorAll('[role="dialog"]');
        const dialogElement = dialogElements[dialogElements.length - 1] as HTMLElement;

        if (dialogElement && detailPrevHeightRef.current === null) {
            detailPrevHeightRef.current = dialogElement.getBoundingClientRect().height;
        }
    }, [isDetailModalOpen]);

    useLayoutEffect(() => {
        if (!isDetailModalOpen || detailIsAnimatingRef.current) return;

        const dialogElements = document.querySelectorAll('[role="dialog"]');
        const dialogElement = dialogElements[dialogElements.length - 1] as HTMLElement;
        if (!dialogElement) return;

        if (detailPrevHeightRef.current !== null) {
            dialogElement.style.height = `${detailPrevHeightRef.current}px`;
            dialogElement.style.overflow = 'hidden';
        }

        requestAnimationFrame(() => {
            const prevHeight = detailPrevHeightRef.current;
            dialogElement.style.height = 'auto';
            const currentHeight = dialogElement.getBoundingClientRect().height;

            if (prevHeight !== null && Math.abs(prevHeight - currentHeight) > 1) {
                detailIsAnimatingRef.current = true;

                dialogElement.style.height = `${prevHeight}px`;
                dialogElement.style.overflow = 'hidden';

                void dialogElement.offsetHeight;

                requestAnimationFrame(() => {
                    dialogElement.style.height = `${currentHeight}px`;

                    setTimeout(() => {
                        dialogElement.style.height = 'auto';
                        dialogElement.style.overflow = '';
                        detailPrevHeightRef.current = currentHeight;
                        detailIsAnimatingRef.current = false;
                    }, 400);
                });
            } else {
                dialogElement.style.overflow = '';
                detailPrevHeightRef.current = currentHeight;
            }
        });
    }, [isLoadingDetail, fileDetail, isDetailModalOpen]);

    if (loading) {
        return (
            <div className="min-h-screen  bg-linear-205 from-slate-700  to-neutral-800 to-55% flex items-center justify-center">
                <Spinner
                    classNames={{ label: "text-xl text-white" }}
                    variant="dots"
                    size="lg"
                    color="default"
                    label="載入中..."
                />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const filteredFiles = files.filter((file) =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const tabs = [
        { key: "myFiles", label: "我的檔案", icon: <Folder size={18} /> },
        { key: "sharedWithMe", label: "與我共用", icon: <Users size={18} /> },
        { key: "expired", label: "已失效", icon: <Clock size={18} /> },
    ];

    return (
        <div className="min-h-screen bg-neutral-800">
            {/* Gradient overlay that fades smoothly */}
            <div className="fixed top-0 left-0 right-0 h-screen bg-linear-205 from-slate-700 from-0% via-slate-700/50 via-30% to-transparent to-70% pointer-events-none" />

            {/* Wide device navigation */}
            {!isMobile && (
                <DashboardNavigation loading={loading} onLogout={handleLogout} />
            )}

            {/* Mobile device navigation */}
            {isMobile && (
                <Navbar
                    isMenuOpen={isMenuOpen}
                    onMenuOpenChange={setIsMenuOpen}
                    className="bg-black/40 transition-all relative z-10"
                    classNames={{
                        base: "border-b-1.5 border-white/70",
                        wrapper: "px-4 sm:px-6",
                        brand: "text-white",
                        content: "text-white",
                        item: "text-white",
                        toggle: "text-white",
                        menu: "bg-white/10",
                    }}
                >
                    <NavbarContent>
                        <NavbarMenuToggle
                            aria-label={isMenuOpen ? "關閉選單" : "開啟選單"}
                            className="text-white"
                        />
                    </NavbarContent>

                    <NavbarContent justify="center">
                        <NavbarBrand>
                            <p className="font-bold text-xl text-white">我的檔案</p>
                        </NavbarBrand>
                    </NavbarContent>

                    <NavbarContent justify="end">
                        <Dropdown
                            placement="bottom-end"
                            classNames={{
                                content: "bg-neutral-800 border-white/20 border-2",
                            }}
                        >
                            <DropdownTrigger>
                                <Avatar
                                    isBordered
                                    as="button"
                                    className="transition-transform"
                                    color="success"
                                    name={user?.displayName || "User"}
                                    size="sm"
                                    src={user?.photoURL || "/undefined.png"}
                                />
                            </DropdownTrigger>
                            <DropdownMenu
                                aria-label="使用者頭像選單"
                                variant="solid"
                                itemClasses={{
                                    base: "data-[hover=true]:bg-white/15 data-[hover=true]:text-white",
                                }}
                            >
                                <DropdownItem
                                    key="profile"
                                    className="h-14 gap-2"
                                    textValue="用戶資訊"
                                >
                                    <p className="font-semibold text-white">
                                        你好，{user?.displayName}!
                                    </p>
                                    <p className="font-semibold text-gray-300">
                                        {user?.email}
                                    </p>
                                </DropdownItem>
                                <DropdownItem
                                    key="helpandfeedback"
                                    className="h-9"
                                    startContent={
                                        <MessageCircleQuestionMark
                                            size={18}
                                            className="text-white"
                                        />
                                    }
                                >
                                    <Link
                                        href="https://github.com/whitebear13579/share-lock/issues"
                                        isExternal
                                        className="text-white"
                                    >
                                        幫助與意見回饋
                                    </Link>
                                </DropdownItem>
                                <DropdownItem
                                    key="logout"
                                    color="danger"
                                    startContent={
                                        <LogOut size={18} className="text-red-400" />
                                    }
                                    onPress={handleLogout}
                                    className="h-9 text-red-400"
                                >
                                    <span className="text-red-400">登出</span>
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </NavbarContent>

                    <NavbarMenu className="bg-black/10 pt-6 border-t-1.5 border-white/70">
                        <NavbarMenuItem>
                            <NextLink href="/dashboard" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/20 text-white transition-colors">
                                <House size={20} />
                                <span className="text-lg">資訊主頁</span>
                            </NextLink>
                        </NavbarMenuItem>
                        <NavbarMenuItem>
                            <NextLink href="/dashboard/files" className="flex items-center gap-3 p-3 rounded-xl bg-white/20 text-blue-400">
                                <Folder size={20} />
                                <span className="text-lg font-medium">我的檔案</span>
                            </NextLink>
                        </NavbarMenuItem>
                        <NavbarMenuItem>
                            <NextLink href="/dashboard/settings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/20 text-white transition-colors">
                                <Cog size={20} />
                                <span className="text-lg">帳號設定</span>
                            </NextLink>
                        </NavbarMenuItem>
                    </NavbarMenu>
                </Navbar>
            )}

            {/* Floating Upload Button - Mobile only */}
            {isMobile && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
                    className="fixed bottom-6 right-6 z-50"
                >
                    <CustomButton
                        variant="blur"
                        size="lg"
                        radius="full"
                        isIconOnly
                        isDisabled={loading}
                        onPress={() => setIsUploadModalOpen(true)}
                        className="!w-16 !h-16 !min-w-16 hover:bg-emerald-400 border backdrop-blur-md border-white/30"
                    >
                        <Plus size={24} className="text-green-400 group-hover:text-gray-800" />
                    </CustomButton>
                </motion.div>
            )}

            <DashboardContentTransition>
                {/* Main Content */}
                <div className={`relative z-10 ${isMobile ? "pt-20 px-4" : "pt-36 px-13"}`}>
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
                        <div>
                            <div
                                className={`font-bold text-white mb-2 ${isMobile ? "text-2xl" : "text-4xl"
                                    }`}
                            >
                                我的檔案
                            </div>
                            <p
                                className={`text-gray-300 ${isMobile ? "text-base" : "text-lg"
                                    }`}
                            >
                                管理您分享的檔案與接收的檔案
                            </p>
                        </div>
                    </div>

                    {/* Tabs and Search Bar */}
                    <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex justify-start w-full lg:w-auto lg:space-x-3">
                            <CustomTabs
                                tabs={tabs}
                                defaultTab="myFiles"
                                onTabChange={setActiveTab}
                                className="w-full lg:w-auto"
                                layoutId="filesTabNavigation"
                            />
                            {/* Upload Button - Desktop only */}
                            {!isMobile && (
                                <CustomButton
                                    variant="blur"
                                    size="lg"
                                    radius="full"
                                    startContent={
                                        <Upload
                                            size={20}
                                            className="text-green-400 group-hover:text-gray-800 transition-colors duration-200"
                                        />
                                    }
                                    isDisabled={loading}
                                    onPress={() => setIsUploadModalOpen(true)}
                                    className="text-base hover:bg-emerald-400 hover:text-gray-800 text-gray-200"
                                >
                                    上傳檔案
                                </CustomButton>
                            )}
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full lg:w-96 custom-input-trans-animate">
                            <CustomInput
                                size="lg"
                                placeholder="搜尋檔案......"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full"
                                startContent={
                                    <Search size={18} className="text-gray-200" />
                                }
                            />
                        </div>
                    </div>

                    {/* Files Grid */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="pb-16"
                        >
                            {isLoadingFiles ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="flex justify-center items-center py-16"
                                >
                                    <Spinner
                                        classNames={{ label: "text-lg text-white" }}
                                        variant="dots"
                                        size="lg"
                                        color="default"
                                        label="載入檔案中..."
                                    />
                                </motion.div>
                            ) : filesError ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="py-16 text-center flex flex-col items-center gap-4"
                                >
                                    <p className="text-red-400 text-xl flex flex-col items-center justify-center gap-3"><CircleAlert size={32} />{filesError}</p>
                                    <CustomButton
                                        variant="blur"
                                        onPress={() => fetchFiles(activeTab)}
                                        className="text-red-400 border-red-500/50 border-2"
                                        startContent={<RotateCwIcon size={18} className="flex-shrink-0" />}
                                    >
                                        重試
                                    </CustomButton>
                                </motion.div>
                            ) : filteredFiles.length === 0 ? (
                                <motion.div
                                    key={searchQuery ? `search-${searchQuery}` : 'empty'}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.25 }}
                                    className="py-16 text-center"
                                >
                                    <p className="text-gray-400 text-xl">
                                        {searchQuery ? "沒有找到符合條件的檔案" : activeTab === "expired" ? "沒有已過期的檔案" : "目前沒有檔案"}
                                    </p>
                                </motion.div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filteredFiles.map((file, index) => (
                                        <motion.div
                                            key={file.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                duration: 0.3,
                                                delay: index * 0.05,
                                            }}
                                        >
                                            <Popover
                                                isOpen={fileActionFeedback.isOpen && fileActionFeedback.fileId === file.id}
                                                placement="top"
                                                showArrow={true}
                                                offset={8}
                                                classNames={{
                                                    base: [
                                                        fileActionFeedback.type === 'success' ? 'before:bg-emerald-700' : 'before:bg-rose-800',
                                                    ],
                                                    content: [
                                                        fileActionFeedback.type === 'success' ? 'bg-emerald-600 border-emerald-700' : 'bg-rose-500 border-rose-800',
                                                        "border-2",
                                                    ].join(" "),
                                                }}
                                            >
                                                <PopoverTrigger>
                                                    <Card className="custom-button-trans-override bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer group">
                                                        <CardHeader className="flex justify-between items-start pb-2">
                                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                                <div
                                                                    className={`p-3 rounded-xl transition-colors duration-300 ${getFileIconBgColor(file.contentType, file.status === "expired")}`}
                                                                >
                                                                    {getFileIcon(
                                                                        file.contentType,
                                                                        `w-6 h-6 ${file.status === "expired" ? "text-gray-400" : ""}`
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h3 className="text-white font-semibold text-base truncate mb-1" title={file.name}>
                                                                        {truncateFileName(file.name, 20)}
                                                                    </h3>
                                                                    <p className="text-gray-400 text-sm">
                                                                        {file.size}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Dropdown
                                                                placement="bottom-end"
                                                                classNames={{
                                                                    content: "bg-neutral-800 border-white/20 border-2",
                                                                }}
                                                            >
                                                                <DropdownTrigger>
                                                                    <Button
                                                                        isIconOnly
                                                                        size="sm"
                                                                        variant="light"
                                                                        className="custom-button-trans-override text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                                    >
                                                                        <MoreVertical size={18} />
                                                                    </Button>
                                                                </DropdownTrigger>
                                                                <DropdownMenu
                                                                    aria-label="檔案操作"
                                                                    variant="solid"
                                                                    itemClasses={{
                                                                        base: "data-[hover=true]:bg-white/15 data-[hover=true]:text-white",
                                                                    }}
                                                                    disabledKeys={
                                                                        (downloadingFileId === file.id || file.status === "expired")
                                                                            ? ["download"]
                                                                            : []
                                                                    }
                                                                    items={[
                                                                        { key: "view", label: "查看詳情" },
                                                                        ...(file.status !== "expired" ? [{ key: "download", label: "下載" }] : []),
                                                                        ...(activeTab === "myFiles" ? [
                                                                            { key: "rename", label: "重新命名" },
                                                                            ...(file.shareId ? [
                                                                                { key: "copyLink", label: "複製分享連結" },
                                                                                { key: "openShare", label: "開啟分享頁面" },
                                                                                { key: "revoke", label: "撤銷分享" },
                                                                            ] : [
                                                                                { key: "createShare", label: "建立分享連結" },
                                                                            ]),
                                                                            { key: "delete", label: "刪除" },
                                                                        ] : []),
                                                                        ...(activeTab === "expired" ? [
                                                                            { key: "delete", label: "刪除" },
                                                                        ] : []),
                                                                        ...(activeTab === "sharedWithMe" ? [
                                                                            { key: "openShareLink", label: "開啟分享頁面" },
                                                                        ] : []),
                                                                    ]}
                                                                    onAction={async (key) => {
                                                                        switch (key) {
                                                                            case "view":
                                                                                handleViewDetails(file);
                                                                                break;
                                                                            case "download":
                                                                                handleDownload(file);
                                                                                break;
                                                                            case "rename":
                                                                                setFileToRename(file);
                                                                                setIsRenameModalOpen(true);
                                                                                break;
                                                                            case "copyLink":
                                                                                handleCopyShareLink(file);
                                                                                break;
                                                                            case "openShare":
                                                                                {
                                                                                    const idToken = await user.getIdToken();
                                                                                    const response = await fetch(`/api/files/detail?fileId=${file.id}`, {
                                                                                        headers: { Authorization: `Bearer ${idToken}` },
                                                                                    });
                                                                                    const data = await response.json();
                                                                                    if (data.file?.shareInfo?.shareId) {
                                                                                        window.open(`/share/${data.file.shareInfo.shareId}`, "_blank");
                                                                                    }
                                                                                }
                                                                                break;
                                                                            case "revoke":
                                                                                handleRevokeShare(file);
                                                                                break;
                                                                            case "createShare":
                                                                                setFileToCreateShare(file);
                                                                                setIsUploadModalOpen(true);
                                                                                break;
                                                                            case "delete":
                                                                                setFileToDelete(file);
                                                                                setIsDeleteModalOpen(true);
                                                                                break;
                                                                            case "openShareLink":
                                                                                if (file.shareId) {
                                                                                    window.open(`/share/${file.shareId}`, "_blank");
                                                                                }
                                                                                break;
                                                                        }
                                                                    }}
                                                                >
                                                                    {(item) => (
                                                                        <DropdownItem
                                                                            key={item.key}
                                                                            startContent={
                                                                                item.key === "view" ? <Info size={16} className="text-white" /> :
                                                                                    item.key === "download" ? (downloadingFileId === file.id ? <Spinner size="sm" color="white" /> : <Download size={16} className="text-white" />) :
                                                                                        item.key === "rename" ? <Edit3 size={16} className="text-white" /> :
                                                                                            item.key === "copyLink" ? <Copy size={16} className="text-white" /> :
                                                                                                item.key === "openShare" || item.key === "openShareLink" ? <ExternalLink size={16} className="text-white" /> :
                                                                                                    item.key === "createShare" ? <Link2 size={16} className="text-emerald-400" /> :
                                                                                                        item.key === "revoke" ? <Ban size={16} className="text-amber-400" /> :
                                                                                                            item.key === "delete" ? <Trash2 size={16} className="text-red-400" /> :
                                                                                                                null
                                                                            }
                                                                            className={`h-9 ${item.key === "delete" ? "text-red-400" : item.key === "revoke" ? "text-amber-400" : item.key === "createShare" ? "text-emerald-400" : "text-white"}`}
                                                                            color={item.key === "delete" ? "danger" : "default"}
                                                                        >
                                                                            {item.label}
                                                                        </DropdownItem>
                                                                    )}
                                                                </DropdownMenu>
                                                            </Dropdown>
                                                        </CardHeader>
                                                        <CardBody className="pt-2" onClick={() => handleViewDetails(file)}>
                                                            <div className="space-y-3">
                                                                {/* Status Chips */}
                                                                <div className="flex flex-wrap gap-2">
                                                                    {file.revoked && (
                                                                        <Chip
                                                                            startContent={<Ban size={14} className="text-white" />}
                                                                            className="pl-3 items-center text-sm text-white h-8 bg-amber-600"
                                                                        >
                                                                            已撤銷
                                                                        </Chip>
                                                                    )}
                                                                    {file.status === "expired" && !file.revoked && (
                                                                        <Chip
                                                                            startContent={<ClockFading size={14} className="text-white" />}
                                                                            className="pl-3 items-center text-sm text-white h-8 bg-gray-600"
                                                                        >
                                                                            已過期
                                                                        </Chip>
                                                                    )}
                                                                    {file.shareMode === "public" || !file.shareMode ? (
                                                                        <Chip
                                                                            startContent={<LockOpen size={14} className="text-white" />}
                                                                            className="pl-3 items-center text-sm text-white h-8 bg-emerald-600"
                                                                        >
                                                                            未限制
                                                                        </Chip>
                                                                    ) : (
                                                                        <Chip
                                                                            startContent={<Lock size={14} className="text-white" />}
                                                                            className="pl-3 items-center text-sm text-white h-8 bg-blue-600"
                                                                        >
                                                                            {file.shareMode === "device" ? "裝置綁定" :
                                                                                file.shareMode === "account" ? "帳號綁定" :
                                                                                    file.shareMode === "pin" ? "密碼鎖定" : "已鎖定"}
                                                                        </Chip>
                                                                    )}
                                                                </div>

                                                                {/* Shared With / Owner */}
                                                                {activeTab === "myFiles" &&
                                                                    file.sharedWith && (
                                                                        <div className="flex items-center gap-2">
                                                                            <Share2
                                                                                size={14}
                                                                                className="text-gray-400"
                                                                            />
                                                                            <span className="text-sm text-gray-300">
                                                                                分享給{" "}
                                                                                {file.sharedWith.length}{" "}
                                                                                位使用者
                                                                            </span>
                                                                        </div>
                                                                    )}

                                                                {activeTab === "sharedWithMe" && file.ownerEmail && (
                                                                    <div className="flex items-center gap-2">
                                                                        <Users size={14} className="text-gray-400" />
                                                                        <span className="text-sm text-gray-300 truncate">
                                                                            來自 {file.ownerEmail}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {/* Expiry Date */}
                                                                <div className="flex items-center gap-2">
                                                                    <Calendar
                                                                        size={14}
                                                                        className="text-gray-400"
                                                                    />
                                                                    <span className="text-sm text-gray-300">
                                                                        {file.revoked
                                                                            ? file.revokedDate
                                                                                ? `已於 ${file.revokedDate} 撤銷`
                                                                                : "已於未知時間撤銷"
                                                                            : file.status === "expired"
                                                                                ? `已於 ${file.expiryDate} 過期`
                                                                                : `有效至 ${file.expiryDate}`}
                                                                    </span>
                                                                </div>

                                                                {/* Stats */}
                                                                <div className="flex items-center gap-4 pt-2 border-t border-white/10">
                                                                    <div className="flex items-center gap-2">
                                                                        <Eye
                                                                            size={14}
                                                                            className="text-gray-400"
                                                                        />
                                                                        <span className="text-sm text-gray-300">
                                                                            {file.views} 次查看
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Download
                                                                            size={14}
                                                                            className="text-gray-400"
                                                                        />
                                                                        <span className="text-sm text-gray-300">
                                                                            <span
                                                                                ref={(el) => {
                                                                                    if (el) cardDownloadCountRefs.current.set(file.id, el);
                                                                                }}
                                                                                className="inline-block"
                                                                            >
                                                                                {file.downloads}
                                                                            </span>
                                                                            {file.maxDownloads && file.maxDownloads > 0 ? (
                                                                                <>
                                                                                    {" 次下載 · 剩下 "}
                                                                                    <span
                                                                                        ref={(el) => {
                                                                                            if (el) cardRemainingCountRefs.current.set(file.id, el);
                                                                                        }}
                                                                                        className="inline-block"
                                                                                    >
                                                                                        {file.remainingDownloads}
                                                                                    </span>
                                                                                    {` / ${file.maxDownloads} 次`}
                                                                                </>
                                                                            ) : (
                                                                                " 次下載"
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                </PopoverTrigger>
                                                <PopoverContent>
                                                    <div className="px-3 py-2">
                                                        <div className="flex items-center gap-2">
                                                            {fileActionFeedback.type === 'success' ? (
                                                                <Check size={20} className="text-white" />
                                                            ) : (
                                                                <AlertTriangle size={20} className="text-white" />
                                                            )}
                                                            <span className="text-base text-white font-medium">{fileActionFeedback.message}</span>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </DashboardContentTransition>

            {/* Upload Modal (create share link) */}
            <UploadFiles
                isOpen={isUploadModalOpen}
                onClose={() => {
                    setIsUploadModalOpen(false);
                    setFileToCreateShare(null);
                }}
                onSuccess={() => {
                    fetchFiles(activeTab);
                    setFileToCreateShare(null);
                }}
                existingFile={fileToCreateShare ? {
                    fileId: fileToCreateShare.id,
                    displayName: fileToCreateShare.name,
                } : undefined}
            />

            {/* File Detail Modal */}
            <CustomModal
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedFile(null);
                    setFileDetail(null);
                    setDetailModalFeedback({ message: '', type: 'success', isOpen: false });
                }}
                size="lg"
                classNames={{
                    base: "max-w-md",
                }}
            >
                <CustomModalContent>
                    {() => (
                        <>
                            <CustomModalHeader>
                                檔案詳情
                            </CustomModalHeader>
                            <CustomModalBody>
                                <div ref={detailModalBodyRef}>
                                    {isLoadingDetail ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex justify-center py-8"
                                        >
                                            <Spinner size="lg" color="white" />
                                        </motion.div>
                                    ) : fileDetail ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                                            className="space-y-4"
                                        >
                                            {/* File Info */}
                                            <div className="flex items-start gap-4">
                                                <div className={`p-4 rounded-xl ${getFileIconBgColor(fileDetail.contentType)}`}>
                                                    {getFileIcon(fileDetail.contentType, "w-8 h-8")}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-white font-semibold text-base truncate" title={fileDetail.name}>{truncateFileName(fileDetail.name, 25)}</h4>
                                                    <p className="text-gray-400 text-sm truncate" title={fileDetail.originalName}>{truncateFileName(fileDetail.originalName, 30)}</p>
                                                    <p className="text-gray-400 text-sm">{formatBytes(fileDetail.size)}</p>
                                                </div>
                                            </div>

                                            {/* Recipients Button */}
                                            {fileDetail.isOwner && fileDetail.recipients.length > 0 && (
                                                <CustomButton
                                                    variant="blur"
                                                    startContent={<Users size={16} className="text-blue-300" />}
                                                    onPress={() => setIsRecipientsModalOpen(true)}
                                                    className="w-full justify-start bg-white/5 hover:bg-white/10"
                                                >
                                                    <span className="text-gray-300">已分享給 {fileDetail.recipients.length} 位收件者</span>
                                                </CustomButton>
                                            )}

                                            {/* Create Share Link Button - show when no share link exists and not expired */}
                                            {fileDetail.isOwner && selectedFile && !selectedFile.shareId && selectedFile.status !== "expired" && (
                                                <CustomButton
                                                    variant="blur"
                                                    startContent={<Link2 size={16} className="text-emerald-400" />}
                                                    onPress={() => {
                                                        setFileToCreateShare(selectedFile);
                                                        setIsDetailModalOpen(false);
                                                        setIsUploadModalOpen(true);
                                                    }}
                                                    className="w-full justify-start bg-white/5 hover:bg-white/10"
                                                >
                                                    <span className="text-emerald-400">建立分享連結</span>
                                                </CustomButton>
                                            )}

                                            {/* Details Grid */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white/5 rounded-xl p-2 border-2 border-white/20">
                                                    <p className="text-gray-400 text-sm mb-1 ml-1">分享模式</p>
                                                    <div className="flex items-center gap-2 ml-1 tracking-widest">
                                                        {fileDetail.shareMode === "public" || !fileDetail.shareMode ? (
                                                            <>
                                                                <LockOpen size={14} className="text-emerald-400" />
                                                                <span className="text-white">未限制</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Lock size={14} className="text-blue-400" />
                                                                <span className="text-white">
                                                                    {fileDetail.shareMode === "device" ? "裝置綁定" :
                                                                        fileDetail.shareMode === "account" ? "帳號綁定" :
                                                                            fileDetail.shareMode === "pin" ? "密碼鎖定" : "已鎖定"}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="bg-white/5 rounded-xl p-2 border-2 border-white/20">
                                                    <p className="text-gray-400 text-sm mb-1 ml-1">下載限制</p>
                                                    <p className="text-white ml-1 tracking-widest">
                                                        {fileDetail.maxDownloads > 0 ? (
                                                            <>
                                                                <span ref={modalRemainingCountRef} className="inline-block">{fileDetail.remainingDownloads}</span>
                                                                {` / ${fileDetail.maxDownloads}`}
                                                            </>
                                                        ) : (
                                                            "無限制"
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="bg-white/5 rounded-xl p-2 border-2 border-white/20">
                                                    <p className="text-gray-400 text-sm mb-1 ml-1">建立時間</p>
                                                    <div className="text-white ml-1 tracking-normal">
                                                        {fileDetail.createdAt ? (
                                                            <>
                                                                <p>{new Date(fileDetail.createdAt).toLocaleDateString("zh-TW")} {new Date(fileDetail.createdAt).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}</p>
                                                            </>
                                                        ) : (
                                                            <p>-</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="bg-white/5 rounded-xl p-2 border-2 border-white/20">
                                                    <p className="text-gray-400 text-sm mb-1 ml-1">到期時間</p>
                                                    <div className="text-white ml-1 tracking-normal">
                                                        {fileDetail.expiresAt ? (
                                                            <>
                                                                <p>{new Date(fileDetail.expiresAt).toLocaleDateString("zh-TW")} {new Date(fileDetail.expiresAt).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}</p>
                                                            </>
                                                        ) : (
                                                            <p>-</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="bg-white/5 rounded-xl p-2 border-2 border-white/20">
                                                    <p className="text-gray-400 text-sm mb-1 ml-1">查看次數</p>
                                                    <p className="text-white ml-1 tracking-widest">{fileDetail.views}</p>
                                                </div>
                                                <div className="bg-white/5 rounded-xl p-2 border-2 border-white/20">
                                                    <p className="text-gray-400 text-sm mb-1 ml-1">下載次數</p>
                                                    <p className="text-white ml-1 tracking-widest">
                                                        <span ref={modalDownloadCountRef} className="inline-block">{fileDetail.downloads}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Share Link */}
                                            {fileDetail.isOwner && fileDetail.shareInfo && !fileDetail.revoked && fileDetail.expiresAt && new Date(fileDetail.expiresAt) > new Date() && (
                                                <div className="bg-white/5 rounded-xl p-2 border-2 border-white/20">
                                                    <p className="text-gray-400 text-sm mb-1 ml-1">分享代碼</p>
                                                    <div className="flex items-center gap-2 ml-1">
                                                        <Link2 size={14} className="text-blue-400 flex-shrink-0" />
                                                        <code className="flex-1 text-sm text-blue-400 bg-black/30 rounded px-2 py-1 truncate">
                                                            {fileDetail.shareInfo.shareUrl.split('/').pop()}
                                                        </code>
                                                        <Popover
                                                            isOpen={detailModalFeedback.isOpen}
                                                            placement="top"
                                                            showArrow={true}
                                                            offset={8}
                                                            classNames={{
                                                                base: [
                                                                    detailModalFeedback.type === 'success' ? 'before:bg-emerald-700' : 'before:bg-rose-800',
                                                                ],
                                                                content: [
                                                                    detailModalFeedback.type === 'success' ? 'bg-emerald-600 border-emerald-700' : 'bg-rose-500 border-rose-800',
                                                                    "border-2",
                                                                ].join(" "),
                                                            }}
                                                        >
                                                            <PopoverTrigger>
                                                                <div>
                                                                    <Tooltip content="複製分享代碼" size="md" shadow="lg" classNames={{ content: "bg-neutral-700 text-white border border-white/30 text-sm" }}>
                                                                        <Button
                                                                            isIconOnly
                                                                            size="sm"
                                                                            variant="flat"
                                                                            className="bg-white/10"
                                                                            onPress={() => handleCopyDetailShareLink(fileDetail.shareInfo!.shareUrl.split('/').pop() || '')}
                                                                        >
                                                                            <Copy size={16} className="text-white" />
                                                                        </Button>
                                                                    </Tooltip>
                                                                </div>
                                                            </PopoverTrigger>
                                                            <PopoverContent>
                                                                <div className="px-3 py-2">
                                                                    <div className="flex items-center gap-2">
                                                                        {detailModalFeedback.type === 'success' ? (
                                                                            <Check size={20} className="text-white" />
                                                                        ) : (
                                                                            <AlertTriangle size={20} className="text-white" />
                                                                        )}
                                                                        <span className="text-base text-white font-medium">{detailModalFeedback.message}</span>
                                                                    </div>
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                        <Tooltip content="開啟分享頁面" size="md" shadow="lg" classNames={{ content: "bg-neutral-700 text-white border border-white/30 text-sm" }}>
                                                            <Button
                                                                isIconOnly
                                                                size="sm"
                                                                variant="flat"
                                                                className="bg-white/10"
                                                                onPress={() => {
                                                                    const shareId = fileDetail.shareInfo!.shareUrl.split('/').pop();
                                                                    window.open(`${window.location.origin}/share/${shareId}`, "_blank");
                                                                }}
                                                            >
                                                                <ExternalLink size={16} className="text-white" />
                                                            </Button>
                                                        </Tooltip>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-gray-400 text-center py-8 text-xl flex flex-col items-center gap-2"
                                        >
                                            <CircleAlert size={28} /> 無法載入檔案詳情
                                        </motion.p>
                                    )}
                                </div>
                            </CustomModalBody>
                            <CustomModalFooter>
                                <CustomButton
                                    variant="blur"
                                    onPress={() => {
                                        setIsDetailModalOpen(false);
                                        setSelectedFile(null);
                                        setFileDetail(null);
                                        setDetailModalFeedback({ message: '', type: 'success', isOpen: false });
                                    }}
                                    className="text-gray-300"
                                >
                                    關閉
                                </CustomButton>
                                {selectedFile && (
                                    <CustomButton
                                        variant="blur"
                                        startContent={<Download size={16} />}
                                        isDisabled={downloadingFileId === selectedFile.id || selectedFile.status === "expired"}
                                        onPress={() => {
                                            handleDownload(selectedFile, true);
                                        }}
                                        className="text-blue-400 border-blue-500/50 border-2 text-base"
                                    >
                                        下載
                                    </CustomButton>
                                )}
                            </CustomModalFooter>
                        </>
                    )}
                </CustomModalContent>
            </CustomModal>

            {/* Delete Confirmation Modal */}
            <CustomModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setFileToDelete(null);
                }}
            >
                <CustomModalContent>
                    {() => (
                        <>
                            <CustomModalHeader>
                                <AlertTriangle className="text-red-400 flex-shrink-0 pt-4" size={56} />
                                <div className="text-red-400 pt-2">刪除檔案</div>
                            </CustomModalHeader>
                            <CustomModalBody className="items-center text-center">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-2"
                                >
                                    <p className="text-gray-300 text-xl">
                                        你確定要刪除 <span className="text-white font-semibold">{truncateFileName(fileToDelete?.name || '', 30)}</span> 嗎？
                                    </p>
                                    <p className="text-gray-400 text-base">
                                        操作無法復原，相關分享連結也將失效。
                                    </p>
                                </motion.div>
                            </CustomModalBody>
                            <CustomModalFooter>
                                <CustomButton
                                    variant="blur"
                                    onPress={() => {
                                        setIsDeleteModalOpen(false);
                                        setFileToDelete(null);
                                    }}
                                    className="text-gray-300"
                                >
                                    取消
                                </CustomButton>
                                <CustomButton
                                    variant="blur"
                                    isLoading={isDeleting}
                                    onPress={handleDelete}
                                    className="text-red-400 border-red-500/50 border-2"
                                    startContent={
                                        !isDeleting && <Trash2 size={18} className="flex-shrink-0" />
                                    }
                                >
                                    確認刪除
                                </CustomButton>
                            </CustomModalFooter>
                        </>
                    )}
                </CustomModalContent>
            </CustomModal>

            {/* Rename Modal */}
            <CustomModal
                isOpen={isRenameModalOpen}
                onClose={() => {
                    setIsRenameModalOpen(false);
                    setFileToRename(null);
                }}
            >
                <CustomModalContent>
                    {() => (
                        <>
                            <CustomModalHeader>
                                重新命名
                            </CustomModalHeader>
                            <CustomModalBody>
                                <div ref={renameModalBodyRef}>
                                    <CustomInput
                                        ref={renameInputRef}
                                        label="檔案名稱"
                                        defaultValue={fileToRename?.name || ''}
                                    />
                                </div>
                            </CustomModalBody>
                            <CustomModalFooter>
                                <CustomButton
                                    variant="blur"
                                    onPress={() => {
                                        setIsRenameModalOpen(false);
                                        setFileToRename(null);
                                    }}
                                    className="text-gray-300"
                                >
                                    取消
                                </CustomButton>
                                <CustomButton
                                    variant="blur"
                                    isLoading={isRenaming}
                                    startContent={!isRenaming && <Check size={18} />}
                                    onPress={handleRename}
                                    className="text-blue-400 border-blue-500/50 border-2 text-base"
                                >
                                    確認
                                </CustomButton>
                            </CustomModalFooter>
                        </>
                    )}
                </CustomModalContent>
            </CustomModal>

            {/* Recipients Modal */}
            <CustomModal
                isOpen={isRecipientsModalOpen}
                onClose={() => setIsRecipientsModalOpen(false)}
            >
                <CustomModalContent>
                    {() => (
                        <>
                            <CustomModalHeader>
                                收件者清單
                            </CustomModalHeader>
                            <CustomModalBody>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-3"
                                >
                                    <p className="text-gray-400 text-base">
                                        此檔案已分享給以下 {fileDetail?.recipients.length || 0} 位使用者：
                                    </p>
                                    <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                                        {fileDetail?.recipients.map((recipient) => (
                                            <Chip
                                                key={recipient.email}
                                                size="lg"
                                                avatar={
                                                    <Avatar
                                                        name={recipient.displayName || recipient.email}
                                                        size="sm"
                                                        src={recipient.photoURL || undefined}
                                                    />
                                                }
                                                className=" bg-blue-500/20 text-blue-300"
                                            >
                                                {recipient.email}
                                            </Chip>
                                        ))}
                                    </div>
                                </motion.div>
                            </CustomModalBody>
                            <CustomModalFooter>
                                <CustomButton
                                    variant="blur"
                                    onPress={() => setIsRecipientsModalOpen(false)}
                                    className="text-gray-300"
                                >
                                    關閉
                                </CustomButton>
                            </CustomModalFooter>
                        </>
                    )}
                </CustomModalContent>
            </CustomModal>

            {/* Fake elements for logout animation */}
            <div
                ref={fakeMainRef}
                className="fixed top-0 left-0 right-0 bottom-0 bg-gradient-to-tr from-indigo-900 from-25% to-sky-800 rounded-b-5xl border-b-2 border-b-gray-500 shadow-2xl pointer-events-none z-50 -translate-y-[100vh]"
            />
            <div
                ref={fakeFooterRef}
                className="fixed bottom-0 left-0 right-0 px-6 py-5 bg-neutral-800 flex justify-center md:justify-start flex-shrink-0 pointer-events-none z-40 translate-y-full"
            >
                <p className="text-center md:text-left px-0 md:px-8 text-gray-300 whitespace-nowrap">
                    © 2025{" "}
                    <span className=" text-blue-500 font-bold">
                        <NextLink
                            href="/"
                            className="hover:underline"
                            prefetch={false}
                        >
                            Share Lock
                        </NextLink>
                    </span>
                    &nbsp;.&nbsp;&nbsp;&nbsp;All Rights Reserved.
                </p>
            </div>
        </div>
    );
}
