"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/utils/authProvider";
import NextLink from "next/link";
import { Button } from "@heroui/button";
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
    Lock,
    LockOpen,
    Eye,
    MessageCircleQuestionMark,
    Plus,
    Upload
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
} from "@heroui/react";
import CustomButton from "@/components/button";
import CustomInput from "@/components/input";
import CustomTabs from "@/components/tabs";
import { motion, AnimatePresence } from "framer-motion";
import UploadFiles from "@/components/uploadFiles";
import DashboardNavigation from "@/components/dashboardNavigation";
import DashboardContentTransition from "@/components/dashboardContentTransition";

// 模擬檔案數據
interface FileData {
    id: string;
    name: string;
    size: string;
    sharedWith?: string[];
    expiryDate: string;
    status: "active" | "expired";
    isProtected: boolean;
    sharedDate: string;
    views: number;
    downloads: number;
}

const myFilesData: FileData[] = [
    {
        id: "1",
        name: "線性代數考古題.pdf",
        size: "2.4 MB",
        sharedWith: ["Anna", "Bob"],
        expiryDate: "2025/12/31",
        status: "active",
        isProtected: true,
        sharedDate: "2025/08/15",
        views: 12,
        downloads: 5,
    },
    {
        id: "2",
        name: "計算機概論小考解答.pdf",
        size: "1.8 MB",
        sharedWith: ["Wendy"],
        expiryDate: "2026/09/27",
        status: "active",
        isProtected: false,
        sharedDate: "2025/08/20",
        views: 8,
        downloads: 3,
    },
    {
        id: "3",
        name: "期末簡報.pptx",
        size: "15.2 MB",
        sharedWith: ["Harry", "Miya", "Tom"],
        expiryDate: "2025/12/15",
        status: "active",
        isProtected: true,
        sharedDate: "2025/08/10",
        views: 25,
        downloads: 10,
    },
];

const sharedWithMeData: FileData[] = [
    {
        id: "4",
        name: "資料結構筆記.docx",
        size: "3.5 MB",
        sharedWith: ["Me"],
        expiryDate: "2026/01/15",
        status: "active",
        isProtected: false,
        sharedDate: "2025/09/01",
        views: 15,
        downloads: 2,
    },
    {
        id: "5",
        name: "作業系統講義.pdf",
        size: "8.7 MB",
        sharedWith: ["Me"],
        expiryDate: "2025/11/30",
        status: "active",
        isProtected: true,
        sharedDate: "2025/08/25",
        views: 20,
        downloads: 7,
    },
];

const expiredFilesData: FileData[] = [
    {
        id: "6",
        name: "在學證明.pdf",
        size: "0.5 MB",
        sharedWith: ["School Office"],
        expiryDate: "2025/08/01",
        status: "expired",
        isProtected: false,
        sharedDate: "2025/07/15",
        views: 5,
        downloads: 1,
    },
    {
        id: "7",
        name: "專題報告初稿.docx",
        size: "4.2 MB",
        sharedWith: ["Professor Wang"],
        expiryDate: "2025/07/31",
        status: "expired",
        isProtected: false,
        sharedDate: "2025/07/20",
        views: 10,
        downloads: 2,
    },
];

