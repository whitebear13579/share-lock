"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { gsap } from "gsap";
import { useAuth } from "@/utils/authProvider";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { Button } from "@heroui/button";
import {
    Cog,
    Folder,
    House,
    LogOut,
    Shield,
    AlertTriangle,
    Mail,
    Key,
    Clock,
    ChartPie,
    ExternalLink,
    Check,
    X,
    History,
    Link as LinkIcon,
    Trash2,
    Eye,
    MessageCircleQuestionMark,
    EyeClosed,
    UserRound,
    CalendarCheck,
    FolderOutput,
    FolderInput,
    Info,
    PenLine,
    Unlink,
    BadgePlus,
    Send,
    PackageX,
    UserRoundXIcon,
    Dot,
    CircleAlert,
    BadgeAlert,
    BadgeQuestionMark,
    AtSign,
    Clock4,
    Unplug,
    ChevronLeft,
} from "lucide-react";
import {
    Spinner,
    Card,
    CardBody,
    CardHeader,
    Avatar,
    useDisclosure,
    CircularProgress,
    Chip,
    Navbar,
    NavbarContent,
    NavbarBrand,
    NavbarMenuToggle,
    NavbarMenu,
    NavbarMenuItem,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Link,
    Popover,
    PopoverTrigger,
    PopoverContent
} from "@heroui/react";
import CustomButton from "@/components/button";
import CustomInput from "@/components/input";
import { CustomSelect, CustomSelectItem } from "@/components/select";
import {
    CustomDrawer,
    CustomDrawerContent,
    CustomDrawerHeader,
    CustomDrawerBody,
    CustomDrawerFooter,
} from "@/components/drawer";
import {
    CustomModal,
    CustomModalContent,
    CustomModalHeader,
    CustomModalBody,
    CustomModalFooter,
} from "@/components/modal";
import DashboardNavigation from "@/components/dashboardNavigation";
import DashboardContentTransition from "@/components/dashboardContentTransition";
import { useAvatarCache } from "@/utils/avatarCache";
import {
    updateProfile,
    updateEmail,
    updatePassword,
    sendEmailVerification,
    deleteUser,
    reauthenticateWithCredential,
    EmailAuthProvider,
    linkWithPopup,
    GoogleAuthProvider,
    GithubAuthProvider,
    unlink
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import CryptoJS from "crypto-js";
import {
    getUserLoginHistory,
    getRecentLoginRecord,
    LoginRecord,
    getDeviceInfo
} from "@/utils/loginHistory";
import { Timestamp } from 'firebase/firestore';
import { getUserStorageUsage } from "@/utils/storageQuota";
import { IoAlertOutline } from "react-icons/io5";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { PiHandWaving } from "react-icons/pi";
import { HiMiniMapPin } from "react-icons/hi2";

const getFirebaseErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
        case "auth/user-not-found":
            return "找不到此帳號，請檢查拼字是否正確";
        case "auth/wrong-password":
            return "密碼錯誤";
        case "auth/invalid-email":
            return "電子郵件格式不正確";
        case "auth/user-disabled":
            return "此帳號已被停用";
        case "auth/invalid-credential":
            return "帳號或密碼錯誤";
        case "auth/too-many-requests":
            return "受到速率限制，請稍後再試";
        case "auth/account-exists-with-different-credential":
            return "電子郵件已使用其他方式註冊";
        case "auth/popup-blocked":
            return "彈出視窗遭到封鎖";
        case "auth/cancelled-popup-request":
            return "取消彈出視窗請求";
        case "auth/network-request-failed":
            return "網路連線失敗";
        case "auth/weak-password":
            return "密碼強度不足";
        case "auth/email-already-in-use":
            return "此電子郵件已被使用";
        case "auth/operation-not-allowed":
            return "不允許此操作";
        case "auth/requires-recent-login":
            return "請重新登入後再試";
        default:
            return "登入失敗，請稍後再試";
    }
};

const deleteServerSession = async (): Promise<boolean> => {
    try {
        const response = await fetch("/api/auth/session", {
            method: "DELETE",
        });
        return response.ok;
    } catch (error) {
        console.error("Failed to delete server session:", error);
        return false;
    }
};

