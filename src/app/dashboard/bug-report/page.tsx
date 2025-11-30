"use client";
import React, { useRef, useState, useEffect } from "react";
import { gsap } from "gsap";
import { useAuth } from "@/utils/authProvider";
import { useRouter } from "next/navigation";
import { Spinner, Navbar, NavbarContent, NavbarMenuToggle, NavbarBrand, NavbarMenu, NavbarMenuItem, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar, Link } from "@heroui/react";
import { House, Folder, Cog, Star, MessageCircleQuestionMark, LogOut } from "lucide-react";
import NextLink from "next/link";
import DashboardNavigation from "@/components/dashboardNavigation";
import DashboardContentTransition from "@/components/dashboardContentTransition";

export default function BugReport() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const fakeMainRef = useRef<HTMLDivElement>(null);
    const fakeFooterRef = useRef<HTMLDivElement>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

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
            {!isMobile && (
                <DashboardNavigation loading={loading} onLogout={handleLogout} />
            )}

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
                            <p className="font-bold text-xl text-white">漏洞有賞計畫</p>
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
                            <NextLink href="/dashboard/settings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/20 text-white transition-colors">
                                <Cog size={20} />
                                <span className="text-lg">帳號設定</span>
                            </NextLink>
                        </NavbarMenuItem>
                        <NavbarMenuItem>
                            <NextLink href="/dashboard/bug-report" className="flex items-center gap-3 p-3 rounded-xl bg-white/20 text-blue-400">
                                <Star size={20} />
                                <span className="text-lg font-medium">漏洞有賞計畫</span>
                            </NextLink>
                        </NavbarMenuItem>
                    </NavbarMenu>
                </Navbar>
            )}

            <DashboardContentTransition>
                <div className={isMobile ? "pt-20 px-4" : "pt-36 px-12"}>
                    <h1 className={`font-bold text-white mb-2 ${isMobile ? "text-2xl" : "text-4xl"}`}>
                        🐛 漏洞有賞計畫
                    </h1>
                    <p className="text-gray-300 text-lg">
                        發現問題?回報給我們,一起讓 Share Lock 更安全!
                    </p>
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