export default function MyFiles() {
    const { user, loading, logout } = useAuth();
    const [activeTab, setActiveTab] = useState("myFiles");
    const [searchQuery, setSearchQuery] = useState("");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 1536);
        };

        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);

        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-linear-205 from-slate-700 to-neutral-800 to-55% flex items-center justify-center">
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

    const getCurrentFiles = () => {
        switch (activeTab) {
            case "myFiles":
                return myFilesData;
            case "sharedWithMe":
                return sharedWithMeData;
            case "expired":
                return expiredFilesData;
            default:
                return myFilesData;
        }
    };

    const filteredFiles = getCurrentFiles().filter((file) =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const tabs = [
        { key: "myFiles", label: "我的檔案", icon: <Folder size={18} /> },
        { key: "sharedWithMe", label: "與我共用", icon: <Users size={18} /> },
        { key: "expired", label: "已過期", icon: <Clock size={18} /> },
    ];

    return (
        <div className="min-h-screen bg-linear-205 from-slate-700 to-neutral-800 to-55%">
            {/* Wide device navigation */}
            {!isMobile && (
                <DashboardNavigation loading={loading} onLogout={logout} />
            )}

            {/* Mobile device navigation */}
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
                                    onPress={logout}
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
                        <NavbarMenuItem>
                            <NextLink href="/dashboard/bug-report" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/20 text-white transition-colors">
                                <Star size={20} />
                                <span className="text-lg">漏洞有賞計畫</span>
                            </NextLink>
                        </NavbarMenuItem>
                    </NavbarMenu>
                </Navbar>
            )}

            {/* Floating Upload Button - Mobile only (outside DashboardContentTransition for proper fixed positioning) */}
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
                <div className={isMobile ? "pt-20 px-4" : "pt-36 px-13"}>
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
                        {/* Tabs */}
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
                            {filteredFiles.length === 0 ? (
                                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                                    <CardBody className="py-16 text-center">
                                        <p className="text-gray-300 text-lg">
                                            沒有找到符合條件的檔案
                                        </p>
                                    </CardBody>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filteredFiles.map((file, index) => (
                                        <motion.div
                                            key={file.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                duration: 0.3,
                                                delay: index * 0.1,
                                            }}
                                        >
                                            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer group">
                                                <CardHeader className="flex justify-between items-start pb-2">
                                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                                        <div
                                                            className={`p-3 rounded-xl ${file.status === "expired"
                                                                ? "bg-gray-500/20"
                                                                : "bg-blue-500/20"
                                                                }`}
                                                        >
                                                            <FileText
                                                                size={24}
                                                                className={
                                                                    file.status === "expired"
                                                                        ? "text-gray-400"
                                                                        : "text-blue-400"
                                                                }
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-white font-semibold text-base truncate mb-1">
                                                                {file.name}
                                                            </h3>
                                                            <p className="text-gray-400 text-sm">
                                                                {file.size}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Dropdown placement="bottom-end">
                                                        <DropdownTrigger>
                                                            <Button
                                                                isIconOnly
                                                                size="sm"
                                                                variant="light"
                                                                className="custom-button-trans-override text-gray-400 hover:text-white"
                                                            >
                                                                <MoreVertical size={18} />
                                                            </Button>
                                                        </DropdownTrigger>
                                                        <DropdownMenu
                                                            aria-label="檔案操作"
                                                            className="bg-neutral-800 border-white/20 border"
                                                        >
                                                            <DropdownItem
                                                                key="view"
                                                                startContent={
                                                                    <Eye size={16} />
                                                                }
                                                                className="text-white"
                                                            >
                                                                查看詳情
                                                            </DropdownItem>
                                                            <DropdownItem
                                                                key="download"
                                                                startContent={
                                                                    <Download size={16} />
                                                                }
                                                                className="text-white"
                                                            >
                                                                下載
                                                            </DropdownItem>
                                                            <DropdownItem
                                                                key="delete"
                                                                startContent={
                                                                    <Trash2 size={16} />
                                                                }
                                                                className="text-red-400"
                                                                color="danger"
                                                            >
                                                                刪除
                                                            </DropdownItem>
                                                        </DropdownMenu>
                                                    </Dropdown>
                                                </CardHeader>
                                                <CardBody className="pt-2">
                                                    <div className="space-y-3">
                                                        {/* Status Chips */}
                                                        <div className="flex flex-wrap gap-2">
                                                            <Chip
                                                                size="sm"
                                                                startContent={
                                                                    file.isProtected ? (
                                                                        <Lock size={12} />
                                                                    ) : (
                                                                        <LockOpen size={12} />
                                                                    )
                                                                }
                                                                className={`text-xs text-white ${file.isProtected
                                                                    ? "bg-blue-600"
                                                                    : "bg-emerald-600"
                                                                    }`}
                                                            >
                                                                {file.isProtected
                                                                    ? "已開啟裝置綁定"
                                                                    : "未限制"}
                                                            </Chip>
                                                            {file.status === "expired" && (
                                                                <Chip
                                                                    size="sm"
                                                                    className="text-xs text-white bg-gray-600"
                                                                >
                                                                    已過期
                                                                </Chip>
                                                            )}
                                                        </div>

                                                        {/* Shared With */}
                                                        {activeTab === "myFiles" &&
                                                            file.sharedWith &&
                                                            file.sharedWith.length > 0 && (
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

                                                        {/* Expiry Date */}
                                                        <div className="flex items-center gap-2">
                                                            <Calendar
                                                                size={14}
                                                                className="text-gray-400"
                                                            />
                                                            <span className="text-sm text-gray-300">
                                                                {file.status === "expired"
                                                                    ? `已於 ${file.expiryDate} 過期`
                                                                    : `有效期至 ${file.expiryDate}`}
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
                                                                    {file.downloads} 次下載
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </DashboardContentTransition>

            {/* Upload Modal */}
            <UploadFiles
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSuccess={(shareId) => {
                    console.log("files upload success!", shareId);
                    // TODO: refresh file list
                }}
            />
        </div>
    );
}
