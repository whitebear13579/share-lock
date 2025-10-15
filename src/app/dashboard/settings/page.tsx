"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/utils/authProvider";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import {
    Cog,
    Folder,
    House,
    LogOut,
    Star,
    User,
    Shield,
    AlertTriangle,
    Edit,
    Mail,
    Key,
    Clock,
    Calendar,
    HardDrive,
    ChartPie,
    Camera,
    ExternalLink,
    Check,
    X,
    History,
    Link as LinkIcon,
    Trash2,
    UserX,
    Eye,
    EyeOff,
    Save,
    RefreshCw,
    MessageCircleQuestionMark
} from "lucide-react";
import {
    Spinner,
    Card,
    CardBody,
    CardHeader,
    Avatar,
    Divider,
    Input,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Progress,
    Chip,
    Select,
    SelectItem,
    Switch,
    Spacer,
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
    Textarea,
    Badge,
    Tooltip,
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    Link
} from "@heroui/react";
import CustomButton from "@/components/button";
import CustomInput from "@/components/input";
import {
    CustomModal,
    CustomModalContent,
    CustomModalHeader,
    CustomModalBody,
    CustomModalFooter,
} from "@/components/modal";
import { Image } from "@heroui/react";
import NextImage from "next/image";
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
import { auth } from "@/utils/firebase";
import CryptoJS from "crypto-js";
import {
    getUserLoginHistory,
    getRecentLoginRecord,
    LoginRecord,
    getDeviceInfo
} from "@/utils/loginHistory";
import { Timestamp } from 'firebase/firestore';

