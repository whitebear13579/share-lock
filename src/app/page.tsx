"use client";
import { FileText, LogIn, SendHorizonal, Upload, LogOut, CheckIcon } from "lucide-react";
import NextImage from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import CustomButton from "@/components/button";
import CustomInput from "@/components/input";
import CustomTabs from "@/components/tabs";
import PageTransition from "@/components/pageTransition";
import { useAuth } from "@/utils/authProvider";
import { Avatar } from "@heroui/avatar";
import { Navbar, NavbarContent, NavbarBrand, NavbarMenuToggle, Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import UploadFiles from "@/components/uploadFiles";
import { NAVIGATION_ROUTES } from "@/components/dashboardNavigation";

export default function Home() {
    const router = useRouter();
    const logoRef = useRef<HTMLImageElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLDivElement>(null);
    const loginBtnRef = useRef<HTMLDivElement>(null);
    const pdfDownBtnRef = useRef<HTMLDivElement>(null);
    const mainContentRef = useRef<HTMLDivElement>(null);
    const footerRef = useRef<HTMLDivElement>(null);
    const fakeTabRef = useRef<HTMLDivElement>(null);
    const fakeBgRef = useRef<HTMLDivElement>(null);

    const { user, loading } = useAuth();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [shareInput, setShareInput] = useState("");
    const [isMobile, setIsMobile] = useState(false);
    const [pdfPopover, setPdfPopover] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });

    const handlePdfDownload = () => {
        window.open('https://pdfdl.sharelock.qzz.io/', '_blank');
        setPdfPopover({ isOpen: true, message: '簡報已下載' });
        setTimeout(() => setPdfPopover({ isOpen: false, message: '' }), 3000);
    };

    const handleShareNavigate = async () => {
        if (!shareInput.trim()) return;

        let shareId = "";

        // analyze input to extract shareId
        const trimmedInput = shareInput.trim();

        // case 1: full url (include https://)
        if (trimmedInput.startsWith("http://") || trimmedInput.startsWith("https://")) {
            try {
                const url = new URL(trimmedInput);
                const pathParts = url.pathname.split("/").filter(Boolean);
                const shareIndex = pathParts.indexOf("share");
                if (shareIndex !== -1 && pathParts[shareIndex + 1]) {
                    shareId = pathParts[shareIndex + 1];
                }
            } catch {
                // URL parsing failed, try other methods
            }
        }

        // case 2: url without prefix (not include https://)
        if (!shareId && trimmedInput.includes("/share/")) {
            const parts = trimmedInput.split("/share/");
            if (parts[1]) {
                shareId = parts[1].split("/")[0];
            }
        }

        // case 3: direct shareId input
        if (!shareId && !trimmedInput.includes("/")) {
            shareId = trimmedInput;
        }

        // if shareId is successfully parsed, navigate
        if (shareId) {
            await handlePageExit();
            router.push(`/share/${shareId}`);
        }
    };

    const handleShareInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleShareNavigate();
        }
    };

    // Check screen size for responsive fake tab
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 1536);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    useEffect(() => {
        const overlay = document.getElementById("logout-transition-overlay");
        if (overlay) {
            overlay.remove();
        }
    }, []);

    // animation setup
    const handlePageEnrty = () => {
        if (
            !logoRef.current ||
            !titleRef.current ||
            !formRef.current ||
            !loginBtnRef.current ||
            !pdfDownBtnRef.current
        )
            return;

        gsap.set([logoRef.current, titleRef.current, formRef.current], {
            y: -100,
            opacity: 0,
        });

        gsap.set([loginBtnRef.current, pdfDownBtnRef.current], {
            scale: 0,
            opacity: 0,
        });

        const tl = gsap.timeline();
        tl.to(logoRef.current, {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: "back.out(1.2)",
        })
            .to(
                titleRef.current,
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.3,
                    ease: "back.out(1.1)",
                },
                "-=0.2"
            )
            .to(
                formRef.current,
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.35,
                    ease: "back.out(1.1)",
                },
                "-=0.15"
            )
            .to(
                [loginBtnRef.current, pdfDownBtnRef.current],
                {
                    scale: 1,
                    opacity: 1,
                    duration: 0.35,
                    ease: "back.out(1.7)",
                },
                "-=0.2"
            )
            .then(() => {
                console.log("Home Page Loaded.");
            });
    };

    useEffect(() => {
        handlePageEnrty();
    }, []);

    const handlePageExit = async (targetPath?: string) => {
        const isDashboardTarget = targetPath?.startsWith("/dashboard");

        return new Promise<void>((resolve) => {
            const tl = gsap.timeline({
                onComplete: resolve,
            });

            tl.to([loginBtnRef.current, pdfDownBtnRef.current], {
                scale: 0,
                opacity: 0,
                duration: 0.2,
                ease: "back.in(1.7)",
            })

                .to(
                    formRef.current,
                    {
                        y: 200,
                        opacity: 0,
                        duration: 0.3,
                        ease: "circ.in",
                    },
                    "-=0.1"
                )
                .to(
                    titleRef.current,
                    {
                        y: 120,
                        opacity: 0,
                        duration: 0.25,
                        ease: "expo.in",
                    },
                    "-=0.2"
                )
                .to(
                    logoRef.current,
                    {
                        y: 150,
                        opacity: 0,
                        duration: 0.25,
                        ease: "power3.in",
                    },
                    "-=0.15"
                );

            // only to dashboard
            if (isDashboardTarget) {
                if (fakeTabRef.current && fakeBgRef.current) {
                    tl.set([fakeTabRef.current, fakeBgRef.current], {
                        opacity: 1,
                    });

                    if (typeof window !== "undefined") {
                        sessionStorage.setItem("pageTransition", "fromHome");
                    }
                }

                tl.to(
                    mainContentRef.current,
                    {
                        y: -((window.innerHeight) + 50),
                        duration: 0.5,
                        ease: "power2.inOut",
                    },
                    "+=0"
                )

                    .to(
                        footerRef.current,
                        {
                            y: 200,
                            duration: 0.4,
                            ease: "power2.in",
                        },
                        "-=0.4"
                    );
            }
        });
    };

    useEffect(() => {
        let isNavigating = false;
        const handleClick = async (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest("a");

            if (link && !isNavigating) {
                const href = link.getAttribute("href");

                if (href == "/") {
                    e.preventDefault();
                    await handlePageExit("/");
                    handlePageEnrty();
                    return;
                }

                if (href && (href.startsWith("/") || href.startsWith("#"))) {
                    e.preventDefault();
                    isNavigating = true;
                    await handlePageExit(href);
                    router.push(href);
                }
            }
        };

        const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
            if (!isNavigating) {
                e.preventDefault();
                handlePageExit();
            }
        };

        document.addEventListener("click", handleClick);
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            document.removeEventListener("click", handleClick);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [router]);

    return (
        <PageTransition>
            <div className="flex flex-col min-h-screen max-h-screen bg-neutral-800 overflow-hidden relative">
                <div ref={mainContentRef} className="bg-gradient-to-tr from-indigo-900 from-25% to-sky-800 relative z-20 overflow-hidden flex flex-1 flex-col items-center justify-center bg-cover bg-center bg-no-repeat border-t-0 rounded-b-5xl w-full shadow-2xl border-b-2 border-b-gray-500 tracking-wider">
                    <div className="absolute top-6 right-6 flex space-x-3">
                        <div ref={pdfDownBtnRef}>
                            <Popover
                                isOpen={pdfPopover.isOpen}
                                onOpenChange={(open) => !open && setPdfPopover({ isOpen: false, message: '' })}
                                placement="bottom"
                                offset={8}
                                showArrow={true}
                                classNames={{
                                    base: "before:bg-emerald-700",
                                    content: "bg-emerald-600 border-emerald-700 border-2"
                                }}
                            >
                                <PopoverTrigger>
                                    <CustomButton
                                        variant="blur"
                                        size="lg"
                                        radius="full"
                                        startContent={
                                            <FileText
                                                size={18}
                                                className="text-gray-200"
                                            />
                                        }
                                        isDisabled={loading}
                                        onPress={handlePdfDownload}
                                        className="text-base hover:bg-white/20 text-gray-200"
                                    >
                                        PDF 下載
                                    </CustomButton>
                                </PopoverTrigger>
                                <PopoverContent>
                                    <div className="px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <CheckIcon size={20} className="text-white" />
                                            <span className="text-base text-white font-medium">{pdfPopover.message}</span>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div ref={loginBtnRef}>
                            {user ? (
                                <Link href="/dashboard" prefetch={false}>
                                    <CustomButton
                                        variant="blur"
                                        size="lg"
                                        radius="full"
                                        startContent={
                                            <Avatar
                                                src={
                                                    user.photoURL
                                                        ? user.photoURL
                                                        : "/undefined.png"
                                                }
                                                name={
                                                    user.displayName
                                                        ? user.displayName
                                                        : undefined

                                                }
                                                radius="full"
                                                size="sm"
                                            />
                                        }
                                        isDisabled={loading}
                                        className="text-base hover:bg-white/20 text-gray-200"
                                    >
                                        {user.displayName}
                                    </CustomButton>
                                </Link>
                            ) : (
                                <Link href="/login" prefetch={false}>
                                    <CustomButton
                                        variant="blur"
                                        size="lg"
                                        radius="full"
                                        startContent={
                                            <LogIn
                                                size={18}
                                                className="text-gray-200"
                                            />
                                        }
                                        className="text-base hover:bg-white/20 text-gray-200"
                                    >
                                        登入
                                    </CustomButton>
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-center">
                        <NextImage
                            ref={logoRef}
                            src="/icon.svg"
                            alt="logo"
                            width={300}
                            height={0}
                            className="w-[70vw] sm:w-[50vw] md:w-[25vw] h-auto object-contain"
                        />
                        <div
                            ref={titleRef}
                            className="tracking-widest text-xl md:text-2xl font-bold mb-8 mt-4 text-white"
                        >
                            一個安全、高效的檔案分享軟體。
                        </div>
                    </div>
                    <div
                        ref={formRef}
                        className="flex flex-col items-center justify-center relative border-2 border-white/20 w-[90%] sm:w-2/3 md:w-2/5 min-h-28 rounded-xl p-6 bg-white/5 backdrop-blur-xl shadow-2xl font-medium tracking-wide"
                    >
                        <div className="flex flex-col items-center space-y-4 w-full">
                            <div className="flex flex-col xl:flex-row items-center space-y-3 xl:space-y-0 xl:space-x-3 w-full">
                                <div className="flex-1 w-full custom-input-trans-animate">
                                    <CustomInput
                                        size="sm"
                                        label="輸入分享連結？"
                                        className="w-full"
                                        value={shareInput}
                                        onChange={(e) => setShareInput(e.target.value)}
                                        onKeyDown={handleShareInputKeyDown}
                                        endContent={
                                            <div className="rounded-full">
                                                <CustomButton
                                                    variant="blur"
                                                    size="sm"
                                                    radius="full"
                                                    startContent={
                                                        <SendHorizonal
                                                            size={18}
                                                            className="text-sky-300  transition-colors duration-200"
                                                        />
                                                    }
                                                    className="bg-white/15 border-white/20 border hover:bg-sky-400 [&:hover_svg]:text-gray-800 !min-w-8 h-8"
                                                    onPress={handleShareNavigate}
                                                ></CustomButton>
                                            </div>
                                        }
                                    ></CustomInput>
                                </div>
                                <div className="text-white/70 px-3 text-lg transition-all">
                                    或者
                                </div>
                                <div className="overflow-hidden rounded-full shadow-2xl">
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
                                        className="text-lg hover:bg-emerald-400 hover:text-gray-800 text-gray-200 lg:w-auto justify-center overflow-visible group"
                                    >
                                        上傳檔案
                                    </CustomButton>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div ref={footerRef} className="px-6 py-5 flex w-full flex-shrink-0 justify-center md:justify-start z-20">
                    <p className="text-center md:text-left px-0 md:px-8 text-gray-300 whitespace-nowrap">
                        © 2025{" "}
                        <span className=" text-blue-500 font-bold">
                            <Link
                                href="/"
                                className="hover:underline"
                                prefetch={false}
                            >
                                Share Lock
                            </Link>
                        </span>
                        &nbsp;.&nbsp;&nbsp;&nbsp;All Rights Reserved.
                    </p>
                </div>
            </div>

            {/* Fake Background for Transition */}
            <div
                ref={fakeBgRef}
                className="fixed inset-0 bg-linear-205 from-slate-700 to-neutral-800 to-55% opacity-0 pointer-events-none z-[5]"
            />

            {/* Fake Tab Navigation for Transition */}
            <div
                ref={fakeTabRef}
                className="fixed inset-0 z-10 opacity-0 pointer-events-none"
            >
                {!isMobile && (
                    <div className="absolute top-6 right-6 flex space-x-3">
                        <CustomTabs
                            tabs={NAVIGATION_ROUTES}
                            defaultTab="dashboard"
                            layoutId="fakeTabNavigation"
                        />
                        <CustomButton
                            variant="blur"
                            size="lg"
                            radius="full"
                            startContent={<LogOut size={18} className="text-gray-200" />}
                            className="text-base hover:bg-white/20 text-gray-200"
                        >
                            登出
                        </CustomButton>
                    </div>
                )}

                {isMobile && (
                    <div className="absolute top-0 left-0 right-0">
                        <Navbar
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
                                    aria-label="開啟選單"
                                    className="text-white"
                                />
                            </NavbarContent>

                            <NavbarContent justify="center">
                                <NavbarBrand>
                                    <p className="font-bold text-xl text-white">資訊主頁</p>
                                </NavbarBrand>
                            </NavbarContent>

                            <NavbarContent justify="end">
                                <Avatar
                                    isBordered
                                    as="button"
                                    className="transition-transform"
                                    color="success"
                                    name={user?.displayName || "User"}
                                    size="sm"
                                    src={user?.photoURL || "/undefined.png"}
                                />
                            </NavbarContent>
                        </Navbar>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            <UploadFiles
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSuccess={() => {
                    setIsUploadModalOpen(false);
                }}
            />
        </PageTransition>
    );
}
