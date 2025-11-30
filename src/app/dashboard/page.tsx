"use client";
import React, { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import { useAuth } from "@/utils/authProvider";
import { Button } from "@heroui/button";
import { Cog, Folder, House, LogOut, Star, FileText, ArrowRight, Share2, Check, Lock, X, ClockFading, LockOpen, ExternalLink, BellRing, Trash, ArrowUpRight, ChartPie, MessageCircleQuestionMark } from "lucide-react";
import { Chip, Progress, Spinner, Navbar, NavbarBrand, NavbarContent, NavbarMenuToggle, NavbarMenu, NavbarMenuItem, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar, Link } from "@heroui/react";
import { Image } from "@heroui/react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Spacer } from "@heroui/spacer";
import { Divider } from "@heroui/react";
import { IoAlertOutline } from "react-icons/io5";
import DashboardNavigation from "@/components/dashboardNavigation";
import DashboardContentTransition from "@/components/dashboardContentTransition";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { getUserStorageUsage, getStorageStatusColor } from "@/utils/storageQuota";

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

    const { user, loading, logout } = useAuth();

    const handleLogout = async () => {
        console.log("[Dashboard] ==> 開始登出動畫");
        console.log("[Dashboard] fakeMainRef:", fakeMainRef.current);
        console.log("[Dashboard] fakeFooterRef:", fakeFooterRef.current);

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
        return null;
    }

    return (
        <div className="min-h-screen bg-linear-205 from-slate-700  to-neutral-800 to-55%">
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
                        <NavbarMenuItem>
                            <NextLink href="/dashboard/bug-report" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/20 text-white transition-colors">
                                <Star size={20} />
                                <span className="text-lg">漏洞有賞計畫</span>
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
                                        <Button className="custom-button-trans-override ml-auto bg-white/10 border border-white/30 text-gray-200 shadow-2xl font-medium text-sm" radius="lg" startContent={<ExternalLink size={18} />} >
                                            查看更多
                                        </Button>
                                    </CardHeader>
                                    <CardBody className="px-6 py-4">
                                        <div className="px-4">
                                            <div className="grid grid-cols-[auto_4fr_2fr_auto] items-center gap-x-3 gap-y-3">
                                                <Avatar src="https://i.pravatar.cc/40?u=user1" size="md" />
                                                <div className="flex min-w-0 flex-col">
                                                    <p className="text-white text-base font-medium truncate">Anna 想要分享 &ldquo;線性代數考古題&rdquo; 給你</p>
                                                    <p className="text-sm font-normal flex gap-2 items-center text-gray-400">
                                                        <IoAlertOutline size={16} className="rounded-full bg-amber-500 p-0.5 text-zinc-900" />即將失效： 2025 / 08 / 31
                                                    </p>
                                                </div>
                                                <div className="justify-self-center self-center">
                                                    <Chip startContent={<Lock size={14} className="text-white" />} className="pl-3 items-center text-sm text-white h-8 bg-blue-600">
                                                        已開啟裝置綁定
                                                    </Chip>
                                                </div>
                                                <div className="flex items-center justify-end gap-2 self-center">
                                                    <Button
                                                        size="sm"
                                                        radius="full"
                                                        isIconOnly
                                                        aria-label="接受"
                                                        className="custom-button-trans-override bg-emerald-600 text-white h-8 w-8 p-0"
                                                    >
                                                        <Check size={20} />
                                                    </Button>
                                                    <span className="text-sm text-white font-extrabold">/</span>
                                                    <Button
                                                        size="sm"
                                                        radius="full"
                                                        isIconOnly
                                                        aria-label="拒絕"
                                                        className="custom-button-trans-override bg-rose-500 text-white h-8 w-8 p-0"
                                                    >
                                                        <X size={20} />
                                                    </Button>
                                                </div>
                                                <Avatar src="https://i.pravatar.cc/40?u=user2" size="md" />
                                                <div className="flex min-w-0 flex-col">
                                                    <p className="text-white text-base font-medium truncate">Wendy 想要分享 &ldquo;計算機&nbsp;...&nbsp;考解答.pdf&rdquo; 給你</p>
                                                    <p className="text-sm font-normal flex gap-2 items-center text-gray-400">
                                                        <Check size={16} className="rounded-full bg-emerald-500 p-0.5 text-zinc-900" /> 2026 / 09 / 27 前有效
                                                    </p>
                                                </div>
                                                <div className="justify-self-center self-center">
                                                    <Chip startContent={<LockOpen size={14} className="text-white" />} className="pl-3 items-center text-sm text-white h-8 bg-emerald-600">
                                                        未限制
                                                    </Chip>
                                                </div>
                                                <div className="flex items-center justify-end gap-2 self-center">
                                                    <Button
                                                        size="sm"
                                                        radius="full"
                                                        isIconOnly
                                                        aria-label="接受"
                                                        className="custom-button-trans-override bg-emerald-600 text-white h-8 w-8 p-0"
                                                    >
                                                        <Check size={20} />
                                                    </Button>
                                                    <span className="text-sm text-white font-extrabold">/</span>
                                                    <Button
                                                        size="sm"
                                                        radius="full"
                                                        isIconOnly
                                                        aria-label="拒絕"
                                                        className="custom-button-trans-override bg-rose-500 text-white h-8 w-8 p-0"
                                                    >
                                                        <X size={20} />
                                                    </Button>
                                                </div>
                                            </div>
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
                                        <Button className="custom-button-trans-override ml-auto bg-white/10 border border-white/30 text-gray-200 shadow-2xl font-medium text-sm" radius="lg" startContent={<ExternalLink size={18} />} >
                                            查看全部
                                        </Button>
                                    </CardHeader>
                                    <CardBody className="px-6 py-4">
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-[auto_3fr_auto_4fr_auto] items-center gap-x-3 bg-white/10 rounded-2xl shadow-xl px-4 py-3">
                                                <div className="rounded-xl bg-orange-500/25 text-orange-400 p-0 h-10 w-10 flex items-center justify-center">
                                                    <ClockFading />
                                                </div>
                                                <div>
                                                    <p className="text-base text-gray-200 font-medium">檔案即將過期</p>
                                                    <p className="text-xs text-gray-400">2 小時前</p>
                                                </div>
                                                <Divider orientation="vertical" className="bg-white/40 h-9 w-0.5 rounded-full mx-2" />
                                                <div className="text-gray-300 text-sm">
                                                    檔案 &ldquo;在學證明.pdf&rdquo; 即將過期。
                                                </div>
                                                <Button
                                                    size="sm"
                                                    isIconOnly
                                                    radius="full"
                                                    className="custom-button-trans-override flex items-center justify-center bg-zinc-400/40 shadow-xl group"
                                                >
                                                    <Trash size={16} className="text-neutral-900 cursor-pointer group-hover:text-rose-500 transition-all duration-200" />
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-[auto_3fr_auto_4fr_auto] items-center gap-x-3 bg-white/10 rounded-2xl shadow-xl px-4 py-3">
                                                <div className="rounded-xl bg-red-500/25 text-red-400 p-0 h-10 w-10 flex items-center justify-center">
                                                    <X />
                                                </div>
                                                <div>
                                                    <p className="text-base text-gray-200 font-medium">Harry 婉拒了你的檔案</p>
                                                    <p className="text-xs text-gray-400">5 小時前</p>
                                                </div>
                                                <Divider orientation="vertical" className="bg-white/40 h-9 w-0.5 rounded-full mx-2" />
                                                <div className="text-gray-300 text-sm">
                                                    Harry 婉拒了 &ldquo;期末簡報.pptx&rdquo;
                                                </div>
                                                <Button
                                                    size="sm"
                                                    isIconOnly
                                                    radius="full"
                                                    className="custom-button-trans-override flex items-center justify-center bg-zinc-400/40 shadow-xl group"
                                                >
                                                    <Trash size={16} className="text-neutral-900 cursor-pointer group-hover:text-rose-500 transition-all duration-200" />
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-[auto_3fr_auto_4fr_auto] items-center gap-x-3 bg-white/10 rounded-2xl shadow-xl px-4 py-3">
                                                <div className="rounded-xl bg-emerald-500/25 text-emerald-400 p-0 h-10 w-10 flex items-center justify-center">
                                                    <Check />
                                                </div>
                                                <div>
                                                    <p className="text-base text-gray-200 font-medium">Miya 收到了的檔案</p>
                                                    <p className="text-xs text-gray-400">2025 / 07 / 31</p>
                                                </div>
                                                <Divider orientation="vertical" className="bg-white/40 h-9 w-0.5 rounded-full  mx-2" />
                                                <div className="text-gray-300 text-sm">
                                                    Miya 收到了 &ldquo;ヨルシカ 盗作.flac&rdquo;
                                                </div>
                                                <Button
                                                    size="sm"
                                                    isIconOnly
                                                    radius="full"
                                                    className="custom-button-trans-override flex items-center justify-center bg-zinc-400/40 shadow-xl group"
                                                >
                                                    <Trash size={16} className="text-neutral-900 cursor-pointer group-hover:text-rose-500 transition-all duration-200" />
                                                </Button>
                                            </div>
                                        </div>
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
                                            <p className="text-gray-300 text-sm">快速存取您最近開啟或分享的檔案</p>
                                        </div>
                                    </CardHeader>
                                    <CardBody className="px-6 py-4 flex-1 overflow-auto">
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-[auto_4fr_2fr_auto] items-center gap-x-3 bg-white/10 rounded-2xl shadow-xl px-4 py-3 hover:bg-white/15 transition-all duration-200 cursor-pointer">
                                                <div className="bg-red-500/20 p-2 rounded-lg">
                                                    <FileText size={20} className="text-red-400" />
                                                </div>
                                                <div className="flex min-w-0 flex-col">
                                                    <p className="text-white text-base font-medium truncate">線性代數考古題.pdf</p>
                                                    <p className="text-xs text-gray-400">上次使用是在 2025/08/31 15:42</p>
                                                </div>
                                                <div className="justify-self-center">
                                                    <Chip className="text-xs text-gray-300 bg-gray-700/50">
                                                        2.4 MB
                                                    </Chip>
                                                </div>
                                                <ArrowUpRight size={18} className="text-gray-400" />
                                            </div>
                                            <div className="grid grid-cols-[auto_4fr_2fr_auto] items-center gap-x-3 bg-white/10 rounded-2xl shadow-xl px-4 py-3 hover:bg-white/15 transition-all duration-200 cursor-pointer">
                                                <div className="bg-green-500/20 p-2 rounded-lg">
                                                    <FileText size={20} className="text-green-400" />
                                                </div>
                                                <div className="flex min-w-0 flex-col">
                                                    <p className="text-white text-base font-medium truncate">計算機概論小考解答.pdf</p>
                                                    <p className="text-xs text-gray-400">上次使用是在 2025/08/29 09:15</p>
                                                </div>
                                                <div className="justify-self-center">
                                                    <Chip className="text-xs text-gray-300 bg-gray-700/50">
                                                        1.8 MB
                                                    </Chip>
                                                </div>
                                                <ArrowUpRight size={18} className="text-gray-400" />
                                            </div>
                                            <div className="grid grid-cols-[auto_4fr_2fr_auto] items-center gap-x-3 bg-white/10 rounded-2xl shadow-xl px-4 py-3 hover:bg-white/15 transition-all duration-200 cursor-pointer">
                                                <div className="bg-purple-500/20 p-2 rounded-lg">
                                                    <FileText size={20} className="text-purple-400" />
                                                </div>
                                                <div className="flex min-w-0 flex-col">
                                                    <p className="text-white text-base font-medium truncate">期末簡報.pptx</p>
                                                    <p className="text-xs text-gray-400">上次使用是在 2025/08/28 20:30</p>
                                                </div>
                                                <div className="justify-self-center">
                                                    <Chip className="text-xs text-gray-300 bg-gray-700/50">
                                                        15.2 MB
                                                    </Chip>
                                                </div>
                                                <ArrowUpRight size={18} className="text-gray-400" />
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>
                        </>
                    )}

                    {/* mobile device layout */}
                    {isMobile && (
                        <div className="space-y-6">
                            <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                                <CardHeader className="pb-2 pt-4 px-4 flex-row items-center gap-3">
                                    <div className="bg-blue-600/30 p-2 rounded-xl">
                                        <Share2 size={24} className="text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-base text-white">檔案分享</h4>
                                        <p className="text-gray-300 text-xs">看看有沒有人要分享檔案給你？</p>
                                    </div>
                                    <Button className="custom-button-trans-override bg-white/10 border border-white/30 text-gray-200 shadow-xl font-medium text-xs" size="sm" radius="md" startContent={<ExternalLink size={14} />}>
                                        查看更多
                                    </Button>
                                </CardHeader>
                                <CardBody className="px-4 py-3">
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-[auto_3fr_auto] items-center gap-x-3 bg-white/10 rounded-xl px-3 py-2">
                                            <Avatar src="https://i.pravatar.cc/40?u=user1" size="sm" />
                                            <div className="flex min-w-0 flex-col">
                                                <p className="text-white text-sm font-medium truncate">Anna 想分享 &quot;線性代數考古題&quot;</p>
                                                <p className="text-xs text-gray-400 flex gap-1 items-center">
                                                    <IoAlertOutline size={12} className="rounded-full bg-amber-500 p-0.5 text-zinc-900" />
                                                    即將失效：2025 / 08 / 31
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Button size="sm" radius="full" isIconOnly className="custom-button-trans-override bg-emerald-600 text-white h-8 w-8 p-0">
                                                    <Check size={16} />
                                                </Button>
                                                <Button size="sm" radius="full" isIconOnly className="custom-button-trans-override bg-rose-500 text-white h-8 w-8">
                                                    <X size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-[auto_3fr_auto] items-center gap-x-3 bg-white/10 rounded-xl px-3 py-2">
                                            <Avatar src="https://i.pravatar.cc/40?u=user2" size="sm" />
                                            <div className="flex min-w-0 flex-col">
                                                <p className="text-white text-sm font-medium truncate">Wendy 想分享 &quot;計...答.pdf&quot;</p>
                                                <p className="text-xs text-gray-400 flex gap-1 items-center">
                                                    <Check size={12} className="rounded-full bg-emerald-500 p-0.5 text-zinc-900" />
                                                    2026 / 09 / 27 前有效
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Button size="sm" radius="full" isIconOnly className="custom-button-trans-override bg-emerald-600 text-white h-8 w-8 p-0">
                                                    <Check size={16} />
                                                </Button>
                                                <Button size="sm" radius="full" isIconOnly className="custom-button-trans-override bg-rose-500 text-white h-8 w-8 p-0">
                                                    <X size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
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
                                    <Button className="custom-button-trans-override bg-white/10 border border-white/30 text-gray-200 shadow-xl font-medium text-xs" size="sm" radius="md" startContent={<ExternalLink size={14} />}>
                                        查看全部
                                    </Button>
                                </CardHeader>
                                <CardBody className="px-4 py-3">
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-[auto_3fr_auto_4fr_auto] items-center gap-x-2 bg-white/10 rounded-2xl shadow-xl px-3 py-2">
                                            <div className="rounded-lg bg-orange-500/25 text-orange-400 p-1 h-8 w-8 flex items-center justify-center">
                                                <ClockFading size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-200 font-medium">檔案即將過期</p>
                                                <p className="text-xs text-gray-400">2 小時前</p>
                                            </div>
                                            <Divider orientation="vertical" className="bg-white/40 h-6 w-0.5 rounded-full mx-1" />
                                            <div className="text-gray-300 text-xs">
                                                檔案 &ldquo;在學證明.pdf&rdquo; 即將過期。
                                            </div>
                                            <Button size="sm" isIconOnly radius="full" className="custom-button-trans-override bg-zinc-400/40 shadow-xl h-8 w-8 p-0 group">
                                                <Trash size={16} className="text-neutral-900 cursor-pointer group-hover:text-rose-500 transition-all duration-200" />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-[auto_3fr_auto_4fr_auto] items-center gap-x-2 bg-white/10 rounded-2xl shadow-xl px-3 py-2">
                                            <div className="rounded-lg bg-red-500/25 text-red-400 p-1 h-8 w-8 flex items-center justify-center">
                                                <X size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-200 font-medium">Harry 已婉拒</p>
                                                <p className="text-xs text-gray-400">5 小時前</p>
                                            </div>
                                            <Divider orientation="vertical" className="bg-white/40 h-6 w-0.5 rounded-full mx-1" />
                                            <div className="text-gray-300 text-xs">
                                                Harry 婉拒了 &ldquo;期末簡報.pptx&rdquo;
                                            </div>
                                            <Button size="sm" isIconOnly radius="full" className="custom-button-trans-override bg-zinc-400/40 shadow-xl h-8 w-8 p-0 group">
                                                <Trash size={16} className="text-neutral-900 cursor-pointer group-hover:text-rose-500 transition-all duration-200" />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-[auto_3fr_auto_4fr_auto] items-center gap-x-2 bg-white/10 rounded-2xl shadow-xl px-3 py-2">
                                            <div className="rounded-lg bg-emerald-500/25 text-emerald-400 p-1 h-8 w-8 flex items-center justify-center">
                                                <Check size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-200 font-medium">Miya 已收到</p>
                                                <p className="text-xs text-gray-400">2025 / 07 / 31</p>
                                            </div>
                                            <Divider orientation="vertical" className="bg-white/40 h-6 w-0.5 rounded-full mx-1" />
                                            <div className="text-gray-300 text-xs">
                                                Miya 收到了 &ldquo;ヨルシカ 盗作.flac&rdquo;
                                            </div>
                                            <Button size="sm" isIconOnly radius="full" className="custom-button-trans-override bg-zinc-400/40 shadow-xl h-8 w-8 p-0 group">
                                                <Trash size={16} className="text-neutral-900 cursor-pointer group-hover:text-rose-500 transition-all duration-200" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                            <Card className="bg-white/10 backdrop-blur-sm border-white/20" shadow="lg">
                                <CardHeader className="pb-0 pt-4 px-4 flex-row items-center gap-3">
                                    <div className="bg-blue-500/20 p-2 rounded-xl">
                                        <FileText size={24} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-base text-white">最近使用的檔案</h4>
                                        <p className="text-gray-300 text-xs">快速存取您最近開啟或分享的檔案</p>
                                    </div>
                                </CardHeader>
                                <CardBody className="px-4 py-3">
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-[auto_4fr_auto] items-center gap-x-3 bg-white/10 rounded-xl px-3 py-2 hover:bg-white/15 transition-all cursor-pointer">
                                            <div className="bg-red-500/20 p-1.5 rounded-lg">
                                                <FileText size={16} className="text-red-400" />
                                            </div>
                                            <div className="flex min-w-0 flex-col">
                                                <p className="text-white text-sm font-medium truncate">線性代數考古題.pdf</p>
                                                <p className="text-xs text-gray-400">2025/08/31 15:42</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Chip className="text-xs text-gray-300 bg-gray-700/50 h-5 px-2">2.4MB</Chip>
                                                <ArrowUpRight size={14} className="text-gray-400" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-[auto_4fr_auto] items-center gap-x-3 bg-white/10 rounded-xl px-3 py-2 hover:bg-white/15 transition-all cursor-pointer">
                                            <div className="bg-green-500/20 p-1.5 rounded-lg">
                                                <FileText size={16} className="text-green-400" />
                                            </div>
                                            <div className="flex min-w-0 flex-col">
                                                <p className="text-white text-sm font-medium truncate">計算機概論小考解答.pdf</p>
                                                <p className="text-xs text-gray-400">2025/08/29 09:15</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Chip className="text-xs text-gray-300 bg-gray-700/50 h-5 px-2">1.8MB</Chip>
                                                <ArrowUpRight size={14} className="text-gray-400" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-[auto_4fr_auto] items-center gap-x-3 bg-white/10 rounded-xl px-3 py-2 hover:bg-white/15 transition-all cursor-pointer">
                                            <div className="bg-purple-500/20 p-1.5 rounded-lg">
                                                <FileText size={16} className="text-purple-400" />
                                            </div>
                                            <div className="flex min-w-0 flex-col">
                                                <p className="text-white text-sm font-medium truncate">期末簡報.pptx</p>
                                                <p className="text-xs text-gray-400">2025/08/28 20:30</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Chip className="text-xs text-gray-300 bg-gray-700/50 h-5 px-2">15.2MB</Chip>
                                                <ArrowUpRight size={14} className="text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
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
        </div>
    );
}