export default function Settings() {
    const { user, loading, logout, recordUserLogin } = useAuth();
    const router = useRouter();

    // State management
    const [isMobile, setIsMobile] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
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
    const [operationResult, setOperationResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);

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

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 1536);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
        if (user) {
            setDisplayName(user.displayName || "");
            setEmail(user.email || "");
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

            // 載入登入紀錄
            loadLoginHistory();
        }
    }, [user, loading, router]);

    // Helper functions
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
            return "📱";
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

    // 載入登入紀錄
    const loadLoginHistory = async () => {
        if (!user) return;

        setIsLoadingHistory(true);
        try {
            console.log('Loading login history for user:', user.uid);
            const history = await getUserLoginHistory(user.uid, 50);
            console.log('Login history loaded:', history);
            setLoginHistory(history);

            const recent = await getRecentLoginRecord(user.uid);
            console.log('Recent login record:', recent);
            setRecentLogin(recent);
        } catch (error) {
            console.error('Failed to load login history:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // 在用戶登入時記錄登入資訊
    const recordCurrentLogin = async () => {
        if (user) {
            const providers = user.providerData.map(p => p.providerId);
            const provider = providers.length > 0 ? providers[0] : 'email';

            await recordUserLogin(true, provider);
            // 記錄後重新載入紀錄
            await loadLoginHistory();
        }
    };

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
            // 先計算新的頭像 URL
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

            // 更新 Firebase 用戶資料
            if (newAvatarUrl !== "/undefined.png") {
                await updateProfile(user, { photoURL: newAvatarUrl });
            }

            // 更新本地狀態
            setAvatarSource(newSource);
            setOperationResult({ type: 'success', message: '頭像來源已更新！' });
        } catch (error: any) {
            console.error("Error updating avatar:", error);
            setOperationResult({ type: 'error', message: '更新頭像失敗：' + error.message });
        }
    };

    // Firebase functions
    const handleUpdateDisplayName = async () => {
        if (!user || !displayName.trim()) return;

        setIsUpdating(true);
        setOperationResult(null);
        try {
            await updateProfile(user, { displayName: displayName.trim() });
            setOperationResult({ type: 'success', message: '使用者名稱更新成功！' });
            onNameModalOpenChange();
        } catch (error: any) {
            console.error("Error updating display name:", error);
            setOperationResult({ type: 'error', message: '更新使用者名稱失敗：' + error.message });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateEmail = async () => {
        if (!user || !newEmail.trim() || !currentPassword) return;

        setIsUpdating(true);
        setOperationResult(null);
        try {
            // Reauthenticate first
            const credential = EmailAuthProvider.credential(user.email!, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Update email
            await updateEmail(user, newEmail.trim());
            setOperationResult({ type: 'success', message: '電子郵件更新成功！請檢查新郵箱進行驗證。' });
            onEmailModalOpenChange();
            setCurrentPassword("");
        } catch (error: any) {
            console.error("Error updating email:", error);
            let errorMessage = '更新電子郵件失敗：';
            if (error.code === 'auth/wrong-password') {
                errorMessage += '密碼錯誤';
            } else if (error.code === 'auth/email-already-in-use') {
                errorMessage += '此郵箱已被使用';
            } else {
                errorMessage += error.message;
            }
            setOperationResult({ type: 'error', message: errorMessage });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!user || !currentPassword || !newPassword || newPassword !== confirmPassword) return;

        setIsUpdating(true);
        setOperationResult(null);
        try {
            // Reauthenticate first
            const credential = EmailAuthProvider.credential(user.email!, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Update password
            await updatePassword(user, newPassword);
            setOperationResult({ type: 'success', message: '密碼更新成功！' });
            onPasswordModalOpenChange();
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error("Error updating password:", error);
            let errorMessage = '更新密碼失敗：';
            if (error.code === 'auth/wrong-password') {
                errorMessage += '當前密碼錯誤';
            } else if (error.code === 'auth/weak-password') {
                errorMessage += '新密碼強度不足';
            } else {
                errorMessage += error.message;
            }
            setOperationResult({ type: 'error', message: errorMessage });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSendVerificationEmail = async () => {
        if (!user) return;

        try {
            await sendEmailVerification(user);
            setOperationResult({ type: 'success', message: '驗證郵件已發送！請檢查您的郵箱。' });
        } catch (error: any) {
            console.error("Error sending verification email:", error);
            setOperationResult({ type: 'error', message: '發送驗證郵件失敗：' + error.message });
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
            setOperationResult({ type: 'success', message: '帳號綁定成功！' });
            // You might want to refresh user data here
        } catch (error: any) {
            console.error("Error linking provider:", error);
            let errorMessage = '綁定失敗：';
            if (error.code === 'auth/credential-already-in-use') {
                errorMessage += '此帳號已被其他用戶使用';
            } else {
                errorMessage += error.message;
            }
            setOperationResult({ type: 'error', message: errorMessage });
        }
    };

    const handleUnlinkProvider = async (providerId: string) => {
        if (!user) return;

        // Check if user has other authentication methods
        const providers = user.providerData.map(p => p.providerId);
        if (providers.length <= 1 && !user.emailVerified) {
            setOperationResult({
                type: 'error',
                message: '無法解除綁定：您需要至少保留一種登入方式或驗證您的電子郵件。'
            });
            return;
        }

        try {
            await unlink(user, providerId);
            setOperationResult({ type: 'success', message: '帳號解除綁定成功！' });
        } catch (error: any) {
            console.error("Error unlinking provider:", error);
            setOperationResult({ type: 'error', message: '解除綁定失敗：' + error.message });
        }
    };

    const handleDeleteFiles = async () => {
        if (deleteConfirmText !== 'DELETE') return;

        setIsUpdating(true);
        try {
            // Here you would implement file deletion logic
            // This would typically involve calling your backend API
            // For now, we'll just simulate the operation
            await new Promise(resolve => setTimeout(resolve, 2000));
            setOperationResult({ type: 'success', message: '所有檔案已成功刪除！' });
            onDeleteModalOpenChange();
            setDeleteConfirmText("");
        } catch (error: any) {
            console.error("Error deleting files:", error);
            setOperationResult({ type: 'error', message: '刪除檔案失敗：' + error.message });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user || !currentPassword) return;

        setIsUpdating(true);
        try {
            // Reauthenticate first
            const credential = EmailAuthProvider.credential(user.email!, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Delete user
            await deleteUser(user);
            router.push("/");
        } catch (error: any) {
            console.error("Error deleting account:", error);
            let errorMessage = '刪除帳號失敗：';
            if (error.code === 'auth/wrong-password') {
                errorMessage += '密碼錯誤';
            } else {
                errorMessage += error.message;
            }
            setOperationResult({ type: 'error', message: errorMessage });
        } finally {
            setIsUpdating(false);
        }
    };

    // Clear result message after 5 seconds
    useEffect(() => {
        if (operationResult) {
            const timer = setTimeout(() => {
                setOperationResult(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [operationResult]);

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
        return null;
    }

    return (
        <div className="min-h-screen bg-linear-205 from-slate-700  to-neutral-800 to-55%">
            {/* Operation Result Notification */}
            {operationResult && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${operationResult.type === 'success'
                    ? 'bg-green-600 text-white'
                    : 'bg-red-600 text-white'
                    }`}>
                    <div className="flex items-center gap-2">
                        {operationResult.type === 'success' ? (
                            <Check size={20} />
                        ) : (
                            <AlertTriangle size={20} />
                        )}
                        <span className="text-sm">{operationResult.message}</span>
                    </div>
                </div>
            )}
            {/* Wide device naviBar */}
            {!isMobile && (
                <div className="absolute top-6 right-6 flex space-x-3">
                    <div className="rounded-full border border-white/30 bg-white/10 shadow-2xl flex items-center justify-center px-6 py-2.5 space-x-10 w-fit h-12 relative overflow-visible">
                        <div
                            className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10"
                            onClick={() => router.push('/dashboard')}
                        >
                            <House size={18} />
                            資訊主頁
                        </div>
                        <div
                            className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10"
                            onClick={() => router.push('/dashboard/files')}
                        >
                            <Folder size={18} />
                            我的檔案
                        </div>
                        <div className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10">
                            <Cog size={18} />
                            帳號設定
                            <div className="absolute -inset-x-6 -inset-y-2.5 bg-neutral-950/60 rounded-full -z-10"></div>
                        </div>
                        <div
                            className="text-gray-200 flex items-center gap-2 cursor-pointer hover:text-white transition-colors relative z-10"
                            onClick={() => router.push('/dashboard/bug-report')}
                        >
                            <Star size={18} />
                            漏洞有賞計畫
                        </div>
                    </div>
                    <CustomButton
                        variant="blur"
                        size="lg"
                        radius="full"
                        startContent={
                            <LogOut
                                size={18}
                                className="text-gray-200"
                            />
                        }
                        isDisabled={loading}
                        onPress={logout}
                        className="text-base hover:bg-white/20 text-gray-200"
                    >
                        登出
                    </CustomButton>
                </div>
            )}

            {/* Mobile device naviBar */}
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
                                    base: "data-[hover=true]:bg-white/15"
                                }}
                            >
                                <DropdownItem key="profile" className="h-14 gap-2" textValue="用戶資訊">
                                    <p className="font-semibold text-white">你好，{user?.displayName} !</p>
                                    <p className="font-semibold text-gray-300">{user?.email}</p>
                                </DropdownItem>
                                <DropdownItem
                                    key="helpandfeedback"
                                    className="h-9"
                                    startContent={<MessageCircleQuestionMark size={18} className="text-white" />}
                                >
                                    <Link href="https://github.com/whitebear13579/share-lock/issues" isExternal className="text-white">幫助與意見回饋</Link>
                                </DropdownItem>
                                <DropdownItem
                                    key="logout"
                                    color="danger"
                                    startContent={<LogOut size={18} className="text-red-400" />}
                                    onPress={logout}
                                    className="h-9 text-red-400"
                                >
                                    <span className="text-red-400" >登出</span>
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </NavbarContent>

                    <NavbarMenu className="bg-black/10 pt-6 border-t-1.5 border-white/70">
                        <NavbarMenuItem>
                            <div
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/20 text-white transition-colors cursor-pointer"
                                onClick={() => router.push('/dashboard')}
                            >
                                <House size={20} />
                                <span className="text-lg">資訊主頁</span>
                            </div>
                        </NavbarMenuItem>
                        <NavbarMenuItem>
                            <div
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/20 text-white transition-colors cursor-pointer"
                                onClick={() => router.push('/dashboard/files')}
                            >
                                <Folder size={20} />
                                <span className="text-lg">我的檔案</span>
                            </div>
                        </NavbarMenuItem>
                        <NavbarMenuItem>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/20 text-blue-400">
                                <Cog size={20} />
                                <span className="text-lg font-medium">帳號設定</span>
                            </div>
                        </NavbarMenuItem>
                        <NavbarMenuItem>
                            <div
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/20 text-white transition-colors cursor-pointer"
                                onClick={() => router.push('/dashboard/bug-report')}
                            >
                                <Star size={20} />
                                <span className="text-lg">漏洞有賞計畫</span>
                            </div>
                        </NavbarMenuItem>
                    </NavbarMenu>
                </Navbar>
            )}

            <div className={isMobile ? "pt-20 px-4" : "pt-36 px-12"}>
                <h1 className={`font-bold text-white mb-2 ${isMobile ? "text-2xl" : "text-4xl"}`}>
                    ⚙️ 帳號設定
                </h1>
                <p className={`text-gray-300 ${isMobile ? "text-base" : "text-lg"}`}>
                    你的帳號安全對我們來說至關重要。
                </p>
            </div>

            {/* Settings Content */}
            <div className={isMobile ? "px-4 py-6 pb-16" : "px-12 py-8 pb-16"}>
                {/* Wide device layout */}
                {!isMobile && (
                    <div className="space-y-6">
                        {/* Personal Information Section */}
                        <div className="flex gap-6">
                            {/* Profile Picture Card */}
                            <Card className="bg-white/10 backdrop-blur-sm border-white/20 w-1/3" shadow="lg">
                                <CardHeader className="pb-2 pt-6 px-6 flex-row items-center gap-3">
                                    <div className="bg-blue-600/30 p-3 rounded-xl">
                                        <User size={24} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-white">個人資料</h4>
                                        <p className="text-gray-300 text-sm">管理您的基本資訊</p>
                                    </div>
                                </CardHeader>
                                <CardBody className="px-6 py-4">
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="relative">
                                            <Avatar
                                                src={getAvatarUrl()}
                                                className="w-24 h-24"
                                                name={user.displayName || "User"}
                                            />
                                            <Button
                                                isIconOnly
                                                className="custom-button-trans-override absolute -bottom-1 -right-1 bg-blue-600 text-white"
                                                size="sm"
                                                radius="full"
                                            >
                                                <Camera size={16} />
                                            </Button>
                                        </div>

                                        <div className="w-full space-y-3">
                                            <Select
                                                label="頭像來源"
                                                selectedKeys={new Set([avatarSource])}
                                                onSelectionChange={(keys) => handleAvatarSourceChange(Array.from(keys)[0] as string)}
                                                classNames={{
                                                    trigger: "bg-white/10 border-white/20 text-white",
                                                    value: "text-white",
                                                    label: "text-gray-300"
                                                }}
                                                size="sm"
                                            >
                                                <SelectItem key="gravatar" isDisabled={!user.email}>Gravatar</SelectItem>
                                                <SelectItem key="google" isDisabled={!isGoogleLinked()}>Google</SelectItem>
                                                <SelectItem key="github" isDisabled={!isGithubLinked()}>GitHub</SelectItem>
                                            </Select>

                                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                                <span className="text-gray-300 text-sm">使用者名稱</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-medium">{user.displayName || "未設定"}</span>
                                                    <Button
                                                        isIconOnly
                                                        className="custom-button-trans-override bg-white/10 text-gray-300"
                                                        size="sm"
                                                        onPress={onNameModalOpen}
                                                    >
                                                        <Edit size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>

                            {/* Account Info Card */}
                            <Card className="flex-1 bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                                <CardHeader className="pb-2 pt-6 px-6 flex-row items-center gap-3">
                                    <div className="bg-green-600/30 p-3 rounded-xl">
                                        <Calendar size={24} className="text-green-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-white">帳號資訊</h4>
                                        <p className="text-gray-300 text-sm">查看您的帳號統計資料</p>
                                    </div>
                                </CardHeader>
                                <CardBody className="px-6 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-white/5 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Calendar size={16} className="text-blue-400" />
                                                <span className="text-gray-300 text-sm">加入時間</span>
                                            </div>
                                            <p className="text-white font-medium text-sm">
                                                {formatDate(user.metadata.creationTime!)}
                                            </p>
                                        </div>

                                        <div className="p-4 bg-white/5 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Clock size={16} className="text-green-400" />
                                                <span className="text-gray-300 text-sm">最後登入</span>
                                            </div>
                                            <p className="text-white font-medium text-sm">
                                                {formatDate(user.metadata.lastSignInTime!)}
                                            </p>
                                        </div>

                                        <div className="p-4 bg-white/5 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <HardDrive size={16} className="text-purple-400" />
                                                <span className="text-gray-300 text-sm">已分享檔案</span>
                                            </div>
                                            <p className="text-white font-medium text-lg">23</p>
                                        </div>

                                        <div className="p-4 bg-white/5 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <HardDrive size={16} className="text-orange-400" />
                                                <span className="text-gray-300 text-sm">收到檔案</span>
                                            </div>
                                            <p className="text-white font-medium text-lg">47</p>
                                        </div>
                                    </div>

                                    {/* Storage Usage */}
                                    <div className="mt-4 p-4 bg-white/5 rounded-lg">
                                        <div className="flex items-center gap-2 mb-3">
                                            <ChartPie size={16} className="text-yellow-400" />
                                            <span className="text-gray-300 text-sm">容量使用狀況</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-200 font-medium pb-2">
                                            {true ? (
                                                <>
                                                    <AlertTriangle size={16} className="text-amber-500" />
                                                    <span>容量即將滿載，請考慮清理不需要的檔案</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Check size={16} className="text-green-500" />
                                                    <span>容量使用正常</span>
                                                </>
                                            )}
                                        </div>
                                        <Progress
                                            size="md"
                                            radius="full"
                                            showValueLabel
                                            classNames={{
                                                indicator: (true
                                                    ? "bg-linear-245 from-amber-500 to-rose-700"
                                                    : "bg-linear-245 from-cyan-500 to-sky-600"
                                                ),
                                                track: "drop-shadow-lg border border-white/30 bg-gray-900/10",
                                                value: "text-base font-medium text-gray-200",
                                                label: "text-gray-300 font-normal text-sm"
                                            }}
                                            label="882 MB / 1 GB"
                                            value={86}
                                        />
                                    </div>
                                </CardBody>
                            </Card>
                        </div>

                        {/* Account Security Section */}
                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader className="pb-2 pt-6 px-6 flex-row items-center gap-3">
                                <div className="bg-orange-600/30 p-3 rounded-xl">
                                    <Shield size={24} className="text-orange-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-white">帳號安全</h4>
                                    <p className="text-gray-300 text-sm">管理您的登入資訊和安全設定</p>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-4">
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Left Column */}
                                    <div className="space-y-4">
                                        {/* Email */}
                                        <div className="p-4 bg-white/5 rounded-lg">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Mail size={16} className="text-blue-400" />
                                                    <span className="text-gray-300 text-sm">電子郵件</span>
                                                </div>
                                                <Button
                                                    className="custom-button-trans-override bg-white/10 text-gray-300"
                                                    size="sm"
                                                    onPress={onEmailModalOpen}
                                                >
                                                    更改
                                                </Button>
                                            </div>
                                            <p className="text-white font-medium">{user.email}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                {user.emailVerified ? (
                                                    <Chip color="success" size="sm" startContent={<Check size={12} />}>
                                                        已驗證
                                                    </Chip>
                                                ) : (
                                                    <Chip color="danger" size="sm" startContent={<X size={12} />}>
                                                        未驗證
                                                    </Chip>
                                                )}
                                                {!user.emailVerified && (
                                                    <Button
                                                        className="custom-button-trans-override text-blue-400"
                                                        size="sm"
                                                        variant="light"
                                                        onPress={handleSendVerificationEmail}
                                                    >
                                                        發送驗證郵件
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Password */}
                                        <div className="p-4 bg-white/5 rounded-lg">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Key size={16} className="text-green-400" />
                                                    <span className="text-gray-300 text-sm">密碼</span>
                                                </div>
                                                <Button
                                                    className="custom-button-trans-override bg-white/10 text-gray-300"
                                                    size="sm"
                                                    onPress={onPasswordModalOpen}
                                                >
                                                    更改
                                                </Button>
                                            </div>
                                            <p className="text-white font-medium">••••••••••••</p>
                                            <p className="text-gray-400 text-xs mt-1">最後更新：未知</p>
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-4">
                                        {/* Provider Links */}
                                        <div className="p-4 bg-white/5 rounded-lg">
                                            <div className="flex items-center gap-2 mb-3">
                                                <LinkIcon size={16} className="text-purple-400" />
                                                <span className="text-gray-300 text-sm">第三方服務綁定</span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                                                        <span className="text-white text-sm">Google</span>
                                                    </div>
                                                    {isGoogleLinked() ? (
                                                        <Button
                                                            className="custom-button-trans-override text-red-400"
                                                            size="sm"
                                                            variant="light"
                                                            onPress={() => handleUnlinkProvider('google.com')}
                                                        >
                                                            解除綁定
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            className="custom-button-trans-override text-green-400"
                                                            size="sm"
                                                            variant="light"
                                                            onPress={() => handleLinkProvider('google.com')}
                                                        >
                                                            綁定
                                                        </Button>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 bg-gray-800 rounded"></div>
                                                        <span className="text-white text-sm">GitHub</span>
                                                    </div>
                                                    {isGithubLinked() ? (
                                                        <Button
                                                            className="custom-button-trans-override text-red-400"
                                                            size="sm"
                                                            variant="light"
                                                            onPress={() => handleUnlinkProvider('github.com')}
                                                        >
                                                            解除綁定
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            className="custom-button-trans-override text-green-400"
                                                            size="sm"
                                                            variant="light"
                                                            onPress={() => handleLinkProvider('github.com')}
                                                        >
                                                            綁定
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Login History */}
                                        <div className="p-4 bg-white/5 rounded-lg">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <History size={16} className="text-cyan-400" />
                                                    <span className="text-gray-300 text-sm">登入紀錄</span>
                                                </div>
                                                <Button
                                                    className="custom-button-trans-override bg-white/10 text-gray-300"
                                                    size="sm"
                                                    startContent={<ExternalLink size={14} />}
                                                    onPress={() => {
                                                        loadLoginHistory();
                                                        onLoginHistoryDrawerOpen();
                                                    }}
                                                >
                                                    查看全部
                                                </Button>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="text-xs text-gray-400">
                                                    最近登入：{formatDate(user.metadata.lastSignInTime!)}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    來源：{getDeviceIcon(recentLogin?.device || getDeviceInfo().device)} {recentLogin?.device || getDeviceInfo().device}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    位置：{recentLogin?.location || "載入中..."}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Danger Zone */}
                        <Card className="bg-red-950/20 backdrop-blur-sm border-red-500/30" shadow="lg">
                            <CardHeader className="pb-2 pt-6 px-6 flex-row items-center gap-3">
                                <div className="bg-red-600/30 p-3 rounded-xl">
                                    <AlertTriangle size={24} className="text-red-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-red-300">危險區域</h4>
                                    <p className="text-red-400/70 text-sm">這些操作無法復原，請謹慎執行</p>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 py-4">
                                <div className="flex gap-4">
                                    <Button
                                        className="custom-button-trans-override bg-red-600/20 border border-red-500/50 text-red-300"
                                        startContent={<Trash2 size={18} />}
                                        onPress={onDeleteModalOpen}
                                    >
                                        刪除所有檔案
                                    </Button>
                                    <Button
                                        className="custom-button-trans-override bg-red-700/30 border border-red-500/70 text-red-200"
                                        startContent={<UserX size={18} />}
                                        onPress={onDeleteAccountModalOpen}
                                    >
                                        刪除帳號
                                    </Button>
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
                                <div className="bg-blue-600/30 p-2 rounded-xl">
                                    <User size={20} className="text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-lg text-white">個人資料</h4>
                                    <p className="text-gray-300 text-xs">管理您的基本資訊</p>
                                </div>
                            </CardHeader>
                            <CardBody className="px-4 py-3">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <Avatar
                                            src={getAvatarUrl()}
                                            className="w-16 h-16"
                                            name={user.displayName || "User"}
                                        />
                                        <Button
                                            isIconOnly
                                            className="custom-button-trans-override absolute -bottom-1 -right-1 bg-blue-600 text-white"
                                            size="sm"
                                            radius="full"
                                        >
                                            <Camera size={12} />
                                        </Button>
                                    </div>

                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-300 text-sm">使用者名稱</span>
                                            <Button
                                                isIconOnly
                                                className="custom-button-trans-override bg-white/10 text-gray-300"
                                                size="sm"
                                                onPress={onNameModalOpen}
                                            >
                                                <Edit size={12} />
                                            </Button>
                                        </div>
                                        <p className="text-white font-medium">{user.displayName || "未設定"}</p>
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <Select
                                        label="頭像來源"
                                        selectedKeys={new Set([avatarSource])}
                                        onSelectionChange={(keys) => handleAvatarSourceChange(Array.from(keys)[0] as string)}
                                        classNames={{
                                            trigger: "bg-white/10 border-white/20 text-white",
                                            value: "text-white",
                                            label: "text-gray-300"
                                        }}
                                        size="sm"
                                    >
                                        <SelectItem key="gravatar" isDisabled={!user.email}>Gravatar</SelectItem>
                                        <SelectItem key="google" isDisabled={!isGoogleLinked()}>Google</SelectItem>
                                        <SelectItem key="github" isDisabled={!isGithubLinked()}>GitHub</SelectItem>
                                    </Select>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Account Stats - Mobile */}
                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader className="pb-0 pt-4 px-4 flex-row items-center gap-3">
                                <div className="bg-green-600/30 p-2 rounded-xl">
                                    <Calendar size={20} className="text-green-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-lg text-white">帳號統計</h4>
                                    <p className="text-gray-300 text-xs">查看您的使用資料</p>
                                </div>
                            </CardHeader>
                            <CardBody className="px-4 py-3">
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="p-3 bg-white/5 rounded-lg">
                                        <div className="flex items-center gap-1 mb-1">
                                            <Calendar size={12} className="text-blue-400" />
                                            <span className="text-gray-300 text-xs">加入時間</span>
                                        </div>
                                        <p className="text-white font-medium text-xs">
                                            {new Date(user.metadata.creationTime!).toLocaleDateString('zh-TW')}
                                        </p>
                                    </div>

                                    <div className="p-3 bg-white/5 rounded-lg">
                                        <div className="flex items-center gap-1 mb-1">
                                            <Clock size={12} className="text-green-400" />
                                            <span className="text-gray-300 text-xs">最後登入</span>
                                        </div>
                                        <p className="text-white font-medium text-xs">
                                            {new Date(user.metadata.lastSignInTime!).toLocaleDateString('zh-TW')}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="p-3 bg-white/5 rounded-lg text-center">
                                        <p className="text-purple-400 text-lg font-bold">23</p>
                                        <p className="text-gray-300 text-xs">已分享檔案</p>
                                    </div>

                                    <div className="p-3 bg-white/5 rounded-lg text-center">
                                        <p className="text-orange-400 text-lg font-bold">47</p>
                                        <p className="text-gray-300 text-xs">收到檔案</p>
                                    </div>
                                </div>

                                {/* Storage - Mobile */}
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ChartPie size={14} className="text-yellow-400" />
                                        <span className="text-gray-300 text-xs">容量使用</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-200 font-medium pb-2">
                                        <AlertTriangle size={12} className="text-amber-500" />
                                        <span>容量即將滿載</span>
                                    </div>
                                    <Progress
                                        size="sm"
                                        radius="full"
                                        showValueLabel
                                        classNames={{
                                            indicator: "bg-linear-245 from-amber-500 to-rose-700",
                                            track: "drop-shadow-lg border border-white/30 bg-gray-900/10",
                                            value: "text-xs font-medium text-gray-200",
                                            label: "text-gray-300 font-normal text-xs"
                                        }}
                                        label="882 MB / 1 GB"
                                        value={86}
                                    />
                                </div>
                            </CardBody>
                        </Card>

                        {/* Account Security - Mobile */}
                        <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                            <CardHeader className="pb-0 pt-4 px-4 flex-row items-center gap-3">
                                <div className="bg-orange-600/30 p-2 rounded-xl">
                                    <Shield size={20} className="text-orange-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-lg text-white">帳號安全</h4>
                                    <p className="text-gray-300 text-xs">管理登入與安全設定</p>
                                </div>
                            </CardHeader>
                            <CardBody className="px-4 py-3">
                                <div className="space-y-3">
                                    {/* Email - Mobile */}
                                    <div className="p-3 bg-white/5 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Mail size={14} className="text-blue-400" />
                                                <span className="text-gray-300 text-xs">電子郵件</span>
                                            </div>
                                            <Button
                                                className="custom-button-trans-override bg-white/10 text-gray-300"
                                                size="sm"
                                                onPress={onEmailModalOpen}
                                            >
                                                更改
                                            </Button>
                                        </div>
                                        <p className="text-white font-medium text-sm mb-2">{user.email}</p>
                                        <div className="flex items-center gap-2">
                                            {user.emailVerified ? (
                                                <Chip color="success" size="sm" startContent={<Check size={10} />}>
                                                    已驗證
                                                </Chip>
                                            ) : (
                                                <>
                                                    <Chip color="danger" size="sm" startContent={<X size={10} />}>
                                                        未驗證
                                                    </Chip>
                                                    <Button
                                                        className="custom-button-trans-override text-blue-400"
                                                        size="sm"
                                                        variant="light"
                                                        onPress={handleSendVerificationEmail}
                                                    >
                                                        驗證
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Password - Mobile */}
                                    <div className="p-3 bg-white/5 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Key size={14} className="text-green-400" />
                                                <span className="text-gray-300 text-xs">密碼</span>
                                            </div>
                                            <Button
                                                className="custom-button-trans-override bg-white/10 text-gray-300"
                                                size="sm"
                                                onPress={onPasswordModalOpen}
                                            >
                                                更改
                                            </Button>
                                        </div>
                                        <p className="text-white font-medium">••••••••••••</p>
                                    </div>

                                    {/* Providers - Mobile */}
                                    <div className="p-3 bg-white/5 rounded-lg">
                                        <div className="flex items-center gap-2 mb-3">
                                            <LinkIcon size={14} className="text-purple-400" />
                                            <span className="text-gray-300 text-xs">第三方服務</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                                                    <span className="text-white text-xs">Google</span>
                                                </div>
                                                {isGoogleLinked() ? (
                                                    <Chip color="success" size="sm">已綁定</Chip>
                                                ) : (
                                                    <Button
                                                        className="custom-button-trans-override text-green-400"
                                                        size="sm"
                                                        variant="light"
                                                        onPress={() => handleLinkProvider('google.com')}
                                                    >
                                                        綁定
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-gray-800 rounded"></div>
                                                    <span className="text-white text-xs">GitHub</span>
                                                </div>
                                                {isGithubLinked() ? (
                                                    <Chip color="success" size="sm">已綁定</Chip>
                                                ) : (
                                                    <Button
                                                        className="custom-button-trans-override text-green-400"
                                                        size="sm"
                                                        variant="light"
                                                        onPress={() => handleLinkProvider('github.com')}
                                                    >
                                                        綁定
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Login History - Mobile */}
                                    <div className="p-3 bg-white/5 rounded-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <History size={14} className="text-cyan-400" />
                                                <span className="text-gray-300 text-xs">登入紀錄</span>
                                            </div>
                                            <Button
                                                className="custom-button-trans-override text-blue-400"
                                                size="sm"
                                                variant="light"
                                                onPress={() => {
                                                    loadLoginHistory();
                                                    onLoginHistoryDrawerOpen();
                                                }}
                                            >
                                                查看
                                            </Button>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-xs text-gray-400">
                                                最近：{getRelativeTime(user.metadata.lastSignInTime!)}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {getDeviceIcon(recentLogin?.device || getDeviceInfo().device)} {recentLogin?.device || getDeviceInfo().device}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Danger Zone - Mobile */}
                        <Card className="bg-red-950/20 backdrop-blur-sm border-red-500/30" shadow="lg">
                            <CardHeader className="pb-0 pt-4 px-4 flex-row items-center gap-3">
                                <div className="bg-red-600/30 p-2 rounded-xl">
                                    <AlertTriangle size={20} className="text-red-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-lg text-red-300">危險區域</h4>
                                    <p className="text-red-400/70 text-xs">操作無法復原</p>
                                </div>
                            </CardHeader>
                            <CardBody className="px-4 py-3">
                                <div className="space-y-3">
                                    <Button
                                        className="custom-button-trans-override w-full bg-red-600/20 border border-red-500/50 text-red-300"
                                        startContent={<Trash2 size={16} />}
                                        onPress={onDeleteModalOpen}
                                    >
                                        刪除所有檔案
                                    </Button>
                                    <Button
                                        className="custom-button-trans-override w-full bg-red-700/30 border border-red-500/70 text-red-200"
                                        startContent={<UserX size={16} />}
                                        onPress={onDeleteAccountModalOpen}
                                    >
                                        刪除帳號
                                    </Button>
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
                            <CustomModalHeader className="flex flex-col gap-1">
                                <h3 className="text-xl font-bold">更改使用者名稱</h3>
                            </CustomModalHeader>
                            <CustomModalBody>
                                <CustomInput
                                    label="新的使用者名稱"
                                    placeholder="輸入新的使用者名稱"
                                    value={displayName}
                                    onValueChange={setDisplayName}
                                />
                            </CustomModalBody>
                            <CustomModalFooter>
                                <CustomButton
                                    variant="blur"
                                    onPress={onClose}
                                    className="text-red-400 hover:bg-red-500/20 border-red-500/30"
                                >
                                    取消
                                </CustomButton>
                                <CustomButton
                                    variant="blur"
                                    onPress={handleUpdateDisplayName}
                                    isLoading={isUpdating}
                                    isDisabled={!displayName.trim() || displayName === user?.displayName}
                                    className="text-blue-400 hover:bg-blue-500/20 border-blue-500/30"
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
                            <CustomModalHeader className="flex flex-col gap-1">
                                <h3 className="text-xl font-bold">更改電子郵件</h3>
                                <p className="text-sm text-gray-400">需要輸入當前密碼以確認身份</p>
                            </CustomModalHeader>
                            <CustomModalBody>
                                <CustomInput
                                    label="新的電子郵件"
                                    placeholder="輸入新的電子郵件地址"
                                    type="email"
                                    value={newEmail}
                                    onValueChange={setNewEmail}
                                />
                                <CustomInput
                                    label="當前密碼"
                                    placeholder="輸入當前密碼以確認"
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={currentPassword}
                                    onValueChange={setCurrentPassword}
                                    endContent={
                                        <button
                                            className="focus:outline-none"
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            {showCurrentPassword ? (
                                                <EyeOff className="text-2xl text-default-400 pointer-events-none" />
                                            ) : (
                                                <Eye className="text-2xl text-default-400 pointer-events-none" />
                                            )}
                                        </button>
                                    }
                                />
                            </CustomModalBody>
                            <CustomModalFooter>
                                <CustomButton
                                    variant="blur"
                                    onPress={onClose}
                                    className="text-red-400 hover:bg-red-500/20 border-red-500/30"
                                >
                                    取消
                                </CustomButton>
                                <CustomButton
                                    variant="blur"
                                    onPress={handleUpdateEmail}
                                    isLoading={isUpdating}
                                    isDisabled={!newEmail.trim() || !currentPassword || newEmail === user?.email}
                                    className="text-blue-400 hover:bg-blue-500/20 border-blue-500/30"
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
                            <CustomModalHeader className="flex flex-col gap-1">
                                <h3 className="text-xl font-bold">更改密碼</h3>
                                <p className="text-sm text-gray-400">請輸入當前密碼和新密碼</p>
                            </CustomModalHeader>
                            <CustomModalBody>
                                <CustomInput
                                    label="當前密碼"
                                    placeholder="輸入當前密碼"
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={currentPassword}
                                    onValueChange={setCurrentPassword}
                                    endContent={
                                        <button
                                            className="focus:outline-none"
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            {showCurrentPassword ? (
                                                <EyeOff className="text-2xl text-default-400 pointer-events-none" />
                                            ) : (
                                                <Eye className="text-2xl text-default-400 pointer-events-none" />
                                            )}
                                        </button>
                                    }
                                />
                                <CustomInput
                                    label="新密碼"
                                    placeholder="輸入新密碼"
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onValueChange={setNewPassword}
                                    endContent={
                                        <button
                                            className="focus:outline-none"
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? (
                                                <EyeOff className="text-2xl text-default-400 pointer-events-none" />
                                            ) : (
                                                <Eye className="text-2xl text-default-400 pointer-events-none" />
                                            )}
                                        </button>
                                    }
                                />
                                <CustomInput
                                    label="確認新密碼"
                                    placeholder="再次輸入新密碼"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onValueChange={setConfirmPassword}
                                    endContent={
                                        <button
                                            className="focus:outline-none"
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="text-2xl text-default-400 pointer-events-none" />
                                            ) : (
                                                <Eye className="text-2xl text-default-400 pointer-events-none" />
                                            )}
                                        </button>
                                    }
                                />
                                {newPassword !== confirmPassword && confirmPassword && (
                                    <p className="text-red-400 text-sm">密碼確認不一致</p>
                                )}
                            </CustomModalBody>
                            <CustomModalFooter>
                                <CustomButton
                                    variant="blur"
                                    onPress={onClose}
                                    className="text-red-400 hover:bg-red-500/20 border-red-500/30"
                                >
                                    取消
                                </CustomButton>
                                <CustomButton
                                    variant="blur"
                                    onPress={handleUpdatePassword}
                                    isLoading={isUpdating}
                                    isDisabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                                    className="text-blue-400 hover:bg-blue-500/20 border-blue-500/30"
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
                            <CustomModalHeader className="flex flex-col gap-1">
                                <h3 className="text-xl font-bold text-red-400">刪除所有檔案</h3>
                                <p className="text-sm text-gray-400">此操作無法復原</p>
                            </CustomModalHeader>
                            <CustomModalBody>
                                <div className="bg-red-950/20 border border-red-500/30 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                                        <div>
                                            <h4 className="font-medium text-red-300">確認刪除</h4>
                                            <p className="text-red-200 text-sm mt-1">
                                                這將會刪除您所有上傳的檔案，包括：
                                            </p>
                                            <ul className="text-red-200 text-sm mt-2 space-y-1">
                                                <li>• 所有已分享的檔案</li>
                                                <li>• 所有檔案分享連結</li>
                                                <li>• 相關的分享記錄</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <CustomInput
                                    label="輸入 'DELETE' 以確認"
                                    placeholder="DELETE"
                                    value={deleteConfirmText}
                                    onValueChange={setDeleteConfirmText}
                                />
                            </CustomModalBody>
                            <CustomModalFooter>
                                <CustomButton
                                    variant="blur"
                                    onPress={onClose}
                                    className="text-gray-300 hover:bg-white/10 border-white/30"
                                >
                                    取消
                                </CustomButton>
                                <CustomButton
                                    variant="blur"
                                    onPress={handleDeleteFiles}
                                    isLoading={isUpdating}
                                    isDisabled={deleteConfirmText !== 'DELETE'}
                                    className="text-red-400 hover:bg-red-500/20 border-red-500/30"
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
                            <CustomModalHeader className="flex flex-col gap-1">
                                <h3 className="text-xl font-bold text-red-400">刪除帳號</h3>
                                <p className="text-sm text-gray-400">此操作無法復原，請謹慎考慮</p>
                            </CustomModalHeader>
                            <CustomModalBody>
                                <div className="bg-red-950/20 border border-red-500/30 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                                        <div>
                                            <h4 className="font-medium text-red-300">確認刪除帳號</h4>
                                            <p className="text-red-200 text-sm mt-1">
                                                刪除帳號將會：
                                            </p>
                                            <ul className="text-red-200 text-sm mt-2 space-y-1">
                                                <li>• 永久刪除您的所有資料</li>
                                                <li>• 刪除所有檔案和分享連結</li>
                                                <li>• 無法恢復您的帳號</li>
                                                <li>• 立即登出所有裝置</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <CustomInput
                                    label="當前密碼"
                                    placeholder="輸入密碼以確認身份"
                                    type="password"
                                    value={currentPassword}
                                    onValueChange={setCurrentPassword}
                                />
                            </CustomModalBody>
                            <CustomModalFooter>
                                <CustomButton
                                    variant="blur"
                                    onPress={onClose}
                                    className="text-gray-300 hover:bg-white/10 border-white/30"
                                >
                                    取消
                                </CustomButton>
                                <CustomButton
                                    variant="blur"
                                    onPress={handleDeleteAccount}
                                    isLoading={isUpdating}
                                    isDisabled={!currentPassword}
                                    className="text-red-400 hover:bg-red-500/20 border-red-500/30"
                                >
                                    永久刪除帳號
                                </CustomButton>
                            </CustomModalFooter>
                        </>
                    )}
                </CustomModalContent>
            </CustomModal>

            {/* Login History Drawer */}
            <Drawer
                isOpen={isLoginHistoryDrawerOpen}
                onOpenChange={onLoginHistoryDrawerOpenChange}
                placement="right"
                size="lg"
                classNames={{
                    base: "bg-gradient-to-br from-slate-800 to-neutral-900",
                    header: "border-b border-white/20",
                    body: "py-4",
                    footer: "border-t border-white/20"
                }}
            >
                <DrawerContent>
                    {(onClose) => (
                        <>
                            <DrawerHeader className="flex flex-col gap-1 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <History size={24} className="text-cyan-400" />
                                            登入紀錄
                                        </h2>
                                        <p className="text-sm text-gray-300">查看您的帳號登入活動</p>
                                    </div>
                                </div>
                            </DrawerHeader>
                            <DrawerBody className="px-6 py-4 overflow-y-auto">
                                <div className="space-y-4">
                                    {/* Security Tips - Always first item */}
                                    <Card className="bg-blue-950/20 backdrop-blur-sm border-blue-500/30">
                                        <CardBody className="p-4">
                                            <div className="flex items-start gap-3">
                                                <Shield size={20} className="text-blue-400 flex-shrink-0 mt-1" />
                                                <div>
                                                    <h4 className="text-blue-300 font-medium text-sm mb-2">安全提醒</h4>
                                                    <ul className="text-blue-200 text-xs space-y-1">
                                                        <li>• 如果發現異常登入記錄，請立即更改密碼</li>
                                                        <li>• 建議定期檢查登入記錄以確保帳號安全</li>
                                                        <li>• 請勿在公共網路或設備上登入重要帳號</li>
                                                        <li>• 建議啟用雙重驗證以提高安全性</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>

                                    {isLoadingHistory ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Spinner color="primary" size="lg" />
                                            <span className="ml-3 text-white">載入登入紀錄中...</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {loginHistory.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <p className="text-gray-400">暫無登入紀錄</p>
                                                </div>
                                            ) : (
                                                loginHistory.map((record, index) => (
                                                    <Card
                                                        key={record.id}
                                                        className={`bg-white/5 backdrop-blur-sm border-white/10 ${!record.success ? 'border-red-500/30 bg-red-950/20' : ''}`}
                                                    >
                                                        <CardBody className="p-4">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-start gap-3">
                                                                    <div className="text-2xl">{getDeviceIcon(record.device)}</div>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <h3 className="text-white font-medium text-sm">{record.device}</h3>
                                                                            {record.success ? (
                                                                                <Chip size="sm" color="success" variant="flat" startContent={<Check size={10} />}>
                                                                                    成功
                                                                                </Chip>
                                                                            ) : (
                                                                                <Chip size="sm" color="danger" variant="flat" startContent={<X size={10} />}>
                                                                                    失敗
                                                                                </Chip>
                                                                            )}
                                                                            {index === 0 && (
                                                                                <Chip size="sm" color="primary" variant="flat">
                                                                                    最近
                                                                                </Chip>
                                                                            )}
                                                                            {record.provider && (
                                                                                <Chip size="sm" color="secondary" variant="flat">
                                                                                    {record.provider === 'google.com' ? 'Google' :
                                                                                        record.provider === 'github.com' ? 'GitHub' :
                                                                                            record.provider === 'password' ? 'Email' : record.provider}
                                                                                </Chip>
                                                                            )}
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <p className="text-gray-300 text-xs flex items-center gap-1">
                                                                                <Clock size={10} />
                                                                                {formatDate(record.timestamp)}
                                                                            </p>
                                                                            <p className="text-gray-400 text-xs">
                                                                                📍 {record.location}
                                                                            </p>
                                                                            <p className="text-gray-400 text-xs">
                                                                                🌐 {record.ip}
                                                                            </p>
                                                                            {record.errorMessage && (
                                                                                <p className="text-red-400 text-xs">
                                                                                    ❌ {record.errorMessage}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-gray-400 text-xs">{getRelativeTime(record.timestamp)}</p>
                                                                    {!record.success && (
                                                                        <Tooltip content={record.errorMessage || "登入失敗的原因通常是密碼錯誤或帳號被暫時鎖定"}>
                                                                            <Button
                                                                                isIconOnly
                                                                                size="sm"
                                                                                variant="light"
                                                                                className="text-red-400 mt-1"
                                                                            >
                                                                                <AlertTriangle size={14} />
                                                                            </Button>
                                                                        </Tooltip>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </DrawerBody>
                            <DrawerFooter>
                                <Button
                                    color="primary"
                                    onPress={onClose}
                                    className="custom-button-trans-override"
                                >
                                    關閉
                                </Button>
                            </DrawerFooter>
                        </>
                    )}
                </DrawerContent>
            </Drawer>
        </div>
    );
}