export default function Settings() {
    const { user, loading, logout, isLoggingOut, setLoggingOutState } = useAuth();
    const router = useRouter();
    const { setAvatarUrl } = useAvatarCache();
    const fakeMainRef = useRef<HTMLDivElement>(null);
    const fakeFooterRef = useRef<HTMLDivElement>(null);

    // State management
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1536 : false);
    const [isLargeTab, setIslargeTab] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [displayName, setDisplayName] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [avatarSource, setAvatarSource] = useState("default");
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [avatarPopover, setAvatarPopover] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({ isOpen: false, message: '', type: 'success' });
    const [namePopover, setNamePopover] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({ isOpen: false, message: '', type: 'success' });
    const [emailPopover, setEmailPopover] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({ isOpen: false, message: '', type: 'success' });
    const [passwordPopover, setPasswordPopover] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({ isOpen: false, message: '', type: 'success' });
    const [verifyEmailPopover, setVerifyEmailPopover] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({ isOpen: false, message: '', type: 'success' });
    const [deleteFilesPopover, setDeleteFilesPopover] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({ isOpen: false, message: '', type: 'success' });

    // Modal controls
    const { isOpen: isNameModalOpen, onOpen: onNameModalOpen, onOpenChange: onNameModalOpenChange } = useDisclosure();
    const { isOpen: isEmailModalOpen, onOpen: onEmailModalOpen, onOpenChange: onEmailModalOpenChange } = useDisclosure();
    const { isOpen: isPasswordModalOpen, onOpen: onPasswordModalOpen, onOpenChange: onPasswordModalOpenChange } = useDisclosure();
    const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onOpenChange: onDeleteModalOpenChange } = useDisclosure();
    const { isOpen: isDeleteAccountModalOpen, onOpen: onDeleteAccountModalOpen, onOpenChange: onDeleteAccountModalOpenChange } = useDisclosure();
    const { isOpen: isLoginHistoryDrawerOpen, onOpen: onLoginHistoryDrawerOpen, onOpenChange: onLoginHistoryDrawerOpenChange } = useDisclosure();

    // Login history state
    const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [recentLogin, setRecentLogin] = useState<LoginRecord | null>(null);

    // Storage state
    const [storageData, setStorageData] = useState({
        usedBytes: 0,
        quotaBytes: 1024 * 1024 * 1024,
        percentage: 0,
        formattedUsed: "0 B",
        formattedQuota: "1 GB",
    });
    const [isLoadingStorage, setIsLoadingStorage] = useState(true);

    // Statistics state
    const [statistics, setStatistics] = useState({
        filesShared: 0,
        filesReceived: 0,
    });
    const [isLoadingStatistics, setIsLoadingStatistics] = useState(true);

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
            setIslargeTab(window.innerWidth >= 1024);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // logn history loader
    const loadLoginHistory = useCallback(async () => {
        if (!user) return;

        setIsLoadingHistory(true);
        try {
            const idToken = await user.getIdToken();
            const history = await getUserLoginHistory(user.uid, idToken, 50);
            setLoginHistory(history);

            const recent = await getRecentLoginRecord(user.uid, idToken);
            setRecentLogin(recent);
        } catch (error) {
            console.error('Failed to load login history:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    }, [user]);

    // user storage state loader
    const loadStorageData = useCallback(async () => {
        if (!user) return;

        setIsLoadingStorage(true);
        try {
            const usage = await getUserStorageUsage();
            setStorageData(usage);
        } catch (error) {
            console.error('Failed to load storage usage:', error);
        } finally {
            setIsLoadingStorage(false);
        }
    }, [user]);

    // statistics loader
    const loadStatistics = useCallback(async () => {
        if (!user) return;

        setIsLoadingStatistics(true);
        try {
            const idToken = await user.getIdToken();
            const response = await fetch('/api/statistics/overview', {
                headers: {
                    Authorization: `Bearer ${idToken}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch statistics');
            }

            const data = await response.json();
            setStatistics({
                filesShared: data.filesShared || 0,
                filesReceived: data.filesReceived || 0,
            });
        } catch (error) {
            console.error('Failed to load statistics:', error);
        } finally {
            setIsLoadingStatistics(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || "");
            setNewEmail(user.email || "");

            // Determine avatar source based on current photoURL and provider data
            const currentPhotoURL = user.photoURL;
            const isGoogleProvider = user.providerData.some(provider => provider.providerId === 'google.com');
            const isGithubProvider = user.providerData.some(provider => provider.providerId === 'github.com');

            if (currentPhotoURL) {
                // Check if the current photoURL matches a specific provider
                if (currentPhotoURL.includes('googleusercontent.com') && isGoogleProvider) {
                    setAvatarSource("google");
                } else if (currentPhotoURL.includes('avatars.githubusercontent.com') && isGithubProvider) {
                    setAvatarSource("github");
                } else if (currentPhotoURL.includes('gravatar.com')) {
                    setAvatarSource("gravatar");
                } else {
                    // Fallback based on available providers
                    if (isGoogleProvider) {
                        setAvatarSource("google");
                    } else if (isGithubProvider) {
                        setAvatarSource("github");
                    } else {
                        setAvatarSource("gravatar");
                    }
                }
            } else {
                // No photoURL, determine based on available providers
                if (isGoogleProvider) {
                    setAvatarSource("google");
                } else if (isGithubProvider) {
                    setAvatarSource("github");
                } else {
                    setAvatarSource("gravatar");
                }
            }

            loadLoginHistory();
            loadStorageData();
            loadStatistics();
        }
    }, [user, loading, router, loadLoginHistory, loadStorageData, loadStatistics]);

    const formatDate = (timestamp: string | Timestamp) => {
        let date: Date;
        if (timestamp instanceof Timestamp) {
            date = timestamp.toDate();
        } else {
            date = new Date(timestamp);
        }
        return date.toLocaleString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDeviceIcon = (device: string) => {
        if (device.includes('iPhone') || device.includes('Safari')) {
            return "🍎";
        } else if (device.includes('Chrome')) {
            return "🌐";
        } else if (device.includes('Firefox')) {
            return "🦊";
        } else if (device.includes('Edge')) {
            return "🌊";
        } else if (device.includes('MacOS')) {
            return "🍎";
        } else if (device.includes('Ubuntu') || device.includes('Linux')) {
            return "🐧";
        } else {
            return "💻";
        }
    };

    const getChip = (loginProvider: string) => {
        console.log(loginProvider);
        switch (loginProvider) {
            case 'google':
                return (
                    <Chip color="primary" size="md" radius="lg" startContent={<FcGoogle size={18} className="ml-1" />} className="px-1 shadow-lg bg-white text-black" >Google</Chip>
                );
            case 'github':
                return (
                    <Chip size="md" radius="lg" startContent={<FaGithub size={18} className="ml-1" />} className="px-1 shadow-lg bg-zinc-900 text-white" >GitHub</Chip>
                );
            case 'email':
                return (
                    <Chip color="warning" size="md" radius="lg" startContent={<AtSign size={18} className="ml-1" />} className="px-1 shadow-lg" >電子郵件與密碼</Chip>
                );
            default:
                return (
                    <Chip color="secondary" size="md" radius="lg" startContent={<BadgeQuestionMark size={18} className="ml-1" />} className="px-1 shadow-lg " >未知的來源</Chip>
                );
        }
    };

    const getRelativeTime = (timestamp: string | Timestamp) => {
        const now = new Date();
        let time: Date;
        if (timestamp instanceof Timestamp) {
            time = timestamp.toDate();
        } else {
            time = new Date(timestamp);
        }
        const diffInHours = (now.getTime() - time.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return "剛剛";
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)} 小時前`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays} 天前`;
        }
    }; const getLinkedProviders = () => {
        if (!user) return [];
        return user.providerData.map(provider => provider.providerId);
    };

    const isGoogleLinked = () => getLinkedProviders().includes('google.com');
    const isGithubLinked = () => getLinkedProviders().includes('github.com');

    const getAvatarUrl = () => {
        if (!user) return "/undefined.png";

        switch (avatarSource) {
            case "google":
                if (isGoogleLinked()) {
                    const googleProvider = user.providerData.find(p => p.providerId === 'google.com');
                    return googleProvider?.photoURL || user.photoURL || "/undefined.png";
                }
                return "/undefined.png";
            case "github":
                if (isGithubLinked()) {
                    const githubProvider = user.providerData.find(p => p.providerId === 'github.com');
                    return githubProvider?.photoURL || user.photoURL || "/undefined.png";
                }
                return "/undefined.png";
            case "gravatar":
                if (user.email) {
                    const trimmedEmail = user.email.trim().toLowerCase();
                    const hashedEmail = CryptoJS.SHA256(trimmedEmail).toString();
                    return `https://www.gravatar.com/avatar/${hashedEmail}`;
                }
                return "/undefined.png";
            default:
                return user.photoURL || "/undefined.png";
        }
    };


    const handleAvatarSourceChange = async (newSource: string) => {
        try {
            let newAvatarUrl = "/undefined.png";

            if (!user) return;

            switch (newSource) {
                case "google":
                    if (isGoogleLinked()) {
                        const googleProvider = user.providerData.find(p => p.providerId === 'google.com');
                        newAvatarUrl = googleProvider?.photoURL || user.photoURL || "/undefined.png";
                    }
                    break;
                case "github":
                    if (isGithubLinked()) {
                        const githubProvider = user.providerData.find(p => p.providerId === 'github.com');
                        newAvatarUrl = githubProvider?.photoURL || user.photoURL || "/undefined.png";
                    }
                    break;
                case "gravatar":
                    if (user.email) {
                        const trimmedEmail = user.email.trim().toLowerCase();
                        const hashedEmail = CryptoJS.SHA256(trimmedEmail).toString();
                        newAvatarUrl = `https://www.gravatar.com/avatar/${hashedEmail}`;
                    }
                    break;
                default:
                    newAvatarUrl = user.photoURL || "/undefined.png";
            }

            if (newAvatarUrl !== "/undefined.png") {
                await updateProfile(user, { photoURL: newAvatarUrl });
            }
            setAvatarUrl(user.uid, newAvatarUrl, newSource);
            setAvatarSource(newSource);

            setAvatarPopover({ isOpen: true, message: '頭像來源已更新！', type: 'success' });
            setTimeout(() => setAvatarPopover({ isOpen: false, message: '', type: 'success' }), 3000);
        } catch (error: unknown) {
            console.error("Error updating avatar:", error);

            setAvatarPopover({ isOpen: true, message: '更新頭像失敗：' + (error as Error).message, type: 'error' });
            setTimeout(() => setAvatarPopover({ isOpen: false, message: '', type: 'error' }), 3000);
        }
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
                        await logout();
                        await new Promise(r => setTimeout(r, 100));
                        await router.push("/login");
                        setTimeout(() => {
                            setLoggingOutState(false);
                        }, 500);
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
                    ease: "power2.inOut"
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

    // Firebase functions
    const handleUpdateDisplayName = async () => {
        if (!user || !displayName.trim()) return;

        const trimmedName = displayName.trim();
        if (trimmedName.length > 20) {
            setNamePopover({ isOpen: true, message: '使用者名稱不能超過 20 個字元', type: 'error' });
            setTimeout(() => setNamePopover({ isOpen: false, message: '', type: 'error' }), 3000);
            return;
        }

        setIsUpdating(true);
        try {
            await updateProfile(user, { displayName: trimmedName });
            setNamePopover({ isOpen: true, message: '使用者名稱已更新！', type: 'success' });
            setTimeout(() => setNamePopover({ isOpen: false, message: '', type: 'success' }), 3000);
            onNameModalOpenChange();
        } catch (error: unknown) {
            console.error("Error updating display name:", error);
            setNamePopover({ isOpen: true, message: '更新使用者名稱失敗：' + (error as Error).message, type: 'error' });
            setTimeout(() => setNamePopover({ isOpen: false, message: '', type: 'error' }), 3000);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateEmail = async () => {
        if (!user || !newEmail.trim() || !currentPassword) return;

        setIsUpdating(true);
        try {
            // Reauthenticate first
            const credential = EmailAuthProvider.credential(user.email!, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Update email
            await updateEmail(user, newEmail.trim());
            setEmailPopover({ isOpen: true, message: '電子郵件已更新！檢查信箱來進行驗證。', type: 'success' });
            setTimeout(() => setEmailPopover({ isOpen: false, message: '', type: 'success' }), 3000);
            onEmailModalOpenChange();
            setCurrentPassword("");
        } catch (error: unknown) {
            console.error("Error updating email:", error);
            let errorMessage = '';
            const errorCode = (error as FirebaseError).code;

            switch (errorCode) {
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    errorMessage = '密碼錯誤，請重新輸入';
                    break;
                case 'auth/email-already-in-use':
                    errorMessage = '此電子郵件已被使用';
                    break;
                case 'auth/invalid-email':
                    errorMessage = '電子郵件格式無效';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = '請先驗證電子郵件';
                    break;
                case 'auth/requires-recent-login':
                    errorMessage = '請重新登入後再試';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = '操作次數過多，請稍後再試';
                    break;
                default:
                    errorMessage = '發生未知錯誤，請稍後再試';
            }

            onEmailModalOpenChange();
            setTimeout(() => {
                setEmailPopover({ isOpen: true, message: errorMessage, type: 'error' });
                setTimeout(() => setEmailPopover({ isOpen: false, message: '', type: 'error' }), 3000);
            }, 100);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!user || !currentPassword || !newPassword || newPassword !== confirmPassword) return;

        setIsUpdating(true);
        try {
            // Reauthenticate first
            const credential = EmailAuthProvider.credential(user.email!, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Update password
            await updatePassword(user, newPassword);
            setPasswordPopover({ isOpen: true, message: '密碼已更新！', type: 'success' });
            setTimeout(() => setPasswordPopover({ isOpen: false, message: '', type: 'success' }), 3000);
            onPasswordModalOpenChange();
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: unknown) {
            console.error("Error updating password:", error);
            let errorMessage = '密碼更新失敗：';
            const errorCode = (error as FirebaseError).code;

            switch (errorCode) {
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    errorMessage = '舊密碼輸入錯誤';
                    break;
                case 'auth/weak-password':
                    errorMessage = '新密碼強度不足（至少需要8個字元）';
                    break;
                case 'auth/requires-recent-login':
                    errorMessage = '請重新登入後再試';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = '已達速率限制，請稍後再試';
                    break;
                default:
                    errorMessage = '發生未知錯誤，請稍後再試';
            }

            onPasswordModalOpenChange();
            setTimeout(() => {
                setPasswordPopover({ isOpen: true, message: errorMessage, type: 'error' });
                setTimeout(() => setPasswordPopover({ isOpen: false, message: '', type: 'error' }), 3000);
            }, 100);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSendVerificationEmail = async () => {
        if (!user) return;

        try {
            await sendEmailVerification(user);
            requestAnimationFrame(() => {
                setVerifyEmailPopover({ isOpen: true, message: '驗證郵件已發送！', type: 'success' });
                setTimeout(() => setVerifyEmailPopover({ isOpen: false, message: '', type: 'success' }), 3000);
            });
        } catch (error: unknown) {
            console.error("Error sending verification email:", error);
            let errorMessage = '';
            const errorCode = (error as FirebaseError).code;

            switch (errorCode) {
                case 'auth/too-many-requests':
                    errorMessage = '已達速率限制，請稍後再試';
                    break;
                case 'auth/user-not-found':
                    errorMessage = '找不到使用者';
                    break;
                case 'auth/invalid-email':
                    errorMessage = '電子郵件格式無效';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = '請檢查網路連線';
                    break;
                default:
                    errorMessage = '發生未知錯誤，請稍後再試';
            }

            requestAnimationFrame(() => {
                setVerifyEmailPopover({ isOpen: true, message: errorMessage, type: 'error' });
                setTimeout(() => setVerifyEmailPopover({ isOpen: false, message: '', type: 'error' }), 3000);
            });
        }
    };

    const handleLinkProvider = async (providerId: string) => {
        if (!user) return;

        try {
            let provider;
            if (providerId === 'google.com') {
                provider = new GoogleAuthProvider();
            } else if (providerId === 'github.com') {
                provider = new GithubAuthProvider();
            } else {
                return;
            }

            await linkWithPopup(user, provider);
            router.refresh();
        } catch (error: unknown) {
            console.error("Error linking provider:", error);
        }
    };

    const handleUnlinkProvider = async (providerId: string) => {
        if (!user) return;

        // Check if user has other authentication methods
        const providers = user.providerData.map(p => p.providerId);
        if (providers.length <= 1 && !user.emailVerified) {
            console.error('Cannot unlink: User needs at least one auth method or verified email');
            return;
        }

        try {
            await unlink(user, providerId);
            router.refresh();
        } catch (error: unknown) {
            console.error("Error unlinking provider:", error);
        }
    };

    const handleDeleteFiles = async () => {
        if (deleteConfirmText !== 'DELETE') return;
        if (!user) return;

        setIsUpdating(true);
        try {
            const idToken = await user.getIdToken();
            const response = await fetch('/api/files/delete-all', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ confirmText: 'DELETE' }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '刪除檔案失敗');
            }

            onDeleteModalOpenChange();
            setDeleteConfirmText("");

            await loadStorageData();

            setDeleteFilesPopover({
                isOpen: true,
                message: `成功刪除 ${data.deletedCount} 個檔案`,
                type: 'success'
            });
            setTimeout(() => setDeleteFilesPopover({ isOpen: false, message: '', type: 'success' }), 3000);
        } catch (error: unknown) {
            console.error("Error deleting files:", error);
            setDeleteFilesPopover({
                isOpen: true,
                message: '刪除檔案失敗：' + (error as Error).message,
                type: 'error'
            });
            setTimeout(() => setDeleteFilesPopover({ isOpen: false, message: '', type: 'error' }), 3000);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user || !currentPassword) return;

        setIsUpdating(true);
        try {
            const credential = EmailAuthProvider.credential(user.email!, currentPassword);
            await reauthenticateWithCredential(user, credential);
            onDeleteAccountModalOpenChange();
            await new Promise<void>((resolve) => {
                const tl = gsap.timeline({
                    onComplete: () => {
                        (async () => {
                            setLoggingOutState(true);

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
                            await deleteUser(user);
                            await deleteServerSession();
                            router.replace("/");
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
                        ease: "power2.inOut"
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
        } catch (error: unknown) {
            console.error("Error deleting account:", error);
            setIsUpdating(false);
        }
    };

    if (loading || isLoggingOut) {
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

    const disabledAvatarSources = [];
    if (!user.email) {
        disabledAvatarSources.push("gravatar");
    }
    if (!isGoogleLinked()) {
        disabledAvatarSources.push("google");
    }
    if (!isGithubLinked()) {
        disabledAvatarSources.push("github");
    }

    return (
        <div className="min-h-screen bg-linear-205 from-slate-700  to-neutral-800 to-55%">
            {/* Wide device naviBar */}
            {isLargeTab && (
                <DashboardNavigation loading={loading} onLogout={handleLogout} />
            )}

            {/* Mobile device naviBar */}
            {!isLargeTab && (
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
                            <p className="font-bold text-xl text-white">帳號設定</p>
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
                                    src={getAvatarUrl()}
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
                            <NextLink href="/dashboard" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/20 text-white transition-colors">
                                <House size={20} />
                                <span className="text-lg">資訊主頁</span>
                            </NextLink>
                        </NavbarMenuItem>
                        <NavbarMenuItem>
                            <NextLink href="/dashboard/files" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/20 text-white transition-colors">
                                <Folder size={20} />
                                <span className="text-lg">我的檔案</span>
                            </NextLink>
                        </NavbarMenuItem>
                        <NavbarMenuItem>
                            <NextLink href="/dashboard/settings" className="flex items-center gap-3 p-3 rounded-xl bg-white/20 text-blue-400">
                                <Cog size={20} />
                                <span className="text-lg font-medium">帳號設定</span>
                            </NextLink>
                        </NavbarMenuItem>
                    </NavbarMenu>
                </Navbar>
            )}

            <DashboardContentTransition>
                <div className={isMobile ? "pt-20 px-4" : "pt-36 px-13"}>
                    <div className={`font-bold text-white mb-2 ${isMobile ? "text-2xl" : "text-4xl"}`}>
                        帳號設定
                    </div>
                    <p className={`text-gray-300 ${isMobile ? "text-base" : "text-lg"}`}>
                        您的帳號安全對我們而言至關重要。
                    </p>
                </div>

                {/* Settings Content */}
                <div className={isMobile ? "px-4 py-6 pb-16" : "px-12 py-8 pb-16"}>
                    {/* Wide device layout */}
                    {!isMobile && (
                        <div className="space-y-6">
                            {/* First Row - Profile and Stats */}
                            <div className="flex gap-6">
                                {/* Profile Card */}
                                <Card className="bg-white/10 backdrop-blur-sm border-white/20 w-sm" shadow="lg">
                                    <CardHeader className="pb-0 pt-6 px-6 flex-col items-start gap-2">
                                        <div className="flex items-center gap-3 w-full">
                                            <div className="bg-blue-600/30 p-3 rounded-xl">
                                                <UserRound size={24} className="text-blue-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-xl text-white">個人資料</h4>
                                                <p className="text-gray-300 text-sm">管理您的帳號基本資訊</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardBody className="px-6 py-6">
                                        <div className="flex flex-col items-center space-y-5">
                                            <div className="relative">
                                                <Avatar
                                                    src={getAvatarUrl()}
                                                    className="w-20 h-20"
                                                    name={user.displayName || "User"}
                                                />
                                            </div>

                                            <div className="w-full space-y-4">
                                                <Popover
                                                    isOpen={namePopover.isOpen}
                                                    placement="right"
                                                    showArrow={true}
                                                    onOpenChange={(open) => setNamePopover({ ...namePopover, isOpen: open })}
                                                    offset={8}
                                                    classNames={{
                                                        base: [
                                                            namePopover.type === 'success' ? 'before:bg-emerald-700' : 'before:bg-rose-800',
                                                        ],
                                                        content: [
                                                            namePopover.type === 'success' ? 'bg-emerald-600 border-emerald-700' : 'bg-rose-500 border-rose-800',
                                                            "border-2",
                                                        ].join(" "),
                                                    }}
                                                >
                                                    <PopoverTrigger>
                                                        <div className="flex items-center justify-between p-3.5 bg-white/20 hover:bg-white/30 rounded-2xl shadow-xl border border-white/30 custom-button-trans-override">
                                                            <span className="text-white text-lg">使用者名稱</span>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-white font-medium text-lg">{user.displayName || "未設定"}</span>
                                                                <Button
                                                                    isIconOnly
                                                                    className="custom-button-trans-overrid bg-zinc-400/50 shadow-xl group"
                                                                    size="sm"
                                                                    radius="full"
                                                                    onPress={onNameModalOpen}
                                                                >
                                                                    <PenLine size={18} className="text-neutral-900 group-hover:text-blue-500 transition-all duration-200" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </PopoverTrigger>
                                                    <PopoverContent>
                                                        <div className="px-3 py-2">
                                                            <div className="flex items-center gap-2">
                                                                {namePopover.type === 'success' ? (
                                                                    <Check size={20} className="text-white" />
                                                                ) : (
                                                                    <AlertTriangle size={20} className="text-white" />
                                                                )}
                                                                <span className="text-base text-white font-medium">{namePopover.message === "" ? "你好，打 maimai 嗎？" : namePopover.message}</span>
                                                            </div>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>

                                                <Popover
                                                    isOpen={avatarPopover.isOpen}
                                                    placement="right"
                                                    showArrow={true}
                                                    onOpenChange={(open) => setAvatarPopover({ ...avatarPopover, isOpen: open })}
                                                    offset={8}
                                                    classNames={{
                                                        base: [
                                                            avatarPopover.type === 'success' ? 'before:bg-emerald-700' : 'before:bg-rose-800',
                                                        ],
                                                        content: [
                                                            avatarPopover.type === 'success' ? 'bg-emerald-600 border-emerald-700' : 'bg-rose-500 border-rose-800',
                                                            "border-2",
                                                        ].join(" "),
                                                        trigger: [
                                                            "transition-all duration-200",
                                                        ],
                                                    }}
                                                >
                                                    <PopoverTrigger>
                                                        <div>
                                                            <CustomSelect
                                                                label="頭像來源"
                                                                className="custom-button-trans-override shadow-xl"
                                                                selectedKeys={new Set([avatarSource])}
                                                                onSelectionChange={(keys) => handleAvatarSourceChange(Array.from(keys)[0] as string)}
                                                                size="md"
                                                                disabledKeys={disabledAvatarSources}
                                                                isDisabled={avatarPopover.isOpen}
                                                            >
                                                                <CustomSelectItem key="gravatar">Gravatar</CustomSelectItem>
                                                                <CustomSelectItem key="google">Google</CustomSelectItem>
                                                                <CustomSelectItem key="github">GitHub</CustomSelectItem>
                                                            </CustomSelect>
                                                        </div>
                                                    </PopoverTrigger>
                                                    <PopoverContent>
                                                        <div className="px-3 py-2">
                                                            <div className="flex items-center gap-2">
                                                                {avatarPopover.type === 'success' ? (
                                                                    <Check size={20} className="text-white" />
                                                                ) : (
                                                                    <AlertTriangle size={20} className="text-white" />
                                                                )}
                                                                <span className="text-base text-white font-medium">{avatarPopover.message}</span>
                                                            </div>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>


                                                {/* Provider Links Section */}
                                                <div className="my-3 flex items-center gap-3">
                                                    <BadgePlus size={28} className="text-indigo-500" />
                                                    <span className="text-gray-300 text-lg font-medium">第三方服務</span>
                                                </div>
                                                <div className="flex gap-3">
                                                    <Button
                                                        onPress={() => isGoogleLinked() ? handleUnlinkProvider('google.com') : handleLinkProvider('google.com')}
                                                        className="bg-white flex flex-col items-center justify-center gap-2 p-3 rounded-2xl shadow-xl custom-button-trans-override cursor-pointer transition-all w-full h-fit"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <FcGoogle size={24} className="flex-shrink-0" />
                                                            <span className="text-black font-medium text-base">Google</span>
                                                        </div>
                                                        <span className={`flex text-sm tracking-widest font-semibold gap-2 items-center ${isGoogleLinked() ? 'text-rose-500' : 'text-emerald-400'
                                                            }`}>
                                                            {isGoogleLinked() ? <Unlink size={20} /> : <LinkIcon size={20} />}
                                                            {isGoogleLinked() ? '解除綁定' : '綁定'}
                                                        </span>
                                                    </Button>
                                                    <Button
                                                        onPress={() => isGithubLinked() ? handleUnlinkProvider('github.com') : handleLinkProvider('github.com')}
                                                        className="bg-zinc-900 flex flex-col items-center justify-center gap-2 p-3 rounded-2xl shadow-xl custom-button-trans-override cursor-pointer transition-all w-full h-fit"
                                                    >
                                                        <div className="flex items-center gap-3" >
                                                            <FaGithub size={24} className="flex-shrink-0 text-white" />
                                                            <span className="text-white font-medium text-base" >Github</span>
                                                        </div>
                                                        <span className={`flex text-sm tracking-widest font-semibold gap-2 items-center ${isGithubLinked() ? 'text-rose-500' : 'text-emerald-500'
                                                            }`}>
                                                            {isGithubLinked() ? <Unlink size={20} /> : <LinkIcon size={20} />}
                                                            {isGithubLinked() ? '解除綁定' : '綁定'}
                                                        </span>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>

                                {/* Stats and Storage Card */}
                                <Card className="flex-1 bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                                    <CardHeader className="pb-0 pt-6 px-6 flex-row items-center gap-3">
                                        <div className="bg-purple-600/30 p-3 rounded-xl">
                                            <ChartPie size={24} className="text-purple-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-xl text-white">帳號使用統計</h4>
                                            <p className="text-gray-300 text-sm">您的帳號使用量與統計資料</p>
                                        </div>
                                    </CardHeader>
                                    <CardBody className="px-6 py-6">
                                        <div className="grid grid-cols-8 gap-6">
                                            {/* Left side - Statistics (Vertical Layout) */}
                                            <div className="col-span-3 flex flex-col gap-4">
                                                {/* 加入天數 */}
                                                <div className="p-3 bg-white/8 rounded-2xl flex items-center gap-4 shadow-xl custom-button-trans-override">
                                                    <div className="p-3 bg-blue-500/20 rounded-xl">
                                                        <CalendarCheck size={30} className="text-blue-400" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm text-gray-300">
                                                            從加入 Share Lock 那天起已過了......
                                                        </p>
                                                        {loading ? (
                                                            <Spinner size="md" color="default" variant="dots" classNames={{ wrapper: "!h-0", base: "h-8" }} />
                                                        ) : (
                                                            <p className="text-white font-semibold text-2xl tracking-wide">
                                                                {Math.floor((new Date().getTime() - new Date(user.metadata.creationTime!).getTime()) / (1000 * 60 * 60 * 24))} 天
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* 已分享 */}
                                                <div className="p-3 bg-white/8 rounded-2xl flex items-center gap-4 shadow-xl custom-button-trans-override">
                                                    <div className="p-3 bg-purple-500/20 rounded-xl">
                                                        <FolderOutput size={30} className="text-purple-400" />
                                                    </div>
                                                    <div className="flex-1 transition-all duration-200">
                                                        <p className="text-sm text-gray-300 transition-all duration-200">
                                                            你分享的檔案數
                                                        </p>
                                                        {isLoadingStatistics ? (
                                                            <Spinner size="md" color="default" variant="dots" classNames={{ wrapper: "!h-0", base: "h-8" }} />
                                                        ) : (
                                                            <p className="text-white font-semibold text-2xl tracking-wide">{statistics.filesShared} 個</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* 已收到 */}
                                                <div className="p-3 bg-white/8 rounded-2xl flex items-center gap-4 shadow-xl custom-button-trans-override">
                                                    <div className="p-3 bg-orange-500/20 rounded-xl">
                                                        <FolderInput size={30} className="text-orange-400" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm text-gray-300">
                                                            你收到的檔案數
                                                        </p>
                                                        {isLoadingStatistics ? (
                                                            <Spinner size="md" color="default" variant="dots" classNames={{ wrapper: "!h-0", base: "h-8" }} />
                                                        ) : (
                                                            <p className="text-white font-semibold text-2xl tracking-wide">{statistics.filesReceived} 個</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* 最後登入 */}
                                                <div className="p-3 bg-white/8 rounded-2xl flex items-center gap-4 shadow-xl custom-button-trans-override">
                                                    <div className="p-3 bg-green-500/20 rounded-xl">
                                                        <Clock size={30} className="text-green-400" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm text-gray-300">
                                                            最後登入時間在
                                                        </p>
                                                        {loading ? (
                                                            <Spinner size="md" color="default" variant="dots" classNames={{ wrapper: "!h-0", base: "h-8" }} />
                                                        ) : (
                                                            <p className="text-white font-semibold text-2xl tracking-widest">
                                                                {getRelativeTime(user.metadata.lastSignInTime!)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right side - Storage Usage */}
                                            <div className="col-span-5 p-3 bg-white/8 rounded-2xl shadow-xl h-full custom-button-trans-override">
                                                <div className="flex flex-col h-full gap-6">
                                                    <div className="flex items-center gap-4">
                                                        {storageData.percentage >= 85 ? (
                                                            <div className="p-3 rounded-xl bg-amber-500/20" >
                                                                <IoAlertOutline size={32} className="shrink-0 rounded-full bg-amber-500 p-1 text-zinc-900 drop-shadow-2xl" />
                                                            </div>
                                                        ) : (
                                                            <div className="p-3 rounded-xl bg-emerald-600/40" >
                                                                <Check size={32} className="shrink-0 rounded-full bg-emerald-500 p-1 text-zinc-900 drop-shadow-2xl" />
                                                            </div>
                                                        )}
                                                        <div className="flex-1">
                                                            <p className="text-sm text-gray-300">
                                                                容量使用情況
                                                            </p>
                                                            <div className="text-white text-xl font-semibold tracking-wider">
                                                                {storageData.percentage >= 85 ? (
                                                                    <span>需要注意：可用空間剩下 {Math.round(100 - storageData.percentage)}%</span>
                                                                ) : (
                                                                    <span>一切正常：可用空間還剩 {Math.round(100 - storageData.percentage)}%</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 flex items-center justify-between px-8">
                                                        <div className="flex flex-col gap-4 flex-1 max-w-lg">
                                                            <div className="space-y-6">
                                                                <div className="flex items-baseline justify-between border-b border-white/10 pb-3">
                                                                    <span className="text-gray-400 text-lg">已使用</span>
                                                                    <span className="text-white font-semibold text-xl tracking-wider">{storageData.formattedUsed}</span>
                                                                </div>
                                                                <div className="flex items-baseline justify-between border-b border-white/10 pb-3">
                                                                    <span className="text-gray-400 text-lg">剩餘可用</span>
                                                                    <span className="text-white font-semibold text-xl tracking-wider">
                                                                        {(() => {
                                                                            const usedBytes = storageData.usedBytes;
                                                                            const quotaBytes = storageData.quotaBytes;
                                                                            const remainingBytes = quotaBytes - usedBytes;
                                                                            const units = ['B', 'KB', 'MB', 'GB', 'TB'];
                                                                            let size = remainingBytes;
                                                                            let unitIndex = 0;
                                                                            while (size >= 1024 && unitIndex < units.length - 1) {
                                                                                size /= 1024;
                                                                                unitIndex++;
                                                                            }
                                                                            return `${size.toFixed(2)} ${units[unitIndex]}`;
                                                                        })()}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-baseline justify-between border-b border-white/10 pb-3">
                                                                    <span className="text-gray-400 text-lg">總容量</span>
                                                                    <span className="text-white font-semibold text-xl tracking-wider">{storageData.formattedQuota}</span>
                                                                </div>
                                                            </div>
                                                            <span className="text-gray-400 text-sm mt--6 flex gap-3 items-center text-justify">
                                                                <Info size={24} className="shrink-0" /> 容量計算可能因您所處的地區或網路連線狀況而有所延遲。
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-center pl-12">
                                                            {isLoadingStorage ? (
                                                                <CircularProgress
                                                                    size="lg"
                                                                    strokeWidth={2}
                                                                    aria-label="Loading storage data"
                                                                    classNames={{
                                                                        svg: "w-56 h-56 drop-shadow-2xl",
                                                                        indicator: "stroke-cyan-400",
                                                                        track: "stroke-white/20"
                                                                    }}
                                                                />
                                                            ) : (
                                                                <CircularProgress
                                                                    size="lg"
                                                                    value={storageData.percentage}
                                                                    strokeWidth={2}
                                                                    showValueLabel={true}
                                                                    aria-label="Storage usage"
                                                                    classNames={{
                                                                        svg: "w-56 h-56 drop-shadow-2xl",
                                                                        indicator: storageData.percentage >= 90
                                                                            ? "stroke-red-500"
                                                                            : storageData.percentage >= 75
                                                                                ? "stroke-amber-500"
                                                                                : "stroke-cyan-500",
                                                                        track: "stroke-white/20",
                                                                        value: "text-4xl font-semibold text-white tracking-widest"
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>

                            {/* Second Row - Security Settings */}
                            <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                                <CardHeader className="pb-2 pt-6 px-6 flex-row items-center gap-3">
                                    <div className="bg-orange-600/30 p-3 rounded-xl">
                                        <Shield size={24} className="text-orange-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-xl text-white">帳號安全</h4>
                                        <p className="text-gray-300 text-sm">管理登入資訊和安全設定</p>
                                    </div>
                                </CardHeader>
                                <CardBody className="px-6 py-6">
                                    <div className="grid grid-cols-3 gap-6">
                                        {/* Email */}
                                        <Popover
                                            isOpen={emailPopover.isOpen}
                                            placement="top"
                                            showArrow={true}
                                            onOpenChange={(open) => setEmailPopover({ ...emailPopover, isOpen: open })}
                                            offset={8}
                                            classNames={{
                                                base: [
                                                    emailPopover.type === 'success' ? 'before:bg-emerald-700' : 'before:bg-rose-800',
                                                ],
                                                content: [
                                                    emailPopover.type === 'success' ? 'bg-emerald-600 border-emerald-700' : 'bg-rose-500 border-rose-800',
                                                    "border-2",
                                                ].join(" "),
                                            }}
                                        >
                                            <div className="p-5 bg-white/8 rounded-2xl shadow-xl custom-button-trans-override">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-cyan-600/30 p-3 rounded-full">
                                                            <Mail size={24} className="text-cyan-400" />
                                                        </div>
                                                        <span className="text-white text-lg tracking-wider">
                                                            電子郵件
                                                        </span>
                                                    </div>
                                                    <PopoverTrigger>
                                                        <CustomButton
                                                            variant="blur"
                                                            size="md"
                                                            onPress={onEmailModalOpen}
                                                            className="text-gray-300 hover:text-white border-white/20 text-base"
                                                            startContent={
                                                                <PenLine size={18} className="flex-shrink-0" />
                                                            }
                                                        >
                                                            變更
                                                        </CustomButton>
                                                    </PopoverTrigger>
                                                </div>
                                                <p className="text-white font-medium text-lg mb-4 pl-2 break-all">{user.email}</p>
                                                <Popover
                                                    isOpen={verifyEmailPopover.isOpen && !!verifyEmailPopover.message}
                                                    placement="bottom"
                                                    showArrow={true}
                                                    onOpenChange={(open) => setVerifyEmailPopover({ ...verifyEmailPopover, isOpen: open })}
                                                    offset={8}
                                                    classNames={{
                                                        base: [
                                                            verifyEmailPopover.type === 'success' ? 'before:bg-emerald-700' : 'before:bg-rose-800',
                                                        ],
                                                        content: [
                                                            verifyEmailPopover.type === 'success' ? 'bg-emerald-600 border-emerald-700' : 'bg-rose-500 border-rose-800',
                                                            "border-2",
                                                        ].join(" "),
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2 flex-wrap pl-2">
                                                        {user.emailVerified ? (
                                                            <Chip size="md" startContent={<Check size={18} className="flex-shrink-0" />} className="text-zinc-800 text-sm p-2 bg-emerald-500 h-8" >
                                                                已驗證
                                                            </Chip>
                                                        ) : (
                                                            <>
                                                                <Chip size="md" startContent={<X size={18} className="flex-shrink-0" />} className="text-white bg-rose-500 text-sm p-2 h-8">
                                                                    未驗證
                                                                </Chip>
                                                                <PopoverTrigger>
                                                                    <CustomButton
                                                                        variant="blur"
                                                                        size="sm"
                                                                        radius="full"
                                                                        onPress={handleSendVerificationEmail}
                                                                        className="text-sky-400 text-sm font-medium"
                                                                        startContent={
                                                                            <Send size={18} className="flex-shrink-0" />
                                                                        }
                                                                    >
                                                                        發送驗證信
                                                                    </CustomButton>
                                                                </PopoverTrigger>
                                                            </>
                                                        )}
                                                    </div>
                                                    <PopoverContent>
                                                        <div className="px-3 py-2">
                                                            <div className="flex items-center gap-2">
                                                                {verifyEmailPopover.type === 'success' ? (
                                                                    <Check size={20} className="text-white" />
                                                                ) : (
                                                                    <AlertTriangle size={20} className="text-white" />
                                                                )}
                                                                <span className="text-base text-white font-medium">{verifyEmailPopover.message}</span>
                                                            </div>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            <PopoverContent>
                                                <div className="px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        {emailPopover.type === 'success' ? (
                                                            <Check size={20} className="text-white" />
                                                        ) : (
                                                            <AlertTriangle size={20} className="text-white" />
                                                        )}
                                                        <span className="text-base text-white font-medium">{emailPopover.message}</span>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>

                                        {/* Password */}
                                        <Popover
                                            isOpen={passwordPopover.isOpen}
                                            placement="top"
                                            showArrow={true}
                                            onOpenChange={(open) => setPasswordPopover({ ...passwordPopover, isOpen: open })}
                                            offset={8}
                                            classNames={{
                                                base: [
                                                    passwordPopover.type === 'success' ? 'before:bg-emerald-700' : 'before:bg-rose-800',
                                                ],
                                                content: [
                                                    passwordPopover.type === 'success' ? 'bg-emerald-600 border-emerald-700' : 'bg-rose-500 border-rose-800',
                                                    "border-2",
                                                ].join(" "),
                                            }}
                                        >
                                            <div className="p-5 bg-white/8 rounded-2xl shadow-xl custom-button-trans-override">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="bg-teal-600/30 p-3 rounded-full" >
                                                            <Key size={24} className="text-teal-500" />
                                                        </div>
                                                        <span className="text-white text-lg tracking-wdier" >
                                                            密碼
                                                        </span>
                                                    </div>
                                                    <PopoverTrigger>
                                                        <CustomButton
                                                            variant="blur"
                                                            size="md"
                                                            onPress={onPasswordModalOpen}
                                                            className="text-gray-300 hover:text-white border-white/20 text-base"
                                                            startContent={
                                                                <PenLine size={18} className="flex-shrink-0" />
                                                            }
                                                        >
                                                            變更
                                                        </CustomButton>
                                                    </PopoverTrigger>
                                                </div>
                                                <p className="text-white font-medium text-lg mb-4 pl-2 tracking-widest">••••••••••••••••</p>
                                                <div className="flex items-center gap-2 pl-2">
                                                    <Chip size="md" startContent={<Info size={18} className="flex-shrink-0 mr-1" />} className="text-zinc-800 text-sm p-2 h-8 bg-sky-400" >請定期更新密碼來確保帳號安全</Chip>
                                                </div>
                                            </div>
                                            <PopoverContent>
                                                <div className="px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        {passwordPopover.type === 'success' ? (
                                                            <Check size={20} className="text-white" />
                                                        ) : (
                                                            <AlertTriangle size={20} className="text-white" />
                                                        )}
                                                        <span className="text-base text-white font-medium">{passwordPopover.message}</span>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>

                                        {/* Login History */}
                                        <div className="p-5 bg-white/8 rounded-2xl shadow-xl custom-button-trans-override">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-indigo-500/30 p-3 rounded-full" >
                                                        <History size={24} className="text-indigo-400" />
                                                    </div>
                                                    <span className="text-white text-lg tracking-wider">
                                                        登入紀錄
                                                    </span>
                                                </div>
                                                <CustomButton
                                                    variant="blur"
                                                    size="md"
                                                    startContent={<ExternalLink size={18} className="flex-shrink-0" />}
                                                    onPress={() => {
                                                        loadLoginHistory();
                                                        onLoginHistoryDrawerOpen();
                                                    }}
                                                    className="text-gray-300 hover:text-white border-white/20 text-base"
                                                >
                                                    查看
                                                </CustomButton>
                                            </div>
                                            <div className="space-y-1 pl-2">
                                                <div className="text-base text-white font-medium flex flex-col gap-1 tracking-wider" >
                                                    <span>🕓 {recentLogin ? formatDate(recentLogin.timestamp) : "載入中..."}</span>
                                                    <span>{getDeviceIcon(recentLogin?.device || getDeviceInfo().device)} {recentLogin?.device || getDeviceInfo().device}</span>
                                                    <span>📍 {recentLogin?.location || "載入中..."}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>

                            {/* Danger Zone */}
                            <Card className="bg-red-500/20 backdrop-blur-sm" shadow="lg">
                                <CardHeader className="pb-2 pt-6 px-6 flex-row items-center gap-3">
                                    <div className="bg-red-600/20 p-3 rounded-xl">
                                        <AlertTriangle size={24} className="text-rose-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-red-200">危險區域</h4>
                                        <p className="text-rose-300 text-sm">這些操作無法復原，請謹慎執行</p>
                                    </div>
                                </CardHeader>
                                <CardBody className="px-6 py-6">
                                    <div className="grid grid-cols-3 gap-6">
                                        <Popover
                                            isOpen={deleteFilesPopover.isOpen}
                                            placement="top"
                                            showArrow={true}
                                            onOpenChange={(open) => setDeleteFilesPopover({ ...deleteFilesPopover, isOpen: open })}
                                            offset={8}
                                            classNames={{
                                                base: [
                                                    deleteFilesPopover.type === 'success' ? 'before:bg-emerald-700' : 'before:bg-rose-800',
                                                ],
                                                content: [
                                                    deleteFilesPopover.type === 'success' ? 'bg-emerald-600 border-emerald-700' : 'bg-rose-500 border-rose-800',
                                                    "border-2",
                                                ].join(" "),
                                            }}
                                        >
                                            <div className="relative p-5 bg-white/8 rounded-2xl shadow-2xl custom-button-trans-override overflow-hidden flex flex-col">
                                                <PackageX size={140} className="absolute -top-14 -left-9 text-red-400 opacity-30" style={{ mixBlendMode: 'normal' }} />
                                                <div className="flex items-center justify-between mb-3 relative z-10">
                                                    <div className="flex items-center gap-3 pl-2">
                                                        <span className="text-red-200 text-xl tracking-widest font-semibold">
                                                            刪除所有檔案
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-white font-medium flex-wrap text-justify text-base mb-4 pl-2 relative z-10 flex-1">永久刪除所有已上傳的檔案，此操作無法復原。</p>
                                                <div className="flex justify-end relative z-10">
                                                    <PopoverTrigger>
                                                        <CustomButton
                                                            variant="blur"
                                                            size="md"
                                                            onPress={onDeleteModalOpen}
                                                            className="text-red-400  border-red-500/50 border-2 text-base"
                                                            startContent={
                                                                <Trash2 size={18} className="flex-shrink-0" />
                                                            }
                                                        >
                                                            刪除
                                                        </CustomButton>
                                                    </PopoverTrigger>
                                                </div>
                                            </div>
                                            <PopoverContent>
                                                <div className="px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        {deleteFilesPopover.type === 'success' ? (
                                                            <Check size={20} className="text-white" />
                                                        ) : (
                                                            <AlertTriangle size={20} className="text-white" />
                                                        )}
                                                        <span className="text-base text-white font-medium">{deleteFilesPopover.message}</span>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <div className="relative p-5 bg-white/8 rounded-2xl shadow-2xl custom-button-trans-override overflow-hidden flex flex-col">
                                            <UserRoundXIcon size={140} className="absolute -top-14 -left-9 text-red-400 opacity-30" style={{ mixBlendMode: 'normal' }} />
                                            <div className="flex items-center justify-between mb-3 relative z-10">
                                                <div className="flex items-center gap   -3 pl-2">
                                                    <span className="text-red-200 text-xl tracking-widest font-semibold">
                                                        刪除帳號
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-white font-medium flex-wrap text-justify text-base mb-4 pl-2 relative z-10 flex-1">永久刪除這個帳號，跟 Share Lock 說再見。</p>
                                            <div className="flex justify-end relative z-10">
                                                <CustomButton
                                                    variant="blur"
                                                    size="md"
                                                    onPress={onDeleteAccountModalOpen}
                                                    className="text-red-400  border-red-500/50 border-2 text-base"
                                                    startContent={
                                                        <PiHandWaving size={18} className="flex-shrink-0" />
                                                    }
                                                >
                                                    バイバイ
                                                </CustomButton>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    )}

                    {/* Mobile device layout */}
                    {isMobile && (
                        <div className="space-y-6">
                            {/* Profile Card - Mobile */}
                            <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                                <CardHeader className="pb-2 pt-4 px-4 flex-row items-center gap-3">
                                    <div className="flex items-center gap-3 w-full">
                                        <div className="bg-blue-600/30 p-2 rounded-xl">
                                            <UserRound size={24} className="text-blue-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-base text-white">個人資料</h4>
                                            <p className="text-gray-300 text-xs">管理您的帳號基本資訊</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardBody className="px-4 py-4">
                                    <div className="flex flex-col items-center space-y-5">
                                        <div className="relative">
                                            <Avatar
                                                src={getAvatarUrl()}
                                                className="w-18 h-18"
                                                name={user.displayName || "User"}
                                            />
                                        </div>

                                        <div className="w-full space-y-3">
                                            <Popover
                                                isOpen={namePopover.isOpen}
                                                placement="bottom"
                                                showArrow={true}
                                                onOpenChange={(open) => setNamePopover({ ...namePopover, isOpen: open })}
                                                offset={8}
                                                classNames={{
                                                    base: [
                                                        namePopover.type === 'success' ? 'before:bg-emerald-700' : 'before:bg-rose-800',
                                                    ],
                                                    content: [
                                                        namePopover.type === 'success' ? 'bg-emerald-600 border-emerald-700' : 'bg-rose-500 border-rose-800',
                                                        "border-2",
                                                    ].join(" "),
                                                }}
                                            >
                                                <PopoverTrigger>
                                                    <div className="flex items-center justify-between p-3.5 bg-white/20 hover:bg-white/30 rounded-2xl shadow-xl border border-white/30 transition-all duration-200 h-14">
                                                        <span className="text-white text-base">使用者名稱</span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-white font-medium text-base">{user.displayName || "未設定"}</span>
                                                            <Button
                                                                isIconOnly
                                                                className="custom-button-trans-override bg-zinc-400/50 shadow-xl group"
                                                                size="sm"
                                                                radius="full"
                                                                onPress={onNameModalOpen}
                                                            >
                                                                <PenLine size={18} className="text-neutral-900 group-hover:text-blue-500 transition-all duration-200" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </PopoverTrigger>
                                                <PopoverContent>
                                                    <div className="px-3 py-2">
                                                        <div className="flex items-center gap-2">
                                                            {namePopover.type === 'success' ? (
                                                                <Check size={20} className="text-white" />
                                                            ) : (
                                                                <AlertTriangle size={20} className="text-white" />
                                                            )}
                                                            <span className="text-base text-white font-medium">{namePopover.message === "" ? "你好，打 maimai 嗎？" : namePopover.message}</span>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>

                                            <Popover
                                                isOpen={avatarPopover.isOpen}
                                                placement="bottom"
                                                showArrow={true}
                                                onOpenChange={(open) => setAvatarPopover({ ...avatarPopover, isOpen: open })}
                                                offset={8}
                                                classNames={{
                                                    base: [
                                                        avatarPopover.type === 'success' ? 'before:bg-emerald-700' : 'before:bg-rose-800',
                                                    ],
                                                    content: [
                                                        avatarPopover.type === 'success' ? 'bg-emerald-600 border-emerald-700' : 'bg-rose-500 border-rose-800',
                                                        "border-2",
                                                    ].join(" "),
                                                    trigger: [
                                                        "transition-all duration-200",
                                                    ],
                                                }}
                                            >
                                                <PopoverTrigger>
                                                    <div>
                                                        <CustomSelect
                                                            label="頭像來源"
                                                            className="custom-button-trans-override shadow-xl"
                                                            selectedKeys={new Set([avatarSource])}
                                                            onSelectionChange={(keys) => handleAvatarSourceChange(Array.from(keys)[0] as string)}
                                                            size="md"
                                                            disabledKeys={disabledAvatarSources}
                                                            isDisabled={avatarPopover.isOpen}
                                                        >
                                                            <CustomSelectItem key="gravatar">Gravatar</CustomSelectItem>
                                                            <CustomSelectItem key="google">Google</CustomSelectItem>
                                                            <CustomSelectItem key="github">GitHub</CustomSelectItem>
                                                        </CustomSelect>
                                                    </div>
                                                </PopoverTrigger>
                                                <PopoverContent>
                                                    <div className="px-3 py-2">
                                                        <div className="flex items-center gap-2">
                                                            {avatarPopover.type === 'success' ? (
                                                                <Check size={20} className="text-white" />
                                                            ) : (
                                                                <AlertTriangle size={20} className="text-white" />
                                                            )}
                                                            <span className="text-base text-white font-medium">{avatarPopover.message == "" ? "你好，打 maimai 嗎？" : avatarPopover.message}</span>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>


                                            {/* Provider Links Section */}
                                            <div className="my-4 flex items-center gap-3">
                                                <BadgePlus size={28} className="text-indigo-500" />
                                                <span className="text-gray-300 text-lg font-medium">第三方服務</span>
                                            </div>
                                            <div className="flex gap-3">
                                                <Button
                                                    onPress={() => isGoogleLinked() ? handleUnlinkProvider('google.com') : handleLinkProvider('google.com')}
                                                    className="bg-white flex flex-col items-center justify-center gap-2 p-3 rounded-2xl shadow-xl custom-button-trans-override cursor-pointer transition-all w-full h-fit"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <FcGoogle size={24} className="flex-shrink-0" />
                                                        <span className="text-black font-medium text-base">Google</span>
                                                    </div>
                                                    <span className={`flex text-sm tracking-widest font-semibold gap-2 items-center ${isGoogleLinked() ? 'text-rose-500' : 'text-emerald-400'
                                                        }`}>
                                                        {isGoogleLinked() ? <Unlink size={20} /> : <LinkIcon size={20} />}
                                                        {isGoogleLinked() ? '解除綁定' : '綁定'}
                                                    </span>
                                                </Button>
                                                <Button
                                                    onPress={() => isGithubLinked() ? handleUnlinkProvider('github.com') : handleLinkProvider('github.com')}
                                                    className="bg-zinc-900 flex flex-col items-center justify-center gap-2 p-3 rounded-2xl shadow-xl custom-button-trans-override cursor-pointer transition-all w-full h-fit"
                                                >
                                                    <div className="flex items-center gap-3" >
                                                        <FaGithub size={24} className="flex-shrink-0 text-white" />
                                                        <span className="text-white font-medium text-base" >Github</span>
                                                    </div>
                                                    <span className={`flex text-sm tracking-widest font-semibold gap-2 items-center ${isGithubLinked() ? 'text-rose-500' : 'text-emerald-500'
                                                        }`}>
                                                        {isGithubLinked() ? <Unlink size={20} /> : <LinkIcon size={20} />}
                                                        {isGithubLinked() ? '解除綁定' : '綁定'}
                                                    </span>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>

                            {/* Stats and Storage Card - Mobile */}
                            <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                                <CardHeader className="pb-2 pt-4 px-4 flex-row items-center gap-3">
                                    <div className="bg-purple-600/30 p-2 rounded-xl">
                                        <ChartPie size={24} className="text-purple-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-base text-white">帳號使用統計</h4>
                                        <p className="text-gray-300 text-xs">您的帳號使用量與統計資料</p>
                                    </div>
                                </CardHeader>
                                <CardBody className="px-4 py-4">
                                    <div className="space-y-3">
                                        {/* Statistics - Grid Layout (2x2) */}
                                        <div className="grid grid-cols-2 gap-3">
                                            {/* 加入天數 */}
                                            <div className="p-3 bg-white/8 rounded-2xl flex flex-col gap-2 shadow-xl custom-button-trans-override">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-blue-500/20 rounded-xl">
                                                        <CalendarCheck size={20} className="text-blue-400" />
                                                    </div>
                                                    <p className="text-sm text-gray-300">
                                                        註冊天數
                                                    </p>
                                                </div>
                                                <div className="pl-1">
                                                    {loading ? (
                                                        <Spinner size="md" color="default" variant="dots" classNames={{ wrapper: "!h-0", base: "h-6" }} className="flex items-center" />
                                                    ) : (
                                                        <p className="text-white font-semibold text-xl tracking-wide">
                                                            {Math.floor((new Date().getTime() - new Date(user.metadata.creationTime!).getTime()) / (1000 * 60 * 60 * 24))} 天
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 最後登入 */}
                                            <div className="p-3 bg-white/8 rounded-2xl flex flex-col gap-2 shadow-xl custom-button-trans-override">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-green-500/20 rounded-xl">
                                                        <Clock size={20} className="text-green-400" />
                                                    </div>
                                                    <p className="text-sm text-gray-300">
                                                        最後登入
                                                    </p>
                                                </div>
                                                <div className="pl-1">
                                                    {loading ? (
                                                        <Spinner size="md" color="default" variant="dots" classNames={{ wrapper: "!h-0", base: "h-6" }} className="flex items-center" />
                                                    ) : (
                                                        <p className="text-white font-semibold text-xl tracking-wide">
                                                            {getRelativeTime(user.metadata.lastSignInTime!)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 已分享 */}
                                            <div className="p-3 bg-white/8 rounded-2xl flex flex-col gap-2 shadow-xl custom-button-trans-override">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-purple-500/20 rounded-xl">
                                                        <FolderOutput size={20} className="text-purple-400" />
                                                    </div>
                                                    <p className="text-sm text-gray-300">
                                                        已分享
                                                    </p>
                                                </div>
                                                <div className="pl-1">
                                                    {isLoadingStatistics ? (
                                                        <Spinner size="md" color="default" variant="dots" classNames={{ wrapper: "!h-0", base: "h-6" }} className="flex items-center" />
                                                    ) : (
                                                        <p className="text-white font-semibold text-xl tracking-wide">{statistics.filesShared} 個</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 已收到 */}
                                            <div className="p-3 bg-white/8 rounded-2xl flex flex-col gap-2 shadow-xl custom-button-trans-override">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-orange-500/20 rounded-xl">
                                                        <FolderInput size={20} className="text-orange-400" />
                                                    </div>
                                                    <p className="text-sm text-gray-300">
                                                        已收到
                                                    </p>
                                                </div>
                                                <div className="pl-1">
                                                    {isLoadingStatistics ? (
                                                        <Spinner size="md" color="default" variant="dots" classNames={{ wrapper: "!h-0", base: "h-6" }} className="flex items-center" />
                                                    ) : (
                                                        <p className="text-white font-semibold text-xl tracking-wide">{statistics.filesReceived} 個</p>
                                                    )}
                                                </div>
                                            </div>


                                        </div>

                                        {/* Storage Usage */}
                                        <div className="p-3 bg-white/8 rounded-2xl shadow-xl custom-button-trans-override">
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center gap-4">
                                                    {storageData.percentage >= 85 ? (
                                                        <div className="p-2 rounded-xl bg-amber-500/20" >
                                                            <IoAlertOutline size={24} className="shrink-0 rounded-full bg-amber-500 p-1 text-zinc-900 drop-shadow-2xl" />
                                                        </div>
                                                    ) : (
                                                        <div className="p-2 rounded-xl bg-emerald-600/40" >
                                                            <Check size={24} className="shrink-0 rounded-full bg-emerald-500 p-1 text-zinc-900 drop-shadow-2xl" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1">
                                                        <p className="text-xs text-gray-300">
                                                            容量使用情況
                                                        </p>
                                                        <div className="text-white text-base font-semibold tracking-wider">
                                                            {storageData.percentage >= 85 ? (
                                                                <span>需要注意：可用空間剩下 {Math.round(100 - storageData.percentage)}%</span>
                                                            ) : (
                                                                <span>一切正常：可用空間還剩 {Math.round(100 - storageData.percentage)}%</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between gap-6 pl-2">
                                                    <div className="flex flex-col gap-2 flex-1">
                                                        <div className="space-y-4">
                                                            <div className="flex items-baseline justify-between border-b border-white/10 pb-2">
                                                                <span className="text-gray-400 text-sm">已使用</span>
                                                                <span className="text-white font-semibold text-sm tracking-wider">{storageData.formattedUsed}</span>
                                                            </div>
                                                            <div className="flex items-baseline justify-between border-b border-white/10 pb-2">
                                                                <span className="text-gray-400 text-sm">剩餘可用</span>
                                                                <span className="text-white font-semibold text-sm tracking-wider">
                                                                    {(() => {
                                                                        const usedBytes = storageData.usedBytes;
                                                                        const quotaBytes = storageData.quotaBytes;
                                                                        const remainingBytes = quotaBytes - usedBytes;
                                                                        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
                                                                        let size = remainingBytes;
                                                                        let unitIndex = 0;
                                                                        while (size >= 1024 && unitIndex < units.length - 1) {
                                                                            size /= 1024;
                                                                            unitIndex++;
                                                                        }
                                                                        return `${size.toFixed(2)} ${units[unitIndex]}`;
                                                                    })()}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-baseline justify-between border-b border-white/10 pb-2">
                                                                <span className="text-gray-400 text-sm">總容量</span>
                                                                <span className="text-white font-semibold text-sm tracking-wider">{storageData.formattedQuota}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-center">
                                                        {isLoadingStorage ? (
                                                            <CircularProgress
                                                                size="lg"
                                                                strokeWidth={2}
                                                                aria-label="Loading storage data"
                                                                classNames={{
                                                                    svg: "w-32 h-32 drop-shadow-2xl",
                                                                    indicator: "stroke-cyan-400",
                                                                    track: "stroke-white/20"
                                                                }}
                                                            />
                                                        ) : (
                                                            <CircularProgress
                                                                size="lg"
                                                                value={storageData.percentage}
                                                                strokeWidth={2}
                                                                showValueLabel={true}
                                                                classNames={{
                                                                    svg: "w-32 h-32 drop-shadow-2xl",
                                                                    indicator: storageData.percentage >= 90
                                                                        ? "stroke-red-500"
                                                                        : storageData.percentage >= 75
                                                                            ? "stroke-amber-500"
                                                                            : "stroke-cyan-500",
                                                                    track: "stroke-white/20",
                                                                    value: "text-2xl font-semibold text-white tracking-widest"
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-gray-400 text-xs flex gap-2 items-center text-justify px-2 mb-2">
                                                    <Info size={18} className="shrink-0" /> 容量計算可能因您所處的地區或網路連線狀況而有所延遲。
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>

                            {/* Account Security - Mobile */}
                            <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                                <CardHeader className="pb-2 pt-4 px-4 flex-row items-center gap-3">
                                    <div className="bg-orange-600/30 p-2 rounded-xl">
                                        <Shield size={24} className="text-orange-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-base text-white">帳號安全</h4>
                                        <p className="text-gray-300 text-xs">管理登入資訊和安全設定</p>
                                    </div>
                                </CardHeader>
                                <CardBody className="px-4 py-4">
                                    <div className="space-y-3">
                                        {/* Email - Mobile */}
                                        <Popover
                                            isOpen={emailPopover.isOpen}
                                            placement="bottom"
                                            showArrow={true}
                                            onOpenChange={(open) => setEmailPopover({ ...emailPopover, isOpen: open })}
                                            offset={8}
                                            classNames={{
                                                base: [
                                                    emailPopover.type === 'success' ? 'before:bg-emerald-700' : 'before:bg-rose-800',
                                                ],
                                                content: [
                                                    emailPopover.type === 'success' ? 'bg-emerald-600 border-emerald-700' : 'bg-rose-500 border-rose-800',
                                                    "border-2",
                                                ].join(" "),
                                            }}
                                        >
                                            <div className="p-5 bg-white/8 rounded-2xl shadow-xl custom-button-trans-override">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-cyan-600/30 p-2 rounded-full">
                                                            <Mail size={18} className="text-cyan-400" />
                                                        </div>
                                                        <span className="text-white text-base tracking-wider">
                                                            電子郵件
                                                        </span>
                                                    </div>
                                                    <PopoverTrigger>
                                                        <CustomButton
                                                            variant="blur"
                                                            size="sm"
                                                            radius="md"
                                                            onPress={onEmailModalOpen}
                                                            className="text-gray-300 hover:text-white border-white/20 text-sm"
                                                            startContent={
                                                                <PenLine size={16} className="flex-shrink-0" />
                                                            }
                                                        >
                                                            變更
                                                        </CustomButton>
                                                    </PopoverTrigger>
                                                </div>
                                                <p className="text-white font-medium text-base mb-4 pl-2 break-all">{user.email}</p>
                                                <Popover
                                                    isOpen={verifyEmailPopover.isOpen && !!verifyEmailPopover.message}
                                                    placement="bottom"
                                                    showArrow={true}
                                                    onOpenChange={(open) => setVerifyEmailPopover({ ...verifyEmailPopover, isOpen: open })}
                                                    offset={8}
                                                    classNames={{
                                                        base: [
                                                            verifyEmailPopover.type === 'success' ? 'before:bg-emerald-700' : 'before:bg-rose-800',
                                                        ],
                                                        content: [
                                                            verifyEmailPopover.type === 'success' ? 'bg-emerald-600 border-emerald-700' : 'bg-rose-500 border-rose-800',
                                                            "border-2",
                                                        ].join(" "),
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2 flex-wrap pl-2">
                                                        {user.emailVerified ? (
                                                            <Chip size="sm" startContent={<Check size={16} className="flex-shrink-0" />} className="text-zinc-800 text-xs p-2 bg-emerald-500 h-8" >
                                                                已驗證
                                                            </Chip>
                                                        ) : (
                                                            <>
                                                                <Chip size="sm" startContent={<X size={16} className="flex-shrink-0" />} className="text-white bg-rose-500 text-xs p-2 h-8">
                                                                    未驗證
                                                                </Chip>
                                                                <PopoverTrigger>
                                                                    <CustomButton
                                                                        variant="blur"
                                                                        size="sm"
                                                                        radius="full"
                                                                        onPress={handleSendVerificationEmail}
                                                                        className="text-sky-400 text-xs font-medium"
                                                                        startContent={
                                                                            <Send size={16} className="flex-shrink-0" />
                                                                        }
                                                                    >
                                                                        發送驗證信
                                                                    </CustomButton>
                                                                </PopoverTrigger>
                                                            </>
                                                        )}
                                                    </div>
                                                    <PopoverContent>
                                                        <div className="px-3 py-2">
                                                            <div className="flex items-center gap-2">
                                                                {verifyEmailPopover.type === 'success' ? (
                                                                    <Check size={20} className="text-white" />
                                                                ) : (
                                                                    <AlertTriangle size={20} className="text-white" />
                                                                )}
                                                                <span className="text-base text-white font-medium">{verifyEmailPopover.message}</span>
                                                            </div>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            <PopoverContent>
                                                <div className="px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        {emailPopover.type === 'success' ? (
                                                            <Check size={16} className="text-white" />
                                                        ) : (
                                                            <AlertTriangle size={16} className="text-white" />
                                                        )}
                                                        <span className="text-sm text-white font-medium">{emailPopover.message}</span>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>

                                        {/* Password - Mobile */}
                                        <Popover
                                            isOpen={passwordPopover.isOpen}
                                            placement="bottom"
                                            showArrow={true}
                                            onOpenChange={(open) => setPasswordPopover({ ...passwordPopover, isOpen: open })}
                                            offset={8}
                                            classNames={{
                                                base: [
                                                    passwordPopover.type === 'success' ? 'before:bg-emerald-700' : 'before:bg-rose-800',
                                                ],
                                                content: [
                                                    passwordPopover.type === 'success' ? 'bg-emerald-600 border-emerald-700' : 'bg-rose-500 border-rose-800',
                                                    "border-2",
                                                ].join(" "),
                                            }}
                                        >
                                            <div className="p-5 bg-white/8 rounded-2xl shadow-xl custom-button-trans-override">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="bg-teal-600/30 p-2 rounded-full" >
                                                            <Key size={18} className="text-teal-500" />
                                                        </div>
                                                        <span className="text-white text-base tracking-wider" >
                                                            密碼
                                                        </span>
                                                    </div>
                                                    <PopoverTrigger>
                                                        <CustomButton
                                                            variant="blur"
                                                            size="sm"
                                                            radius="md"
                                                            onPress={onPasswordModalOpen}
                                                            className="text-gray-300 hover:text-white border-white/20 text-sm"
                                                            startContent={
                                                                <PenLine size={16} className="flex-shrink-0" />
                                                            }
                                                        >
                                                            變更
                                                        </CustomButton>
                                                    </PopoverTrigger>
                                                </div>
                                                <p className="text-white font-medium text-base mb-4 pl-2 tracking-widest">••••••••••••</p>
                                                <div className="flex items-center gap-2 pl-2">
                                                    <Chip size="sm" startContent={<Info size={16} className="flex-shrink-0 mr-1" />} className="text-zinc-800 text-xs p-2 h-8 bg-sky-400" >請定期更新密碼來確保帳號安全</Chip>
                                                </div>
                                            </div>
                                            <PopoverContent>
                                                <div className="px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        {passwordPopover.type === 'success' ? (
                                                            <Check size={20} className="text-white" />
                                                        ) : (
                                                            <AlertTriangle size={20} className="text-white" />
                                                        )}
                                                        <span className="text-base text-white font-medium">{passwordPopover.message}</span>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>

                                        {/* Login History */}
                                        <div className="p-5 bg-white/8 rounded-2xl shadow-xl custom-button-trans-override">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-indigo-500/30 p-2 rounded-full" >
                                                        <History size={18} className="text-indigo-400" />
                                                    </div>
                                                    <span className="text-white text-base tracking-wider">
                                                        登入紀錄
                                                    </span>
                                                </div>
                                                <CustomButton
                                                    variant="blur"
                                                    size="sm"
                                                    radius="md"
                                                    startContent={<ExternalLink size={16} className="flex-shrink-0" />}
                                                    onPress={() => {
                                                        loadLoginHistory();
                                                        onLoginHistoryDrawerOpen();
                                                    }}
                                                    className="text-gray-300 hover:text-white border-white/20 text-sm"
                                                >
                                                    查看
                                                </CustomButton>
                                            </div>
                                            <div className="space-y-1 pl-2">
                                                <div className="text-base text-white font-medium flex flex-col gap-1 tracking-wider" >
                                                    <span>🕓 {recentLogin ? formatDate(recentLogin.timestamp) : "載入中..."}</span>
                                                    <span>{getDeviceIcon(recentLogin?.device || getDeviceInfo().device)} {recentLogin?.device || getDeviceInfo().device}</span>
                                                    <span>📍 {recentLogin?.location || "載入中..."}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>

                            {/* Danger Zone - Mobile */}
                            <Card className="bg-red-500/20 backdrop-blur-sm" shadow="lg">
                                <CardHeader className="pb-2 pt-4 px-4 flex-row items-center gap-3">
                                    <div className="bg-red-600/20 p-2 rounded-xl">
                                        <AlertTriangle size={24} className="text-rose-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-base text-red-200">危險區域</h4>
                                        <p className="text-rose-300 text-xs">這些操作無法復原，請謹慎執行</p>
                                    </div>
                                </CardHeader>
                                <CardBody className="px-4 py-4">
                                    <div className="space-y-3">
                                        <Popover
                                            isOpen={deleteFilesPopover.isOpen}
                                            placement="top"
                                            showArrow={true}
                                            onOpenChange={(open) => setDeleteFilesPopover({ ...deleteFilesPopover, isOpen: open })}
                                            offset={8}
                                            classNames={{
                                                base: [
                                                    deleteFilesPopover.type === 'success' ? 'before:bg-emerald-700' : 'before:bg-rose-800',
                                                ],
                                                content: [
                                                    deleteFilesPopover.type === 'success' ? 'bg-emerald-600 border-emerald-700' : 'bg-rose-500 border-rose-800',
                                                    "border-2",
                                                ].join(" "),
                                            }}
                                        >
                                            <div className="relative p-5 bg-white/8 rounded-2xl shadow-2xl custom-button-trans-override overflow-hidden flex flex-col">
                                                <PackageX size={100} className="absolute -top-8 -left-6 text-red-400 opacity-30" style={{ mixBlendMode: 'normal' }} />
                                                <div className="flex items-center justify-between mb-3 relative z-10">
                                                    <div className="flex items-center gap-3 pl-2">
                                                        <span className="text-red-200 text-base tracking-widest font-semibold">
                                                            刪除所有檔案
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-white font-medium flex-wrap text-justify text-sm mb-4 pl-2 relative z-10 flex-1">永久刪除所有已上傳的檔案，此操作無法復原。</p>
                                                <div className="flex justify-end relative z-10">
                                                    <PopoverTrigger>
                                                        <CustomButton
                                                            variant="blur"
                                                            size="md"
                                                            onPress={onDeleteModalOpen}
                                                            className="text-red-400 border-red-500/50 border-2 text-base"
                                                            startContent={
                                                                <Trash2 size={18} className="flex-shrink-0" />
                                                            }
                                                        >
                                                            刪除
                                                        </CustomButton>
                                                    </PopoverTrigger>
                                                </div>
                                            </div>
                                            <PopoverContent>
                                                <div className="px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        {deleteFilesPopover.type === 'success' ? (
                                                            <Check size={20} className="text-white" />
                                                        ) : (
                                                            <AlertTriangle size={20} className="text-white" />
                                                        )}
                                                        <span className="text-base text-white font-medium">{deleteFilesPopover.message}</span>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <div className="relative p-5 bg-white/8 rounded-2xl shadow-2xl custom-button-trans-override overflow-hidden flex flex-col">
                                            <UserRoundXIcon size={100} className="absolute -top-8 -left-6 text-red-400 opacity-30" style={{ mixBlendMode: 'normal' }} />
                                            <div className="flex items-center justify-between mb-3 relative z-10">
                                                <div className="flex items-center gap-3 pl-2">
                                                    <span className="text-red-200 text-base tracking-widest font-semibold">
                                                        刪除帳號
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-white font-medium flex-wrap text-justify text-sm mb-4 pl-2 relative z-10 flex-1">永久刪除這個帳號，跟 Share Lock 說再見。</p>
                                            <div className="flex justify-end relative z-10">
                                                <CustomButton
                                                    variant="blur"
                                                    size="md"
                                                    onPress={onDeleteAccountModalOpen}
                                                    className="text-red-400 border-red-500/50 border-2 text-base"
                                                    startContent={
                                                        <PiHandWaving size={18} className="flex-shrink-0" />
                                                    }
                                                >
                                                    バイバイ
                                                </CustomButton>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Modals */}
                {/* Update Display Name Modal */}
                <CustomModal isOpen={isNameModalOpen} onOpenChange={onNameModalOpenChange}>
                    <CustomModalContent>
                        {(onClose) => (
                            <>
                                <CustomModalHeader>
                                    <div className="pt-4">變更使用者名稱</div>
                                </CustomModalHeader>
                                <CustomModalBody>
                                    <div className="custom-input-trans-animate" >
                                        <CustomInput
                                            size="lg"
                                            label="輸入使用者名稱"
                                            value={displayName}
                                            onValueChange={setDisplayName}
                                        />
                                    </div>
                                </CustomModalBody>
                                <CustomModalFooter>
                                    <CustomButton
                                        variant="blur"
                                        onPress={onClose}
                                        className="text-gray-300"
                                    >
                                        取消
                                    </CustomButton>
                                    <CustomButton
                                        variant="blur"
                                        onPress={handleUpdateDisplayName}
                                        isLoading={isUpdating}
                                        isDisabled={!displayName.trim() || displayName === user?.displayName}
                                        className="text-blue-400 border-blue-500/50 border-2 text-base"
                                        spinner={
                                            <Spinner
                                                size="sm"
                                                color="default"
                                            />
                                        }
                                    >
                                        更新
                                    </CustomButton>
                                </CustomModalFooter>
                            </>
                        )}
                    </CustomModalContent>
                </CustomModal>

                {/* Update Email Modal */}
                <CustomModal isOpen={isEmailModalOpen} onOpenChange={onEmailModalOpenChange}>
                    <CustomModalContent>
                        {(onClose) => (
                            <>
                                <CustomModalHeader>
                                    <div className="pt-4">更改電子郵件</div>
                                </CustomModalHeader>
                                <CustomModalBody>
                                    <div className="relative w-full origin-center custom-input-trans-animate">
                                        <CustomInput
                                            size="md"
                                            label="輸入新的電子郵件"
                                            type="email"
                                            onValueChange={setNewEmail}
                                        />
                                    </div>
                                    <div className="relative w-full origin-center custom-input-trans-animate">
                                        <CustomInput
                                            size="md"
                                            label="輸入密碼來確認"
                                            type={showCurrentPassword ? "text" : "password"}
                                            onValueChange={setCurrentPassword}
                                        />
                                        <Button
                                            isIconOnly
                                            variant="light"
                                            aria-label="切換密碼是否可見"
                                            className="absolute right-4 top-[30px] transform -translate-y-1/2 focus:outline-hidden bg-transparent hover:bg-transparent min-w-0 w-auto h-auto p-0 text-gray-300 hover:text-white"
                                            type="button"
                                            onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            {showCurrentPassword ? (
                                                <EyeClosed size={20} />
                                            ) : (
                                                <Eye size={20} />
                                            )}
                                        </Button>
                                    </div>
                                </CustomModalBody>
                                <CustomModalFooter>
                                    <CustomButton
                                        variant="blur"
                                        onPress={onClose}
                                        className="text-gray-300"
                                    >
                                        取消
                                    </CustomButton>
                                    <CustomButton
                                        variant="blur"
                                        onPress={handleUpdateEmail}
                                        isLoading={isUpdating}
                                        isDisabled={!newEmail.trim() || !currentPassword || newEmail === user?.email}
                                        className="text-blue-400 border-blue-500/50 border-2 text-base"
                                        spinner={
                                            <Spinner
                                                size="sm"
                                                color="default"
                                            />
                                        }
                                    >
                                        更新
                                    </CustomButton>
                                </CustomModalFooter>
                            </>
                        )}
                    </CustomModalContent>
                </CustomModal>

                {/* Update Password Modal */}
                <CustomModal isOpen={isPasswordModalOpen} onOpenChange={onPasswordModalOpenChange}>
                    <CustomModalContent>
                        {(onClose) => (
                            <>
                                <CustomModalHeader>
                                    <div className="pt-4">更改密碼</div>
                                </CustomModalHeader>
                                <CustomModalBody>
                                    <div className="relative w-full origin-center custom-input-trans-animate">
                                        <CustomInput
                                            size="md"
                                            label="輸入目前的密碼"
                                            type={showCurrentPassword ? "text" : "password"}
                                            onValueChange={setCurrentPassword}
                                        />
                                        <Button
                                            isIconOnly
                                            variant="light"
                                            aria-label="切換舊密碼是否可見"
                                            className="absolute right-4 top-[30px] transform -translate-y-1/2 focus:outline-hidden bg-transparent hover:bg-transparent min-w-0 w-auto h-auto p-0 text-gray-300 hover:text-white"
                                            type="button"
                                            onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            {showCurrentPassword ? (
                                                <EyeClosed size={20} />
                                            ) : (
                                                <Eye size={20} />
                                            )}
                                        </Button>
                                    </div>
                                    <div className="relative w-full origin-center custom-input-trans-animate">
                                        <CustomInput
                                            size="md"
                                            label="輸入新的密碼"
                                            type={showNewPassword ? "text" : "password"}
                                            onValueChange={setNewPassword}
                                        />
                                        <Button
                                            isIconOnly
                                            variant="light"
                                            aria-label="切換新密碼是否可見"
                                            className="absolute right-4 top-[30px] transform -translate-y-1/2 focus:outline-hidden bg-transparent hover:bg-transparent min-w-0 w-auto h-auto p-0 text-gray-300 hover:text-white"
                                            type="button"
                                            onPress={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? (
                                                <EyeClosed size={20} />
                                            ) : (
                                                <Eye size={20} />
                                            )}
                                        </Button>
                                    </div>
                                    <div className="relative w-full origin-center custom-input-trans-animate">
                                        <CustomInput
                                            size="md"
                                            label="再次輸入新密碼"
                                            type={showConfirmPassword ? "text" : "password"}
                                            onValueChange={setConfirmPassword}
                                            isInvalid={!!(newPassword !== confirmPassword && confirmPassword)}
                                            errorMessage={newPassword !== confirmPassword && confirmPassword ? "*密碼確認不一致" : ""}
                                        />
                                        <Button
                                            isIconOnly
                                            variant="light"
                                            aria-label="切換確認密碼是否可見"
                                            className="absolute right-4 top-[30px] transform -translate-y-1/2 focus:outline-hidden bg-transparent hover:bg-transparent min-w-0 w-auto h-auto p-0 text-gray-300 hover:text-white"
                                            type="button"
                                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeClosed size={20} />
                                            ) : (
                                                <Eye size={20} />
                                            )}
                                        </Button>
                                    </div>
                                </CustomModalBody>
                                <CustomModalFooter>
                                    <CustomButton
                                        variant="blur"
                                        onPress={onClose}
                                        className="text-gray-300"
                                    >
                                        取消
                                    </CustomButton>
                                    <CustomButton
                                        variant="blur"
                                        onPress={handleUpdatePassword}
                                        isLoading={isUpdating}
                                        isDisabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                                        className="text-blue-400  border-blue-500/50 border-2 text-base"
                                        spinner={
                                            <Spinner
                                                size="sm"
                                                color="default"
                                            />
                                        }
                                    >
                                        更新
                                    </CustomButton>
                                </CustomModalFooter>
                            </>
                        )}
                    </CustomModalContent>
                </CustomModal>

                {/* Delete Files Modal */}
                <CustomModal isOpen={isDeleteModalOpen} onOpenChange={onDeleteModalOpenChange}>
                    <CustomModalContent>
                        {(onClose) => (
                            <>
                                <CustomModalHeader>
                                    <AlertTriangle className="text-red-400 flex-shrink-0 pt-4" size={56} />
                                    <div className=" text-red-400 pt-2">刪除所有檔案</div>
                                </CustomModalHeader>
                                <CustomModalBody>
                                    <div className="bg-red-600/20 border-2 border-red-500/50 rounded-lg p-4 shadow-2xl">
                                        <div className="flex flex-col items-start gap-3 pl-2">
                                            <div className="flex flex-col text-rose-200">
                                                <p>若繼續，此操作將會刪除以下資料：</p>
                                                <div>
                                                    <span className="flex flex-row items-center" ><Dot className="flex-shrink-0 -ml-1" />您帳號中的所有檔案。</span>
                                                    <span className="flex flex-row items-center" ><Dot className="flex-shrink-0 -ml-1" />曾創建過的所有分享連結。</span>
                                                    <span className="flex flex-row items-center" ><Dot className="flex-shrink-0 -ml-1" />帳號中關於檔案分享的統計資訊。</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="custom-input-trans-animate">
                                        <CustomInput
                                            label="輸入 'DELETE' 以確認"
                                            size="md"
                                            value={deleteConfirmText}
                                            onValueChange={setDeleteConfirmText}
                                        />
                                    </div>
                                </CustomModalBody>
                                <CustomModalFooter>
                                    <CustomButton
                                        variant="blur"
                                        onPress={onClose}
                                        className="text-gray-300"
                                    >
                                        取消
                                    </CustomButton>
                                    <CustomButton
                                        variant="blur"
                                        onPress={handleDeleteFiles}
                                        isLoading={isUpdating}
                                        isDisabled={deleteConfirmText !== 'DELETE'}
                                        className="text-red-400 border-red-500/50 border-2"
                                        startContent={
                                            <Trash2 size={18} className="flex-shrink-0" />
                                        }
                                        spinner={
                                            <Spinner
                                                size="sm"
                                                color="default"
                                            />
                                        }
                                    >
                                        確認刪除
                                    </CustomButton>
                                </CustomModalFooter>
                            </>
                        )}
                    </CustomModalContent>
                </CustomModal>

                {/* Delete Account Modal */}
                <CustomModal isOpen={isDeleteAccountModalOpen} onOpenChange={onDeleteAccountModalOpenChange}>
                    <CustomModalContent>
                        {(onClose) => (
                            <>
                                <CustomModalHeader>
                                    <AlertTriangle className="text-red-400 flex-shrink-0 pt-4" size={56} />
                                    <div className=" text-red-400 pt-2">刪除此帳號</div>
                                </CustomModalHeader>
                                <CustomModalBody>
                                    <div className="bg-red-600/20 border-2 border-red-500/50 rounded-lg p-4 shadow-2xl">
                                        <div className="flex flex-col items-start gap-3 pl-2">
                                            <div className="flex flex-col text-rose-200">
                                                <p>若繼續，此操作將會影響：</p>
                                                <div>
                                                    <span className="flex flex-row items-center" ><Dot className="flex-shrink-0 -ml-1" />永久刪除您帳號中的所有資料</span>
                                                    <span className="flex flex-row items-center" ><Dot className="flex-shrink-0 -ml-1" />立即登出所有裝置。</span>
                                                    <span className="flex flex-row items-center gap-3 mt-2 ml-0.5 mr-3" ><CircleAlert className="flex-shrink-0 self-center" size={26} /><div className="text-justify text-sm">請注意，此操作無法復原，我們也無法恢復您的任何資料。</div></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="custom-input-trans-animate">
                                        <CustomInput
                                            label="輸入密碼來確認"
                                            type="password"
                                            size="md"
                                            value={currentPassword}
                                            onValueChange={setCurrentPassword}
                                        />
                                    </div>
                                </CustomModalBody>
                                <CustomModalFooter>
                                    <CustomButton
                                        variant="blur"
                                        onPress={onClose}
                                        className="text-gray-300"
                                    >
                                        取消
                                    </CustomButton>
                                    <CustomButton
                                        variant="blur"
                                        onPress={handleDeleteAccount}
                                        isLoading={isUpdating}
                                        isDisabled={!currentPassword}
                                        className="text-red-400 border-red-500/50 border-2"
                                        startContent={
                                            <PiHandWaving size={18} className="flex-shrink-0" />
                                        }
                                        spinner={
                                            <Spinner
                                                size="sm"
                                                color="default"
                                            />
                                        }
                                    >
                                        刪除帳號
                                    </CustomButton>
                                </CustomModalFooter>
                            </>
                        )}
                    </CustomModalContent>
                </CustomModal>

                {/* Login History Drawer */}
                <CustomDrawer
                    isOpen={isLoginHistoryDrawerOpen}
                    onOpenChange={onLoginHistoryDrawerOpenChange}
                    placement="right"
                    backdrop="blur"
                    size="xl"
                    variant="blur"
                >
                    <CustomDrawerContent>
                        {(onClose) => (
                            <>
                                <CustomDrawerHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="text-xl font-bold flex items-center gap-3 mt-2">
                                            <div className="p-2 rounded-xl bg-indigo-500/30 flex" >
                                                <History size={30} className="text-indigo-400" />
                                            </div>
                                            <div>
                                                <div className="text-white font-bold text-xl" >登入紀錄</div>
                                                <p className="text-gray-300 font-normal text-sm" >檢查你的帳號登入情形</p>
                                            </div>
                                        </div>
                                    </div>
                                </CustomDrawerHeader>
                                <CustomDrawerBody>
                                    <div className="space-y-5">
                                        <Card className="bg-blue-400/20 backdrop-blur-sm  rounded-2xl custom-button-trans-override shadow-xl">
                                            <CardBody className="p-4">
                                                <div className="flex flex-col items-start gap-2">
                                                    <span className="flex flex-row gap-2 bg-linear-65 from-blue-500 to-cyan-300 bg-clip-text text-transparent mt-1 items-center font-semibold text-lg tracking-wider ml-2"><Shield size={24} className=" text-sky-400 flex-shrink-0" />我們重視你的帳號安全</span>
                                                    <div className="ml-2 text-blue-300 text-sm flex flex-col">
                                                        <span className="flex flex-row items-center" ><Dot className="flex-shrink-0" />發現異常的登入時，請立即修改密碼。</span>
                                                        <span className="flex flex-row items-center" ><Dot className="flex-shrink-0" />請驗證您的電子信箱來確保帳號安全。</span>
                                                        <span className="flex flex-row items-center" ><Dot className="flex-shrink-0" />使用公共設備登入後，請記得登出。</span>
                                                    </div>
                                                </div>
                                            </CardBody>
                                        </Card>

                                        {isLoadingHistory ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Spinner
                                                    color="default"
                                                    size="lg"
                                                    label="載入中..."
                                                    classNames={{
                                                        label: "text-white mt-2"
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="space-y-5">
                                                {loginHistory.length === 0 ? (
                                                    <div className="text-center py-8">
                                                        <p className="text-gray-400 text-base">暫無登入紀錄</p>
                                                    </div>
                                                ) : (
                                                    loginHistory.map((record, index) => (
                                                        <Card
                                                            key={record.id}
                                                            className="bg-white/8 backdrop-blur-sm border-white/10 rounded-2xl custom-button-trans-override shadow-xl"
                                                        >
                                                            <CardBody className="p-4 space-y-3">
                                                                <div className="flex items-center gap-2 w-full">
                                                                    <div className="text-lg h-8 w-8 flex items-center justify-center flex-shrink-0">
                                                                        {record.success ? getDeviceIcon(record.device) : "⚠️"}
                                                                    </div>
                                                                    <div className={`text-lg font-semibold tracking-tight flex-1 truncate ${record.success ? 'text-white' : 'text-red-400'}`}>
                                                                        {record.device}
                                                                    </div>
                                                                    <p className="text-gray-400 text-xs ml-auto self-center">{getRelativeTime(record.timestamp)}</p>
                                                                </div>
                                                                <div className="flex flex-col pl-8" >
                                                                    <div className="flex flex-row gap-2 items-center" >
                                                                        {index === 0 && (
                                                                            <Chip color="primary" size="md" radius="lg" startContent={<BadgeAlert size={18} className="ml-1" />} className="px-1 shadow-lg" >最新</Chip>
                                                                        )}
                                                                        {record.success ? (
                                                                            <Chip size="md" radius="lg" startContent={<Check size={18} className="ml-1" />} className="px-1 shadow-lg text-zinc-800 bg-emerald-500" >成功</Chip>
                                                                        ) : (
                                                                            <Chip size="md" radius="lg" startContent={<X size={18} className="ml-1" />} className="px-1 shadow-lg text-white bg-rose-500" >{getFirebaseErrorMessage(record.errorMessage || "")}</Chip>
                                                                        )}
                                                                        {getChip(record.provider || "unknown")}
                                                                    </div>
                                                                </div>
                                                                <div className="pl-8 flex flex-col space-y-1.5" >
                                                                    <Chip size="md" radius="lg" startContent={<Clock4 size={18} className="ml-1 mr-1 text-amber-500" />} className="px-1 shadow-lg bg-neutral-900/50 text-gray-200 tracking-wider" >{formatDate(record.timestamp)}</Chip>
                                                                    <Chip
                                                                        size="md"
                                                                        radius="lg"
                                                                        startContent={
                                                                            <span className="relative inline-flex items-center">
                                                                                <HiMiniMapPin size={18} className="ml-1 mr-1 text-red-500" />
                                                                                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                                    <span className="w-[5px] h-[5px] bg-white rounded-full -translate-y-[1px]" />
                                                                                </span>
                                                                            </span>
                                                                        }
                                                                        className="px-1 shadow-lg bg-neutral-900/50 text-gray-200 tracking-wider"
                                                                    >
                                                                        {record.location}
                                                                    </Chip>
                                                                    <div className="flex flex-row">
                                                                        <Chip size="md" radius="lg" startContent={<Unplug size={18} className="ml-1 mr-1 text-sky-500" />} className="px-1 shadow-lg bg-neutral-900/50 text-gray-200 tracking-wider" >{record.ip}</Chip>
                                                                        <div className="w-4 shrink-0"></div>
                                                                    </div>
                                                                </div>
                                                            </CardBody>
                                                        </Card>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
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
        </div>
    );
}
