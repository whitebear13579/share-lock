"use client";
import React, { useEffect, useState, useRef, useCallback, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { useAuth } from "@/utils/authProvider";
import { Button } from "@heroui/button";
import { Cog, Folder, House, LogOut, Star, FileText, ArrowRight, Share2, Check, Lock, X, ClockFading, LockOpen, ExternalLink, BellRing, Trash, ArrowUpRight, ChartPie, MessageCircleQuestionMark, Download, AlertCircle, File, Image as ImageIcon, FileSpreadsheet, Presentation, CircleAlert, Link2, Copy, SquarePlay, AudioLinesIcon, FileArchive, CodeIcon, Users, AlertTriangle, Dot, ChevronLeft } from "lucide-react";
import { Chip, Progress, Spinner, Navbar, NavbarBrand, NavbarContent, NavbarMenuToggle, NavbarMenu, NavbarMenuItem, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar, Link, Tooltip, Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import { Image } from "@heroui/react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Spacer } from "@heroui/spacer";
import { Divider } from "@heroui/react";
import { IoAlertOutline } from "react-icons/io5";
import DashboardNavigation from "@/components/dashboardNavigation";
import DashboardContentTransition from "@/components/dashboardContentTransition";
import { CustomDrawer, CustomDrawerContent, CustomDrawerHeader, CustomDrawerBody, CustomDrawerFooter } from "@/components/drawer";
import { CustomModal, CustomModalContent, CustomModalHeader, CustomModalBody, CustomModalFooter } from "@/components/modal";
import CustomButton from "@/components/button";
import { motion, AnimatePresence } from "framer-motion";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { getUserStorageUsage, getStorageStatusColor, formatBytes } from "@/utils/storageQuota";
import { auth } from "@/utils/firebase";

export default function Dashboard() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const router = useRouter();
    const fakeMainRef = useRef<HTMLDivElement>(null);
    const fakeFooterRef = useRef<HTMLDivElement>(null);
    const [storageData, setStorageData] = useState({
        usedBytes: 0,
        quotaBytes: 1024 * 1024 * 1024,
        percentage: 0,
        formattedUsed: "0 B",
        formattedQuota: "1 GB",
    });
    const [isLoadingStorage, setIsLoadingStorage] = useState(true);

    // Share invitations state
    const [shareInvitations, setShareInvitations] = useState<Array<{
        id: string;
        type: string;
        shareId: string;
        fileId: string;
        createdAt: string | null;
        delivered: boolean;
        senderInfo?: {
            displayName: string;
            photoURL: string | null;
            email: string | null;
        };
        fileInfo?: {
            id: string;
            displayName: string;
            size: number;
            contentType: string;
            expiresAt: string | null;
            shareMode: string;
        };
    }>>([]);
    const [isLoadingInvitations, setIsLoadingInvitations] = useState(true);
    const [isShareDrawerOpen, setIsShareDrawerOpen] = useState(false);
    const [respondingInvitationId, setRespondingInvitationId] = useState<string | null>(null);

    // Notifications state
    const [notifications, setNotifications] = useState<Array<{
        id: string;
        type: string;
        message?: string;
        shareId?: string;
        fileId?: string;
        createdAt: string | null;
        delivered: boolean;
        deliveredAt?: string | null;
        senderInfo?: {
            displayName: string;
            photoURL: string | null;
            email: string | null;
        };
        fileInfo?: {
            id: string;
            displayName: string;
            size: number;
            contentType: string;
            expiresAt: string | null;
            shareMode: string;
        };
    }>>([]);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
    const [isNotificationsDrawerOpen, setIsNotificationsDrawerOpen] = useState(false);
    const [deletingNotificationId, setDeletingNotificationId] = useState<string | null>(null);

    // Recent files state
    const [recentFiles, setRecentFiles] = useState<Array<{
        id: string;
        name: string;
        size: number;
        contentType: string;
        lastAccessedAt: string | null;
        accessType: string;
    }>>([]);
    const [isLoadingRecentFiles, setIsLoadingRecentFiles] = useState(true);

    // File detail modal state
    const [isFileDetailModalOpen, setIsFileDetailModalOpen] = useState(false);
    const [selectedRecentFile, setSelectedRecentFile] = useState<{
        id: string;
        name: string;
        size: number;
        contentType: string;
        lastAccessedAt: string | null;
        accessType: string;
    } | null>(null);
    const [fileDetail, setFileDetail] = useState<{
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
    } | null>(null);
    const [isLoadingFileDetail, setIsLoadingFileDetail] = useState(false);
    const [isDownloadingFile, setIsDownloadingFile] = useState(false);
    const [isRecipientsModalOpen, setIsRecipientsModalOpen] = useState(false);
    const [detailModalFeedback, setDetailModalFeedback] = useState<{
        message: string;
        type: 'success' | 'error';
        isOpen: boolean;
    }>({ message: '', type: 'success', isOpen: false });

    // Refs for modal height animation
    const detailModalBodyRef = useRef<HTMLDivElement>(null);
    const detailPrevHeightRef = useRef<number | null>(null);
    const detailIsAnimatingRef = useRef(false);

    const { user, loading, logout } = useAuth();

    // Fetch share invitations
    const fetchShareInvitations = async () => {
        if (!user) return;

        setIsLoadingInvitations(true);
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const response = await fetch("/api/notifications/list", {
                headers: {
                    "Authorization": `Bearer ${idToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                // Filter only share-invite type notifications that haven't been delivered
                const invitations = data.notifications?.filter(
                    (n: { type: string; delivered: boolean }) => n.type === "share-invite" && !n.delivered
                ) || [];
                setShareInvitations(invitations);
            }
        } catch (error) {
            console.error("Error fetching share invitations:", error);
        } finally {
            setIsLoadingInvitations(false);
        }
    };

    // Fetch all notifications
    const fetchNotifications = async () => {
        if (!user) return;

        setIsLoadingNotifications(true);
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const response = await fetch("/api/notifications/list", {
                headers: {
                    "Authorization": `Bearer ${idToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setIsLoadingNotifications(false);
        }
    };

    // Fetch recent files
    const fetchRecentFiles = async () => {
        if (!user) return;

        setIsLoadingRecentFiles(true);
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const response = await fetch("/api/files/recent", {
                headers: {
                    "Authorization": `Bearer ${idToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setRecentFiles(data.files || []);
            }
        } catch (error) {
            console.error("Error fetching recent files:", error);
        } finally {
            setIsLoadingRecentFiles(false);
        }
    };

    // Fetch file detail
    const fetchFileDetail = useCallback(async (fileId: string) => {
        if (!user) return;

        setIsLoadingFileDetail(true);
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const response = await fetch(`/api/files/detail?fileId=${fileId}`, {
                headers: {
                    "Authorization": `Bearer ${idToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setFileDetail(data.file);
            }
        } catch (error) {
            console.error("Error fetching file detail:", error);
        } finally {
            setIsLoadingFileDetail(false);
        }
    }, [user]);

    // Handle recent file click
    const handleRecentFileClick = (file: typeof recentFiles[0]) => {
        setSelectedRecentFile(file);
        setIsFileDetailModalOpen(true);
        fetchFileDetail(file.id);
    };

    // Handle download from modal
    const handleDownloadFromModal = async () => {
        if (!user || !selectedRecentFile) return;

        setIsDownloadingFile(true);
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const response = await fetch("/api/files/download", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${idToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ fileId: selectedRecentFile.id }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.requiresVerification) {
                    // Close modal and redirect to share page for verification
                    setIsFileDetailModalOpen(false);
                    router.push(data.redirectUrl);
                } else if (data.downloadUrl) {
                    // Start download
                    const link = document.createElement("a");
                    link.href = data.downloadUrl;
                    link.download = selectedRecentFile.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            } else {
                setDetailModalFeedback({ message: data.error || '下載失敗', type: 'error', isOpen: true });
                setTimeout(() => setDetailModalFeedback({ message: '', type: 'success', isOpen: false }), 2500);
            }
        } catch (error) {
            console.error("Error downloading file:", error);
            setDetailModalFeedback({ message: '下載失敗', type: 'error', isOpen: true });
            setTimeout(() => setDetailModalFeedback({ message: '', type: 'success', isOpen: false }), 2500);
        } finally {
            setIsDownloadingFile(false);
        }
    };

    // Handle copy share code
    const handleCopyShareCode = async (shareCode: string) => {
        try {
            await navigator.clipboard.writeText(shareCode);
            setDetailModalFeedback({ message: '已複製分享代碼', type: 'success', isOpen: true });
            setTimeout(() => setDetailModalFeedback({ message: '', type: 'success', isOpen: false }), 2500);
        } catch (error) {
            console.error("Error copying share code:", error);
            setDetailModalFeedback({ message: '複製失敗', type: 'error', isOpen: true });
            setTimeout(() => setDetailModalFeedback({ message: '', type: 'success', isOpen: false }), 2500);
        }
    };

    // Respond to share invitation
    const respondToInvitation = async (notificationId: string, shareId: string, action: "accept" | "reject") => {
        if (!user) return;

        // Immediately remove from local state to trigger exit animation (optimistic update)
        setShareInvitations(prev => prev.filter(inv => inv.id !== notificationId));

        try {
            const idToken = await auth.currentUser?.getIdToken();
            const response = await fetch("/api/notifications/respond", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${idToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ notificationId, shareId, action }),
            });

            if (!response.ok) {
                // If failed, refresh to restore the item
                await fetchShareInvitations();
            }
        } catch (error) {
            console.error("Error responding to invitation:", error);
            // If error, refresh to restore the item
            await fetchShareInvitations();
        }
    };

    // Delete notification
    const deleteNotification = async (notificationId: string) => {
        if (!user) return;

        // Immediately remove from local state to trigger exit animation (optimistic update)
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));

        try {
            const idToken = await auth.currentUser?.getIdToken();
            const response = await fetch(`/api/notifications/delete?notificationId=${notificationId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${idToken}`,
                },
            });

            if (!response.ok) {
                // If failed, refresh to restore the item
                await fetchNotifications();
            }
        } catch (error) {
            console.error("Error deleting notification:", error);
            // If error, refresh to restore the item
            await fetchNotifications();
        }
    };

    // Get file icon based on content type
    const getFileIcon = (contentType?: string, className?: string) => {
        if (!contentType) return <File className={className || "text-blue-400"} />;

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
        if (isExpired) return "bg-gray-500/20";
        if (!contentType) return "bg-blue-500/20";

        if (contentType.startsWith("image/")) return "bg-pink-500/20";
        if (contentType.startsWith("video/")) return "bg-purple-500/20";
        if (contentType.startsWith("audio/")) return "bg-green-500/20";
        if (contentType.includes("zip") || contentType.includes("rar") || contentType.includes("tar") || contentType.includes("7z") || contentType.includes("archive") || contentType.includes("compressed")) return "bg-amber-500/20";
        if (contentType.includes("javascript") || contentType.includes("typescript") || contentType.includes("python") || contentType.includes("java") || contentType.includes("html") || contentType.includes("css") || contentType.includes("json") || contentType.includes("xml") || contentType.includes("text/x-")) return "bg-cyan-500/20";
        if (contentType.includes("spreadsheet") || contentType.includes("excel") || contentType.includes("csv")) return "bg-emerald-500/20";
        if (contentType.includes("presentation") || contentType.includes("powerpoint")) return "bg-orange-500/20";
        if (contentType.includes("pdf") || contentType.includes("document") || contentType.includes("word") || contentType.includes("text/plain")) return "bg-blue-500/20";

        return "bg-blue-500/20";
    };

    // Truncate file name
    const truncateFileName = (name: string, maxLength: number = 15): string => {
        if (name.length <= maxLength) return name;
        const keepLength = Math.floor((maxLength - 3) / 2);
        return `${name.slice(0, keepLength)}...${name.slice(-keepLength)}`;
    };

    // Get notification icon based on type
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "share-invite":
                return <Share2 className="text-blue-400" />;
            case "share-accepted":
                return <Check className="text-emerald-400" />;
            case "share-rejected":
                return <X className="text-rose-400" />;
            case "download-complete":
                return <Download className="text-green-400" />;
            case "share-expired":
                return <ClockFading className="text-orange-400" />;
            default:
                return <AlertCircle className="text-gray-400" />;
        }
    };

    // Get notification icon bg color
    const getNotificationIconBg = (type: string): string => {
        switch (type) {
            case "share-invite":
                return "bg-blue-500/25";
            case "share-accepted":
                return "bg-emerald-500/25";
            case "share-rejected":
                return "bg-rose-500/25";
            case "download-complete":
                return "bg-emerald-500/25";
            case "share-expired":
                return "bg-orange-500/25";
            default:
                return "bg-gray-500/25";
        }
    };

    // Get notification type title
    const getNotificationTitle = (type: string): string => {
        switch (type) {
            case "share-invite":
                return "分享邀請";
            case "share-accepted":
                return "邀請已接受";
            case "share-rejected":
                return "邀請已拒絕";
            case "download-complete":
                return "下載完成";
            case "share-expired":
                return "分享過期";
            default:
                return "通知";
        }
    };

    // Format relative time
    const formatRelativeTime = (dateString: string | null): string => {
        if (!dateString) return "未知時間";

        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "剛剛";
        if (diffMins < 60) return `${diffMins} 分鐘前`;
        if (diffHours < 24) return `${diffHours} 小時前`;
        if (diffDays < 7) return `${diffDays} 天前`;

        return date.toLocaleDateString("zh-TW");
    };

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

    // Fetch storage usage when user is available
    useEffect(() => {
        const fetchStorageUsage = async () => {
            if (!user) return;

            setIsLoadingStorage(true);
            try {
                const usage = await getUserStorageUsage();
                setStorageData(usage);
            } catch (error) {
                console.error("Failed to fetch storage usage:", error);
            } finally {
                setIsLoadingStorage(false);
            }
        };

        fetchStorageUsage();
    }, [user]);

    // Fetch all data when user is available
    useEffect(() => {
        if (user) {
            fetchShareInvitations();
            fetchNotifications();
            fetchRecentFiles();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Modal height animation - capture initial height
    useLayoutEffect(() => {
        if (!isFileDetailModalOpen) {
            detailPrevHeightRef.current = null;
            return;
        }

        const dialogElements = document.querySelectorAll('[role="dialog"]');
        const dialogElement = dialogElements[dialogElements.length - 1] as HTMLElement;

        if (dialogElement && detailPrevHeightRef.current === null) {
            detailPrevHeightRef.current = dialogElement.getBoundingClientRect().height;
        }
    }, [isFileDetailModalOpen]);

    // Modal height animation - animate height changes
    useLayoutEffect(() => {
        if (!isFileDetailModalOpen || detailIsAnimatingRef.current) return;

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
    }, [isLoadingFileDetail, fileDetail, isFileDetailModalOpen]);

    const welcomeString = ["🌅 早安，歡迎回來！", "☀️ 午安，歡迎回來！", "🌇 晚安，近來好嗎？", "🌙 夜深了，好好休息吧！"]

    const getWelcomeMessage = () => {
        const currentHour = new Date().getHours();
        if (currentHour >= 5 && currentHour < 12) {
            return welcomeString[0];
        } else if (currentHour >= 12 && currentHour < 17) {
            return welcomeString[1];
        } else if (currentHour >= 17 && currentHour < 23) {
            return welcomeString[2];
        } else {
            return welcomeString[3];
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-linear-205 from-slate-700  to-neutral-800 to-55% flex items-center justify-center">
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
        router.push("/login");
        return;
    }

    return (
        <div className="min-h-screen bg-linear-205 from-slate-700 to-neutral-800 to-55%">
            {/* wide device naviBar */}
            {!isMobile && (
                <DashboardNavigation loading={loading} onLogout={handleLogout} />
            )}

            {/* mobile device naviBar */}
            {isMobile && (
                <Navbar
                    isMenuOpen={isMenuOpen}
                    onMenuOpenChange={setIsMenuOpen}
                    className="bg-black/40 transition-all"
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
                            <p className="font-bold text-xl text-white">資訊主頁</p>
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
                                    base: "data-[hover=true]:bg-white/15",
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
                            <NextLink href="/dashboard" className="flex items-center gap-3 p-3 rounded-xl bg-white/20 text-blue-400">
                                <House size={20} />
                                <span className="text-lg font-medium">資訊主頁</span>
                            </NextLink>
                        </NavbarMenuItem>
                        <NavbarMenuItem>
                            <NextLink href="/dashboard/files" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/20 text-white transition-colors">
                                <Folder size={20} />
                                <span className="text-lg">我的檔案</span>
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

            <DashboardContentTransition>
                <div className={isMobile ? "pt-20 px-4" : "pt-36 px-13"}>
                    <h1 className={`font-bold text-white mb-2 ${isMobile ? "text-2xl" : "text-4xl"}`}>
                        {getWelcomeMessage()}
                    </h1>
                    <p className={`text-gray-300 ${isMobile ? "text-base" : "text-lg"}`}>
                        {isMobile
                            ? `${user.displayName}，歡迎回來 Share Lock！`
                            : `${user.displayName}，歡迎回來 Share Lock。\u00A0\u00A0\u00A0這裡是專屬於您的資訊主頁，您可以在這裡取得最新動態與重要資訊。`
                        }
                    </p>
                </div>

                <div className={isMobile ? "px-4 py-6 pb-16" : "px-12 py-8 pb-16"}>
                    {/* wide device layout */}
                    {!isMobile && (
                        <>
                            {/* 第一列 */}
                            <div className="flex mb-6">
                                <Card
                                    className=" bg-white/10 backdrop-blur-sm border-white/20 min-h-full h-[212px] max-w-[200px]"
                                    shadow="lg"
                                    isPressable
                                    isFooterBlurred
                                    onPress={() => router.push("/dashboard/settings")}
                                >
                                    <div className="flex-1 relative" >
                                        <Image
                                            isZoomed
                                            alt="使用者頭像"
                                            src={user.photoURL ? user.photoURL : "/undefined.png"}
                                            className="inset-0 z-0 min-w-[200px] h-full"
                                            removeWrapper
                                        />
                                    </div>
                                    <CardFooter className="absolute bg-white/30 bottom-0 border-t-1 border-zinc-100/50 z-10 justify-between items-center h-14 px-4">
                                        <div className="flex flex-col items-start justify-start" >
                                            <p className="text-xs text-slate-600 font-light">查看你的</p>
                                            <p className="text-sm text-blue-500 font-medium">帳號資訊與設定</p>
                                        </div>
                                        <ArrowRight size={24} className="text-slate-600 flex-shrink-0" />
                                    </CardFooter>
                                </Card>

                                <Spacer x={6} />

                                <Card className="flex-1 bg-white/10 backdrop-blur-sm border-white/20 min-w-[700px] h-[212px]" shadow="lg" >
                                    <CardHeader className="pb-2 pt-6 px-6 flex-row items-center gap-3">
                                        <div className="bg-blue-600/30 p-3 rounded-xl">
                                            <Share2 size={24} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xl text-white">檔案分享</h4>
                                            <p className="text-gray-300 text-sm">咚咚咚，看看有沒有人要分享檔案給你？</p>
                                        </div>
                                        <Button
                                            className="custom-button-trans-override ml-auto bg-white/10 border border-white/30 text-gray-200 shadow-2xl font-medium text-sm"
                                            radius="lg"
                                            startContent={<ExternalLink size={18} />}
                                            onPress={() => setIsShareDrawerOpen(true)}
                                            isDisabled={shareInvitations.length === 0}
                                        >
                                            查看更多
                                        </Button>
                                    </CardHeader>
                                    <CardBody className="px-6 py-4">
                                        <div className="px-4">
                                            {isLoadingInvitations ? (
                                                <div className="flex items-center justify-center py-4">
                                                    <Spinner size="lg" color="default" variant="dots" />
                                                </div>
                                            ) : shareInvitations.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                                    <p className="text-base">沒有分享邀請</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-[auto_4fr_2fr_auto] items-center gap-x-3 gap-y-3">
                                                    <AnimatePresence>
                                                        {shareInvitations.slice(0, 2).map((invitation) => (
                                                            <motion.div
                                                                key={invitation.id}
                                                                layout
                                                                initial={{ opacity: 0, scale: 0.95 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                exit={{ opacity: 0, x: 100, height: 0, marginBottom: 0 }}
                                                                transition={{ duration: 0.3, ease: "easeOut" }}
                                                                className="contents"
                                                            >
                                                                <Avatar
                                                                    src={invitation.senderInfo?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(invitation.senderInfo?.displayName || "User")}&background=random`}
                                                                    size="md"
                                                                />
                                                                <div className="flex min-w-0 flex-col">
                                                                    <p className="text-white text-base font-medium truncate">
                                                                        {invitation.senderInfo?.displayName || "某人"} 想要分享 &ldquo;{invitation.fileInfo?.displayName || "檔案"}&rdquo; 給你
                                                                    </p>
                                                                    <p className="text-sm font-normal flex gap-2 items-center text-gray-400">
                                                                        {invitation.fileInfo?.expiresAt && new Date(invitation.fileInfo.expiresAt) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) ? (
                                                                            <>
                                                                                <IoAlertOutline size={16} className="rounded-full bg-amber-500 p-0.5 text-zinc-900" />
                                                                                即將失效： {new Date(invitation.fileInfo.expiresAt).toLocaleDateString("zh-TW")}
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Check size={16} className="rounded-full bg-emerald-500 p-0.5 text-zinc-900" />
                                                                                {invitation.fileInfo?.expiresAt ? new Date(invitation.fileInfo.expiresAt).toLocaleDateString("zh-TW") : "未知"} 前有效
                                                                            </>
                                                                        )}
                                                                    </p>
                                                                </div>
                                                                <div className="justify-self-center self-center">
                                                                    {invitation.fileInfo?.shareMode === "public" ? (
                                                                        <Chip startContent={<LockOpen size={14} className="text-white" />} className="pl-3 items-center text-sm text-white h-8 bg-emerald-600">
                                                                            未限制
                                                                        </Chip>
                                                                    ) : (
                                                                        <Chip startContent={<Lock size={14} className="text-white" />} className="pl-3 items-center text-sm text-white h-8 bg-blue-600">
                                                                            {invitation.fileInfo?.shareMode === "device" ? "裝置綁定" : invitation.fileInfo?.shareMode === "pin" ? "密碼鎖定" : "帳號綁定"}
                                                                        </Chip>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center justify-end gap-2 self-center">
                                                                    <Button
                                                                        size="sm"
                                                                        radius="full"
                                                                        isIconOnly
                                                                        aria-label="接受"
                                                                        className="custom-button-trans-override bg-emerald-600 text-white h-8 w-8 p-0"
                                                                        isLoading={respondingInvitationId === invitation.id}
                                                                        onPress={() => respondToInvitation(invitation.id, invitation.shareId, "accept")}
                                                                    >
                                                                        {respondingInvitationId !== invitation.id && <Check size={20} />}
                                                                    </Button>
                                                                    <span className="text-sm text-white font-extrabold">/</span>
                                                                    <Button
                                                                        size="sm"
                                                                        radius="full"
                                                                        isIconOnly
                                                                        aria-label="拒絕"
                                                                        className="custom-button-trans-override bg-rose-500 text-white h-8 w-8 p-0"
                                                                        isLoading={respondingInvitationId === invitation.id}
                                                                        onPress={() => respondToInvitation(invitation.id, invitation.shareId, "reject")}
                                                                    >
                                                                        {respondingInvitationId !== invitation.id && <X size={20} />}
                                                                    </Button>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </AnimatePresence>
                                                </div>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>

                                <Spacer x={6} />

                                <Card className="flex-1 bg-white/10 backdrop-blur-sm border-white/20 min-w-[458px] max-w-[600px] h-[212px]" shadow="lg">
                                    <CardHeader className="pb-0 pt-6 px-6 flex-row items-center gap-3">
                                        <div className="bg-purple-500/20 p-3 rounded-xl">
                                            <ChartPie size={24} className="text-purple-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xl text-white">使用狀況</h4>
                                            <p className="text-gray-300 text-sm">查看你的 Share Lock 帳號使用狀況</p>
                                        </div>
                                        <Button
                                            className="custom-button-trans-override ml-auto bg-white/10 border border-white/30 text-gray-200 shadow-2xl font-medium text-sm"
                                            radius="lg"
                                            startContent={<ExternalLink size={18} />}
                                            onPress={() => router.push("/dashboard/files")}
                                        >
                                            瞭解詳情
                                        </Button>
                                    </CardHeader>
                                    <CardBody className="px-6 py-6">
                                        <div className="px-4">
                                            {isLoadingStorage ? (
                                                <div className="flex items-center justify-center py-4">
                                                    <Spinner size="lg" color="default" variant="dots" />
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-2 text-base align-middle text-gray-200 font-medium tracking-wider pb-3">
                                                        {storageData.percentage >= 85 ? (
                                                            <>
                                                                <IoAlertOutline size={24} className="shrink-0 rounded-full bg-amber-500 p-0.5 text-zinc-900" />
                                                                <span className="leading-none">需要注意：可用空間不足 {Math.round(100 - storageData.percentage)}%</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Check size={24} className="shrink-0 rounded-full bg-emerald-500 p-0.5 text-zinc-900" />
                                                                <span className="leading-none">一切正常：可用空間還剩 {Math.round(100 - storageData.percentage)}%</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <Progress
                                                        size="md"
                                                        radius="full"
                                                        showValueLabel
                                                        classNames={{
                                                            indicator: getStorageStatusColor(storageData.percentage).indicator,
                                                            track: "drop-shadow-lg border border-white/30 bg-gray-900/10",
                                                            value: "text-2xl font-medium text-gray-200 tracking-wider leading-none",
                                                            label: "text-gray-300 font-normal text-base relative top-2"
                                                        }}
                                                        label={`${storageData.formattedUsed} / ${storageData.formattedQuota}`}
                                                        value={storageData.percentage}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>

                            {/* 第二列 */}
                            <div className="flex mb-6">
                                <Card className="flex-1 bg-white/10 backdrop-blur-sm border-white/20 min-h-80" shadow="lg">
                                    <CardHeader className="pb-0 pt-6 px-6 flex-row items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-yellow-500/20 p-3 rounded-xl">
                                                <BellRing size={24} className="text-yellow-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-xl text-white">通知中心</h4>
                                                <p className="text-gray-300 text-sm">負責掌管你的重要訊息</p>
                                            </div>
                                        </div>
                                        <Button
                                            className="custom-button-trans-override ml-auto bg-white/10 border border-white/30 text-gray-200 shadow-2xl font-medium text-sm"
                                            radius="lg"
                                            startContent={<ExternalLink size={18} />}
                                            onPress={() => setIsNotificationsDrawerOpen(true)}
                                            isDisabled={notifications.length === 0}
                                        >
                                            查看全部
                                        </Button>
                                    </CardHeader>
                                    <CardBody className="px-6 py-4">
                                        {isLoadingNotifications ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Spinner size="lg" color="default" variant="dots" />
                                            </div>
                                        ) : notifications.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                                                <p className="text-base">沒有通知</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <AnimatePresence>
                                                    {notifications.slice(0, 3).map((notif) => (
                                                        <motion.div
                                                            key={notif.id}
                                                            layout
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, x: 100, height: 0, marginBottom: 0 }}
                                                            transition={{ duration: 0.3, ease: "easeOut" }}
                                                            className="custom-button-trans-override grid grid-cols-[auto_3fr_auto_4fr_auto] items-center gap-x-3 bg-white/10 rounded-2xl shadow-xl px-4 py-3 transition-all duration-200 hover:bg-white/15"
                                                        >
                                                            {notif.type === "share-invite" && notif.senderInfo ? (
                                                                <Avatar
                                                                    src={notif.senderInfo.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(notif.senderInfo.displayName || "User")}&background=random`}
                                                                    size="sm"
                                                                    className="flex-shrink-0"
                                                                />
                                                            ) : (
                                                                <div className={`rounded-xl ${getNotificationIconBg(notif.type)} p-2 h-10 w-10 flex items-center justify-center flex-shrink-0`}>
                                                                    {getNotificationIcon(notif.type)}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="text-base text-gray-200 font-medium">{getNotificationTitle(notif.type)}</p>
                                                                {notif.type === "share-invite" && notif.senderInfo ? (
                                                                    <p className="text-xs text-gray-400 flex flex-row items-center">來自{notif.senderInfo.displayName || "某人"} <Dot /> {formatRelativeTime(notif.createdAt)} </p>
                                                                ) : (
                                                                    <p className="text-xs text-gray-400">{formatRelativeTime(notif.createdAt)}</p>
                                                                )}
                                                            </div>
                                                            <Divider orientation="vertical" className="bg-white/40 h-9 w-0.5 rounded-full mx-2" />
                                                            <div className="text-gray-300 text-base truncate">
                                                                {notif.message || (notif.type === "share-invite" && notif.fileInfo ? `分享了「${notif.fileInfo.displayName || "未知檔案"}」給你` : `檔案 "${notif.fileInfo?.displayName || "未知"}" 的通知`)}
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                isIconOnly
                                                                radius="full"
                                                                className="custom-button-trans-override flex items-center justify-center bg-zinc-400/40 shadow-xl group"
                                                                isLoading={deletingNotificationId === notif.id}
                                                                onPress={() => deleteNotification(notif.id)}
                                                            >
                                                                {deletingNotificationId !== notif.id && <Trash size={16} className="text-neutral-900 cursor-pointer group-hover:text-rose-500 transition-all duration-200" />}
                                                            </Button>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>

                                <Spacer x={6} />

                                <Card className="flex-1 bg-white/10 backdrop-blur-sm border-white/20 h-80" shadow="lg">
                                    <CardHeader className="pb-0 pt-6 px-6 flex-row items-center gap-3">
                                        <div className="bg-blue-500/20 p-3 rounded-xl">
                                            <FileText size={24} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xl text-white">最近使用的檔案</h4>
                                            <p className="text-gray-300 text-sm">快速存取您最近使用的檔案</p>
                                        </div>
                                    </CardHeader>
                                    <CardBody className="px-6 py-4 flex-1 overflow-auto">
                                        {isLoadingRecentFiles ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Spinner size="lg" color="default" variant="dots" />
                                            </div>
                                        ) : recentFiles.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                                                <p className="text-base">沒有最近使用的檔案</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {recentFiles.slice(0, 3).map((file) => (
                                                    <div
                                                        key={file.id}
                                                        className="custom-button-trans-override grid grid-cols-[auto_4fr_2fr_auto] items-center gap-x-3 bg-white/10 rounded-2xl shadow-xl px-4 py-3 hover:bg-white/15 transition-all duration-200 cursor-pointer"
                                                        onClick={() => handleRecentFileClick(file)}
                                                    >
                                                        <div className={`${getFileIconBgColor(file.contentType)} p-2 rounded-lg flex items-center justify-center flex-shrink-0`}>
                                                            {getFileIcon(file.contentType)}
                                                        </div>
                                                        <div className="flex min-w-0 flex-col">
                                                            <p className="text-white text-base font-medium truncate">{file.name}</p>
                                                            <p className="text-xs text-gray-400">
                                                                上次使用是在 {file.lastAccessedAt ? new Date(file.lastAccessedAt).toLocaleString("zh-TW", {
                                                                    year: "numeric",
                                                                    month: "2-digit",
                                                                    day: "2-digit",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit"
                                                                }) : "未知"}
                                                            </p>
                                                        </div>
                                                        <div className="justify-self-center">
                                                            <Chip className="text-xs text-gray-300 bg-gray-700/50">
                                                                {formatBytes(file.size)}
                                                            </Chip>
                                                        </div>
                                                        <ArrowUpRight size={18} className="text-gray-400" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            </div>
                        </>
                    )}

                    {/* mobile device layout */}
                    {isMobile && (
                        <div className="space-y-6 transition-all duration-200">
                            <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                                <CardHeader className="pb-2 pt-4 px-4 flex-row items-center gap-3">
                                    <div className="bg-blue-600/30 p-2 rounded-xl">
                                        <Share2 size={24} className="text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-base text-white">檔案分享</h4>
                                        <p className="text-gray-300 text-xs">看看有沒有人要分享檔案給你？</p>
                                    </div>
                                    <Button
                                        className="custom-button-trans-override bg-white/10 border border-white/30 text-gray-200 shadow-xl font-medium text-xs"
                                        size="sm"
                                        radius="md"
                                        startContent={<ExternalLink size={14} />}
                                        onPress={() => setIsShareDrawerOpen(true)}
                                        isDisabled={shareInvitations.length === 0}
                                    >
                                        查看更多
                                    </Button>
                                </CardHeader>
                                <CardBody className="px-6 py-3">
                                    {isLoadingInvitations ? (
                                        <div className="flex items-center justify-center py-4">
                                            <Spinner size="lg" color="default" variant="dots" />
                                        </div>
                                    ) : shareInvitations.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                            <p className="text-base">沒有分享邀請</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-[auto_3fr_2fr_auto] items-center gap-x-3 gap-y-3">
                                            <AnimatePresence>
                                                {shareInvitations.slice(0, 2).map((invitation) => (
                                                    <motion.div
                                                        key={invitation.id}
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, x: 80, height: 0, marginBottom: 0 }}
                                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                                        className="contents"
                                                    >
                                                        <Avatar
                                                            src={invitation.senderInfo?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(invitation.senderInfo?.displayName || "User")}&background=random`}
                                                            size="sm"
                                                        />
                                                        <div className="flex min-w-0 flex-col">
                                                            <p className="text-white text-sm font-medium truncate">
                                                                {invitation.senderInfo?.displayName || "某人"} 想分享 &quot;{invitation.fileInfo?.displayName || "檔案"}&quot; 給你
                                                            </p>
                                                            <p className="text-xs text-gray-400 flex gap-1 items-center">
                                                                {invitation.fileInfo?.expiresAt && new Date(invitation.fileInfo.expiresAt) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) ? (
                                                                    <>
                                                                        <IoAlertOutline size={12} className="rounded-full bg-amber-500 p-0.5 text-zinc-900" />
                                                                        即將失效：{new Date(invitation.fileInfo.expiresAt).toLocaleDateString("zh-TW")}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Check size={12} className="rounded-full bg-emerald-500 p-0.5 text-zinc-900" />
                                                                        {invitation.fileInfo?.expiresAt ? new Date(invitation.fileInfo.expiresAt).toLocaleDateString("zh-TW") : "未知"} 前有效
                                                                    </>
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="justify-self-center self-center">
                                                            {invitation.fileInfo?.shareMode === "public" ? (
                                                                <Chip startContent={<LockOpen size={12} className="text-white" />} className="pl-2 items-center text-xs text-white h-6 bg-emerald-600">
                                                                    未限制
                                                                </Chip>
                                                            ) : (
                                                                <Chip startContent={<Lock size={12} className="text-white" />} className="pl-2 items-center text-xs text-white h-6 bg-blue-600">
                                                                    {invitation.fileInfo?.shareMode === "device" ? "裝置綁定" : invitation.fileInfo?.shareMode === "pin" ? "密碼鎖定" : "帳號綁定"}
                                                                </Chip>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Button
                                                                size="sm"
                                                                radius="full"
                                                                isIconOnly
                                                                className="custom-button-trans-override bg-emerald-600 text-white h-7 w-7 p-0"
                                                                isLoading={respondingInvitationId === invitation.id}
                                                                onPress={() => respondToInvitation(invitation.id, invitation.shareId, "accept")}
                                                            >
                                                                {respondingInvitationId !== invitation.id && <Check size={16} />}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                radius="full"
                                                                isIconOnly
                                                                className="custom-button-trans-override bg-rose-500 text-white h-7 w-7"
                                                                isLoading={respondingInvitationId === invitation.id}
                                                                onPress={() => respondToInvitation(invitation.id, invitation.shareId, "reject")}
                                                            >
                                                                {respondingInvitationId !== invitation.id && <X size={16} />}
                                                            </Button>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>

                            <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                                <CardHeader className="pb-0 pt-4 px-4 flex-row items-center gap-3">
                                    <div className="bg-purple-500/20 p-2 rounded-xl">
                                        <ChartPie size={24} className="text-purple-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-base text-white">使用狀況</h4>
                                        <p className="text-gray-300 text-xs">查看你的帳號使用狀況</p>
                                    </div>
                                    <Button
                                        className="custom-button-trans-override bg-white/10 border border-white/30 text-gray-200 shadow-xl font-medium text-xs"
                                        size="sm"
                                        radius="md"
                                        startContent={<ExternalLink size={14} />}
                                        onPress={() => router.push("/dashboard/files")}
                                    >
                                        瞭解詳情
                                    </Button>
                                </CardHeader>
                                <CardBody className="px-6 py-6">
                                    {isLoadingStorage ? (
                                        <div className="flex items-center justify-center py-4">
                                            <Spinner size="lg" color="default" variant="dots" />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2 text-sm text-gray-200 font-medium pb-3">
                                                {storageData.percentage >= 85 ? (
                                                    <>
                                                        <IoAlertOutline size={24} className="shrink-0 rounded-full bg-amber-500 p-0.5 text-zinc-900" />
                                                        <span className="leading-none">需要注意：可用空間不足 {Math.round(100 - storageData.percentage)}%</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check size={24} className="shrink-0 rounded-full bg-emerald-500 p-0.5 text-zinc-900" />
                                                        <span className="leading-none">一切正常：可用空間還剩 {Math.round(100 - storageData.percentage)}%</span>
                                                    </>
                                                )}
                                            </div>
                                            <Progress
                                                size="md"
                                                radius="full"
                                                showValueLabel
                                                classNames={{
                                                    indicator: getStorageStatusColor(storageData.percentage).indicator,
                                                    track: "drop-shadow-lg border border-white/30 bg-gray-900/10",
                                                    value: "text-lg font-medium text-gray-200",
                                                    label: "text-gray-300 font-normal text-sm"
                                                }}
                                                label={`${storageData.formattedUsed} / ${storageData.formattedQuota}`}
                                                value={storageData.percentage}
                                            />
                                        </>
                                    )}
                                </CardBody>
                            </Card>

                            <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                                <CardHeader className="pb-0 pt-4 px-4 flex-row items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-yellow-500/20 p-2 rounded-xl">
                                            <BellRing size={24} className="text-yellow-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-base text-white">通知中心</h4>
                                            <p className="text-gray-300 text-xs">負責掌管你的重要訊息</p>
                                        </div>
                                    </div>
                                    <Button
                                        className="custom-button-trans-override bg-white/10 border border-white/30 text-gray-200 shadow-xl font-medium text-xs"
                                        size="sm"
                                        radius="md"
                                        startContent={<ExternalLink size={14} />}
                                        onPress={() => setIsNotificationsDrawerOpen(true)}
                                        isDisabled={notifications.length === 0}
                                    >
                                        查看全部
                                    </Button>
                                </CardHeader>
                                <CardBody className="px-4 py-3">
                                    {isLoadingNotifications ? (
                                        <div className="flex items-center justify-center py-4">
                                            <Spinner size="lg" color="default" variant="dots" />
                                        </div>
                                    ) : notifications.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                            <p className="text-base">沒有通知</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <AnimatePresence>
                                                {notifications.slice(0, 3).map((notif) => (
                                                    <motion.div
                                                        key={notif.id}
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, x: 80, height: 0, marginBottom: 0 }}
                                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                                        className="custom-button-trans-override grid grid-cols-[auto_3fr_auto_4fr_auto] items-center gap-x-2 bg-white/10 rounded-2xl shadow-xl px-3 py-2 transition-colors duration-200"
                                                    >
                                                        {notif.type === "share-invite" && notif.senderInfo ? (
                                                            <Avatar
                                                                src={notif.senderInfo.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(notif.senderInfo.displayName || "User")}&background=random`}
                                                                size="sm"
                                                                className="flex-shrink-0 h-8 w-8"
                                                            />
                                                        ) : (
                                                            <div className={`rounded-lg ${getNotificationIconBg(notif.type)} p-1 h-8 w-8 flex items-center justify-center`}>
                                                                {getNotificationIcon(notif.type)}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm text-gray-200 font-medium">{getNotificationTitle(notif.type)}</p>
                                                            {notif.type === "share-invite" && notif.senderInfo ? (
                                                                <p className="text-xs text-gray-400 flex flex-row items-center">來自{notif.senderInfo.displayName || "某人"} <Dot /> {formatRelativeTime(notif.createdAt)}</p>
                                                            ) : (
                                                                <p className="text-xs text-gray-400">{formatRelativeTime(notif.createdAt)}</p>
                                                            )}
                                                        </div>
                                                        <Divider orientation="vertical" className="bg-white/40 h-6 w-0.5 rounded-full mx-1" />
                                                        <div className="text-gray-300 text-sm truncate">
                                                            {notif.message || (notif.type === "share-invite" && notif.fileInfo ? `分享了「${notif.fileInfo.displayName || "未知檔案"}」給你` : `檔案 "${notif.fileInfo?.displayName || "未知"}" 的通知`)}
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            isIconOnly
                                                            radius="full"
                                                            className="custom-button-trans-override bg-zinc-400/40 shadow-xl h-8 w-8 p-0 group"
                                                            isLoading={deletingNotificationId === notif.id}
                                                            onPress={() => deleteNotification(notif.id)}
                                                        >
                                                            {deletingNotificationId !== notif.id && <Trash size={16} className="text-neutral-900 cursor-pointer group-hover:text-rose-500 transition-all duration-200" />}
                                                        </Button>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                            <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                                <CardHeader className="pb-0 pt-4 px-4 flex-row items-center gap-3">
                                    <div className="bg-blue-500/20 p-2 rounded-xl">
                                        <FileText size={24} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-base text-white">最近使用的檔案</h4>
                                        <p className="text-gray-300 text-xs">快速存取您最近使用的檔案</p>
                                    </div>
                                </CardHeader>
                                <CardBody className="px-4 py-3">
                                    {isLoadingRecentFiles ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Spinner size="lg" color="default" variant="dots" />
                                        </div>
                                    ) : recentFiles.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                            <FileText size={24} className="mb-1 opacity-50" />
                                            <p className="text-base">沒有最近使用的檔案</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {recentFiles.slice(0, 3).map((file) => (
                                                <div
                                                    key={file.id}
                                                    className="custom-button-trans-override grid grid-cols-[auto_4fr_auto] items-center gap-x-3 bg-white/10 rounded-xl px-3 py-2 hover:bg-white/15 transition-all cursor-pointer"
                                                    onClick={() => handleRecentFileClick(file)}
                                                >
                                                    <div className={`${getFileIconBgColor(file.contentType)} p-1.5 rounded-lg`}>
                                                        {getFileIcon(file.contentType)}
                                                    </div>
                                                    <div className="flex min-w-0 flex-col">
                                                        <p className="text-white text-sm font-medium truncate">{file.name}</p>
                                                        <p className="text-xs text-gray-400">
                                                            {file.lastAccessedAt ? new Date(file.lastAccessedAt).toLocaleDateString("zh-TW", { month: "2-digit", day: "2-digit" }) + " " + new Date(file.lastAccessedAt).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }) : "未知"}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Chip className="text-xs text-gray-300 bg-gray-700/50 h-5 px-2">{formatBytes(file.size)}</Chip>
                                                        <ArrowUpRight size={14} className="text-gray-400" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </div>
                    )}
                </div>
            </DashboardContentTransition>

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

            {/* Share Invitations Drawer */}
            <CustomDrawer
                isOpen={isShareDrawerOpen}
                onOpenChange={setIsShareDrawerOpen}
                variant="blur"
                size="lg"
            >
                <CustomDrawerContent>
                    {(onClose) => (
                        <>
                            <CustomDrawerHeader>
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-600/30 p-3 rounded-xl">
                                        <Share2 size={24} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">檔案分享邀請</h3>
                                        <p className="text-sm text-gray-300">管理所有待處理的分享邀請</p>
                                    </div>
                                </div>
                            </CustomDrawerHeader>
                            <CustomDrawerBody>
                                {isLoadingInvitations ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Spinner size="lg" color="default" variant="dots" />
                                    </div>
                                ) : shareInvitations.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                        <Share2 size={48} className="mb-4 opacity-50" />
                                        <p className="text-lg">目前沒有分享邀請</p>
                                        <p className="text-sm mt-2">當有人分享檔案給你時，邀請會顯示在這裡</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <AnimatePresence>
                                            {shareInvitations.map((invitation) => (
                                                <motion.div
                                                    key={invitation.id}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, x: 100, height: 0, marginBottom: 0 }}
                                                    transition={{ duration: 0.35, ease: "easeOut" }}
                                                    className="bg-white/10 rounded-2xl p-4 shadow-xl hover:bg-white/15 transition-colors duration-200 custom-button-trans-override"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <Avatar
                                                            src={invitation.senderInfo?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(invitation.senderInfo?.displayName || "User")}&background=random`}
                                                            size="lg"
                                                            className="flex-shrink-0"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-white text-lg font-semibold mb-1">
                                                                來自 {invitation.senderInfo?.displayName || "某人"}
                                                            </p>
                                                            <p className="text-gray-300 text-sm mb-2">
                                                                {invitation.senderInfo?.email || "未知郵箱"}
                                                            </p>
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className={`${getFileIconBgColor(invitation.fileInfo?.contentType)} p-2 rounded-lg`}>
                                                                    {getFileIcon(invitation.fileInfo?.contentType)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-white font-medium">{invitation.fileInfo?.displayName || "檔案"}</p>
                                                                    <p className="text-gray-400 text-xs">{formatBytes(invitation.fileInfo?.size || 0)}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 mb-3">
                                                                {invitation.fileInfo?.shareMode === "public" ? (
                                                                    <Chip startContent={<LockOpen size={14} className="text-white" />} className="pl-2 items-center text-sm text-white bg-emerald-600">
                                                                        未限制
                                                                    </Chip>
                                                                ) : (
                                                                    <Chip startContent={<Lock size={14} className="text-white" />} className="pl-2 items-center text-sm text-white bg-blue-600">
                                                                        {invitation.fileInfo?.shareMode === "device" ? "裝置綁定" : invitation.fileInfo?.shareMode === "pin" ? "密碼鎖定" : "帳號綁定"}
                                                                    </Chip>
                                                                )}
                                                                <p className="text-sm text-gray-400 items-center flex flex-row gap-1">
                                                                    {invitation.fileInfo?.expiresAt && new Date(invitation.fileInfo.expiresAt) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) ? (
                                                                        <>
                                                                            <IoAlertOutline size={14} className="inline rounded-full bg-amber-500 p-0.5 text-zinc-900 mr-1" />
                                                                            即將失效： {new Date(invitation.fileInfo.expiresAt).toLocaleDateString("zh-TW")}
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Check size={18} className="inline rounded-full bg-emerald-500 p-0.5 text-zinc-900 mr-1 " />
                                                                            {invitation.fileInfo?.expiresAt ? new Date(invitation.fileInfo.expiresAt).toLocaleDateString("zh-TW") : "未知"} 前有效
                                                                        </>
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <Button
                                                                    size="sm"
                                                                    className="custom-button-trans-override bg-emerald-600 text-white flex-1"
                                                                    startContent={<Check size={18} />}
                                                                    isLoading={respondingInvitationId === invitation.id}
                                                                    onPress={() => respondToInvitation(invitation.id, invitation.shareId, "accept")}
                                                                >
                                                                    接受
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    className="custom-button-trans-override bg-rose-500 text-white flex-1"
                                                                    startContent={<X size={18} />}
                                                                    isLoading={respondingInvitationId === invitation.id}
                                                                    onPress={() => respondToInvitation(invitation.id, invitation.shareId, "reject")}
                                                                >
                                                                    拒絕
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </CustomDrawerBody>
                            <CustomDrawerFooter>
                                <Button
                                    color="primary"
                                    onPress={onClose}
                                    className="custom-button-trans-override flex items-center text-base"
                                >
                                    <ChevronLeft size={20} className="flex-shrink-0" /> 關閉
                                </Button>
                            </CustomDrawerFooter>
                        </>
                    )}
                </CustomDrawerContent>
            </CustomDrawer>

            {/* Notifications Drawer */}
            <CustomDrawer
                isOpen={isNotificationsDrawerOpen}
                onOpenChange={setIsNotificationsDrawerOpen}
                variant="blur"
                size="lg"
            >
                <CustomDrawerContent>
                    {(onClose) => (
                        <>
                            <CustomDrawerHeader>
                                <div className="flex items-center gap-3">
                                    <div className="bg-yellow-500/20 p-3 rounded-xl">
                                        <BellRing size={24} className="text-yellow-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">通知中心</h3>
                                        <p className="text-sm text-gray-300">查看所有通知訊息</p>
                                    </div>
                                </div>
                            </CustomDrawerHeader>
                            <CustomDrawerBody>
                                {isLoadingNotifications ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Spinner size="lg" color="default" variant="dots" />
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                        <BellRing size={48} className="mb-4 opacity-50" />
                                        <p className="text-lg">目前沒有通知</p>
                                        <p className="text-sm mt-2">當有新的通知時，它們會顯示在這裡</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <AnimatePresence>
                                            {notifications.map((notif) => (
                                                <motion.div
                                                    key={notif.id}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, x: 100, height: 0, marginBottom: 0 }}
                                                    transition={{ duration: 0.35, ease: "easeOut" }}
                                                    className="bg-white/10 rounded-2xl p-4 shadow-xl hover:bg-white/15 transition-colors duration-200 custom-button-trans-override"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        {notif.type === "share-invite" && notif.senderInfo ? (
                                                            <Avatar
                                                                src={notif.senderInfo.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(notif.senderInfo.displayName || "User")}&background=random`}
                                                                size="md"
                                                                className="flex-shrink-0"
                                                            />
                                                        ) : (
                                                            <div className={`${getNotificationIconBg(notif.type)} p-3 rounded-xl flex-shrink-0`}>
                                                                {getNotificationIcon(notif.type)}
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div>
                                                                    <p className="text-white font-semibold text-base">
                                                                        {getNotificationTitle(notif.type)}
                                                                    </p>
                                                                    {notif.type === "share-invite" && notif.senderInfo && (
                                                                        <div className="mt-1">
                                                                            <p className="text-gray-300 text-sm">來自 {notif.senderInfo.displayName || "某人"}</p>
                                                                            <p className="text-gray-400 text-xs">{notif.senderInfo.email || "未知郵箱"}</p>
                                                                        </div>
                                                                    )}
                                                                    <p className="text-gray-400 text-xs mt-1">{formatRelativeTime(notif.createdAt)}</p>
                                                                </div>
                                                                <Button
                                                                    size="sm"
                                                                    isIconOnly
                                                                    radius="full"
                                                                    className="custom-button-trans-override bg-zinc-400/40 shadow-xl group"
                                                                    isLoading={deletingNotificationId === notif.id}
                                                                    onPress={() => deleteNotification(notif.id)}
                                                                >
                                                                    {deletingNotificationId !== notif.id && <Trash size={16} className="text-neutral-900 cursor-pointer group-hover:text-rose-500 transition-all duration-200" />}
                                                                </Button>
                                                            </div>
                                                            {notif.message && (
                                                                <p className="text-gray-300 text-sm mb-2">
                                                                    {notif.message}
                                                                </p>
                                                            )}
                                                            {notif.fileInfo && (
                                                                <div className="flex items-center gap-2 mt-2 p-2 bg-white/5 rounded-lg">
                                                                    <div className={`${getFileIconBgColor(notif.fileInfo.contentType)} p-1.5 rounded`}>
                                                                        {getFileIcon(notif.fileInfo.contentType)}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-white text-sm font-medium">{notif.fileInfo.displayName}</p>
                                                                        <p className="text-gray-400 text-xs">{formatBytes(notif.fileInfo.size || 0)}</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </CustomDrawerBody>
                            <CustomDrawerFooter>
                                <Button
                                    color="primary"
                                    onPress={onClose}
                                    className="custom-button-trans-override flex items-center text-base"
                                >
                                    <ChevronLeft size={20} className="flex-shrink-0" /> 關閉
                                </Button>
                            </CustomDrawerFooter>
                        </>
                    )}
                </CustomDrawerContent>
            </CustomDrawer>

            {/* File Detail Modal */}
            <CustomModal
                isOpen={isFileDetailModalOpen}
                onClose={() => {
                    setIsFileDetailModalOpen(false);
                    setSelectedRecentFile(null);
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
                                {isLoadingFileDetail ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
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
                                        {fileDetail.isOwner && fileDetail.recipients && fileDetail.recipients.length > 0 && (
                                            <CustomButton
                                                variant="blur"
                                                startContent={<Users size={16} className="text-blue-300" />}
                                                onPress={() => setIsRecipientsModalOpen(true)}
                                                className="w-full justify-start bg-white/5 hover:bg-white/10"
                                            >
                                                <span className="text-gray-300">已分享給 {fileDetail.recipients.length} 位收件者</span>
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
                                                        `${fileDetail.remainingDownloads} / ${fileDetail.maxDownloads}`
                                                    ) : (
                                                        "無限制"
                                                    )}
                                                </p>
                                            </div>
                                            <div className="bg-white/5 rounded-xl p-2 border-2 border-white/20">
                                                <p className="text-gray-400 text-sm mb-1 ml-1">建立時間</p>
                                                <div className="text-white ml-1 tracking-normal">
                                                    {fileDetail.createdAt ? (
                                                        <p>{new Date(fileDetail.createdAt).toLocaleDateString("zh-TW")} {new Date(fileDetail.createdAt).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}</p>
                                                    ) : (
                                                        <p>-</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="bg-white/5 rounded-xl p-2 border-2 border-white/20">
                                                <p className="text-gray-400 text-sm mb-1 ml-1">到期時間</p>
                                                <div className="text-white ml-1 tracking-normal">
                                                    {fileDetail.expiresAt ? (
                                                        <p>{new Date(fileDetail.expiresAt).toLocaleDateString("zh-TW")} {new Date(fileDetail.expiresAt).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}</p>
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
                                                <p className="text-white ml-1 tracking-widest">{fileDetail.downloads}</p>
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
                                                                        onPress={() => handleCopyShareCode(fileDetail.shareInfo!.shareUrl.split('/').pop() || '')}
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

                                        {/* Owner info for shared files */}
                                        {!fileDetail.isOwner && fileDetail.ownerEmail && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: 0.1 }}
                                                className="bg-white/5 rounded-xl p-3 border-2 border-white/20"
                                            >
                                                <p className="text-gray-400 text-sm mb-1">分享者</p>
                                                <p className="text-white">{fileDetail.ownerEmail}</p>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                        className="text-gray-400 text-center py-8 text-xl flex flex-col items-center gap-2"
                                    >
                                        <CircleAlert size={28} /> 無法載入檔案詳情
                                    </motion.p>
                                )}
                            </CustomModalBody>
                            <CustomModalFooter>
                                <CustomButton
                                    variant="blur"
                                    onPress={() => {
                                        setIsFileDetailModalOpen(false);
                                        setSelectedRecentFile(null);
                                        setFileDetail(null);
                                        setDetailModalFeedback({ message: '', type: 'success', isOpen: false });
                                    }}
                                    className="text-gray-300"
                                >
                                    關閉
                                </CustomButton>
                                {selectedRecentFile && fileDetail && !fileDetail.revoked && fileDetail.expiresAt && new Date(fileDetail.expiresAt) > new Date() && (
                                    <CustomButton
                                        variant="blur"
                                        startContent={!isDownloadingFile && <Download size={16} />}
                                        isLoading={isDownloadingFile}
                                        onPress={handleDownloadFromModal}
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
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className="space-y-3"
                                >
                                    <p className="text-gray-400 text-base">
                                        此檔案已分享給以下 {fileDetail?.recipients?.length || 0} 位使用者：
                                    </p>
                                    <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                                        {fileDetail?.recipients?.map((recipient) => (
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
                                                className="bg-blue-500/20 text-blue-300"
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
        </div>
    );
}
