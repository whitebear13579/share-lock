"use client";
import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@heroui/react";
import { CircleCheck, CircleX, ArrowLeft } from "lucide-react";
import { applyActionCode, checkActionCode } from "firebase/auth";
import { auth } from "@/utils/firebase";
import PageTransition from "@/components/pageTransition";
import CustomButton from "@/components/button";
import Link from "next/link";
import gsap from "gsap";

function AuthActionContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [hasCompletedLoading, setHasCompletedLoading] = useState(false);

    const loadingRef = useRef<HTMLDivElement>(null);
    const successContainerRef = useRef<HTMLDivElement>(null);
    const errorContainerRef = useRef<HTMLDivElement>(null);

    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");

    // Loading animation
    useEffect(() => {
        if (loading && loadingRef.current && !hasCompletedLoading) {
            const element = loadingRef.current;

            gsap.set(element, {
                y: -100,
                opacity: 0,
            });

            gsap.to(element, {
                y: 0,
                opacity: 1,
                duration: 0.4,
                ease: "back.out(1.2)",
            });
        }
    }, [loading, hasCompletedLoading]);

    // Container animation after loading completes
    useEffect(() => {
        if (hasCompletedLoading && !loading) {
            const nextElement = error
                ? errorContainerRef.current
                : success
                    ? successContainerRef.current
                    : null;

            if (!nextElement) return;

            nextElement.style.display = "flex";
            nextElement.style.visibility = "visible";

            gsap.set(nextElement, {
                height: 0,
                opacity: 1,
                overflow: "hidden",
                paddingTop: 0,
                paddingBottom: 0,
            });

            const children = Array.from(nextElement.children);
            children.forEach((child) => {
                gsap.set(child, { opacity: 0, y: 20 });
            });

            setTimeout(() => {
                const tempStyle = nextElement.style.cssText;
                gsap.set(nextElement, {
                    height: "auto",
                    paddingTop: "1.5rem",
                    paddingBottom: "1.5rem",
                    visibility: "hidden",
                    overflow: "visible",
                });
                const targetHeight = nextElement.offsetHeight;
                nextElement.style.cssText = tempStyle;

                gsap.set(nextElement, {
                    height: 0,
                    opacity: 1,
                    overflow: "hidden",
                    paddingTop: 0,
                    paddingBottom: 0,
                    visibility: "visible",
                });

                gsap.to(nextElement, {
                    height: targetHeight,
                    paddingTop: "1.5rem",
                    paddingBottom: "1.5rem",
                    duration: 0.3,
                    ease: "power2.out",
                    onComplete: () => {
                        children.forEach((child, index) => {
                            gsap.to(child, {
                                opacity: 1,
                                y: 0,
                                duration: 0.3,
                                delay: index * 0.1,
                                ease: "back.out(1.2)",
                            });
                        });

                        setTimeout(() => {
                            gsap.set(nextElement, {
                                height: "auto",
                                overflow: "visible",
                            });
                        }, 600);
                    },
                });
            }, 40);
        }
    }, [hasCompletedLoading, loading, error, success]);

    const handlePageExit = () => {
        return new Promise<void>((resolve) => {
            let element: HTMLDivElement | null = null;

            if (
                successContainerRef.current &&
                getComputedStyle(successContainerRef.current).display !== "none"
            ) {
                element = successContainerRef.current;
            } else if (
                errorContainerRef.current &&
                getComputedStyle(errorContainerRef.current).display !== "none"
            ) {
                element = errorContainerRef.current;
            } else if (
                loadingRef.current &&
                getComputedStyle(loadingRef.current).display !== "none"
            ) {
                element = loadingRef.current;
            }

            if (!element) {
                setTimeout(() => resolve(), 100);
                return;
            }

            gsap.killTweensOf(element);

            let animationCompleted = false;

            const timeout = setTimeout(() => {
                if (!animationCompleted) {
                    animationCompleted = true;
                    resolve();
                }
            }, 450);

            gsap.to(element, {
                y: 100,
                opacity: 0,
                duration: 0.4,
                ease: "power2.in",
                onComplete: () => {
                    if (!animationCompleted) {
                        animationCompleted = true;
                        clearTimeout(timeout);
                        resolve();
                    }
                },
                onInterrupt: () => {
                    if (!animationCompleted) {
                        animationCompleted = true;
                        clearTimeout(timeout);
                        resolve();
                    }
                },
            });
        });
    };

    // Link click handler for page exit animation
    useEffect(() => {
        let isNavigating = false;
        let lastProcessedTimestamp = 0;

        const handleClick = async (e: MouseEvent) => {
            if ((e as MouseEvent & { __handled?: boolean }).__handled) {
                return;
            }

            const currentTimestamp = Date.now();
            if (currentTimestamp - lastProcessedTimestamp < 50) {
                return;
            }
            lastProcessedTimestamp = currentTimestamp;

            if (!e.target || isNavigating) {
                return;
            }

            let currentElement = e.target as Node;
            let link: HTMLAnchorElement | null = null;

            if (
                currentElement.nodeType === 1 &&
                (currentElement as Element).tagName === "A"
            ) {
                link = currentElement as HTMLAnchorElement;
            } else {
                while (currentElement && currentElement.parentNode) {
                    currentElement = currentElement.parentNode;
                    if (
                        currentElement.nodeType === 1 &&
                        (currentElement as Element).tagName === "A"
                    ) {
                        link = currentElement as HTMLAnchorElement;
                        break;
                    }
                }
            }

            if (link) {
                const href = link.getAttribute("href");
                if (href && (href.startsWith("/") || href.startsWith("#"))) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    (e as MouseEvent & { __handled?: boolean }).__handled = true;

                    if (isNavigating) {
                        return;
                    }
                    isNavigating = true;

                    try {
                        await handlePageExit();
                        await new Promise((resolve) => setTimeout(resolve, 100));
                        router.push(href);
                    } catch (error) {
                        console.error("Navigation error:", error);
                        router.push(href);
                    } finally {
                        isNavigating = false;
                    }
                }
            }
        };

        document.addEventListener("click", handleClick, true);

        return () => {
            document.removeEventListener("click", handleClick, true);
        };
    }, [router]);

    useEffect(() => {
        const handleAuthAction = async () => {
            if (!mode || !oobCode) {
                setError("無效的連結");
                setLoading(false);
                setHasCompletedLoading(true);
                return;
            }

            if (mode === "resetPassword") {
                router.replace(
                    `/reset-password?mode=${mode}&oobCode=${oobCode}`
                );
                return;
            }

            if (mode === "verifyEmail") {
                try {
                    await checkActionCode(auth, oobCode);
                    await applyActionCode(auth, oobCode);
                    setSuccess("電子郵件驗證成功！");
                    setLoading(false);
                    setHasCompletedLoading(true);

                    // 5 秒後自動跳轉到登入頁面
                    setTimeout(async () => {
                        try {
                            await handlePageExit();
                            await new Promise((resolve) => setTimeout(resolve, 100));
                            router.push("/login");
                        } catch (err) {
                            console.error("Navigation error:", err);
                            router.push("/login");
                        }
                    }, 5000);
                } catch (err: unknown) {
                    console.error("Email verification error:", err);
                    const errorMessage = err instanceof Error ? err.message : String(err);

                    if (errorMessage.includes("expired")) {
                        setError("驗證連結已過期，請重新發送驗證郵件");
                    } else if (errorMessage.includes("invalid")) {
                        setError("無效的驗證連結");
                    } else {
                        setError("驗證失敗，請稍後再試");
                    }
                    setLoading(false);
                    setHasCompletedLoading(true);
                }
                return;
            }

            if (mode === "recoverEmail") {
                try {
                    const info = await checkActionCode(auth, oobCode);
                    await applyActionCode(auth, oobCode);
                    setSuccess(`電子郵件已恢復為：${info.data.email}`);
                    setLoading(false);
                    setHasCompletedLoading(true);

                    // 5 秒後自動跳轉到登入頁面
                    setTimeout(async () => {
                        try {
                            await handlePageExit();
                            await new Promise((resolve) => setTimeout(resolve, 100));
                            router.push("/login");
                        } catch (err) {
                            console.error("Navigation error:", err);
                            router.push("/login");
                        }
                    }, 5000);
                } catch (err: unknown) {
                    console.error("Email recovery error:", err);
                    const errorMessage = err instanceof Error ? err.message : String(err);

                    if (errorMessage.includes("expired")) {
                        setError("恢復連結已過期");
                    } else if (errorMessage.includes("invalid")) {
                        setError("無效的恢復連結");
                    } else {
                        setError("恢復失敗，請聯繫客服");
                    }
                    setLoading(false);
                    setHasCompletedLoading(true);
                }
                return;
            }

            // 未知的 mode
            setError("不支援的操作類型");
            setLoading(false);
            setHasCompletedLoading(true);
        };

        handleAuthAction();

    }, [mode, oobCode, router]);

    return (
        <PageTransition>
            <div className="flex flex-col min-h-screen max-h-screen bg-neutral-800 overflow-hidden">
                <div className="bg-gradient-to-tr from-indigo-900 from-25% to-sky-800 relative overflow-hidden flex flex-1 flex-col items-center justify-center bg-cover bg-center bg-no-repeat border-t-0 rounded-b-5xl w-full shadow-2xl border-b-2 border-b-gray-500 tracking-wider">
                    {/* Loading container */}
                    <div
                        ref={loadingRef}
                        className={`flex-col items-center justify-center relative border-4 border-white/20 w-[90%] sm:w-2/3 lg:w-1/3 xl:w-1/4 min-h-28 rounded-xl px-8 py-6 bg-white/5 backdrop-blur-xl shadow-2xl font-medium tracking-wide ${loading ? 'flex' : 'hidden'}`}
                    >
                        <Spinner
                            size="lg"
                            color="default"
                            label="正在處理您的請求"
                            classNames={{
                                label: "text-white font-bold text-xl mt-2",
                            }}
                        />
                    </div>

                    {/* Success container */}
                    <div
                        ref={successContainerRef}
                        className="hidden flex-col items-center justify-center relative border-4 border-white/20 w-[90%] sm:w-2/3 lg:w-1/3 xl:w-1/4 min-h-28 rounded-xl px-8 py-6 bg-white/5 backdrop-blur-xl shadow-2xl font-medium tracking-wide gap-4"
                    >
                        <CircleCheck size={64} className="text-emerald-400" />
                        <div className="text-2xl font-bold text-emerald-400">
                            {success}
                        </div>
                        <div className="text-gray-300 text-base text-center">
                            即將自動跳轉到登入頁面...
                        </div>
                        <Link
                            href="/login"
                            prefetch={false}
                            className="w-[180px]"
                        >
                            <CustomButton
                                variant="blur"
                                size="lg"
                                radius="full"
                                className="w-full text-lg hover:bg-white/20 text-gray-200"
                            >
                                立即前往登入
                            </CustomButton>
                        </Link>
                    </div>

                    {/* Error container */}
                    <div
                        ref={errorContainerRef}
                        className="hidden flex-col items-center justify-center relative border-4 border-white/20 w-[90%] sm:w-2/3 lg:w-1/3 xl:w-1/4 min-h-28 rounded-xl px-8 py-6 bg-white/5 backdrop-blur-xl shadow-2xl font-medium tracking-wide gap-4"
                    >
                        <CircleX size={64} className="text-red-500" />
                        <div className="text-2xl font-bold text-white">
                            操作失敗
                        </div>
                        <div className="text-gray-300 text-base text-center">
                            {error || "此連結無效或已過期"}
                        </div>
                        <Link
                            href="/login"
                            prefetch={false}
                            className="w-[180px]"
                        >
                            <CustomButton
                                variant="blur"
                                size="lg"
                                radius="full"
                                className="w-full text-lg hover:bg-white/20 text-gray-200"
                                startContent={<ArrowLeft size={20} />}
                            >
                                返回登入頁面
                            </CustomButton>
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <footer className="px-6 py-5 bg-neutral-800 flex justify-center md:justify-start flex-shrink-0">
                    <p className="text-center md:text-left px-0 md:px-8 text-gray-300 whitespace-nowrap">
                        © 2025{" "}
                        <Link
                            href="/"
                            className="text-blue-500 font-bold hover:underline"
                            prefetch={false}
                        >
                            Share Lock
                        </Link>
                        &nbsp;.&nbsp;&nbsp;&nbsp;All Rights Reserved.
                    </p>
                </footer>
            </div>
        </PageTransition>
    );
}

export default function AuthAction() {
    return (
        <Suspense
            fallback={
                <PageTransition>
                    <div className="flex flex-col min-h-screen max-h-screen bg-neutral-800 overflow-hidden">
                        <div className="bg-gradient-to-tr from-indigo-900 from-25% to-sky-800 relative overflow-hidden flex flex-1 flex-col items-center justify-center bg-cover bg-center bg-no-repeat border-t-0 rounded-b-5xl w-full shadow-2xl border-b-2 border-b-gray-500 tracking-wider">
                            <div className="flex flex-col items-center justify-center relative border-4 border-white/20 w-[90%] sm:w-2/3 lg:w-1/3 xl:w-1/4 min-h-28 rounded-xl px-8 py-6 bg-white/5 backdrop-blur-xl shadow-2xl font-medium tracking-wide">
                                <Spinner
                                    size="lg"
                                    color="default"
                                    label="正在載入..."
                                    classNames={{
                                        label: "text-white font-bold text-xl mt-2",
                                    }}
                                />
                            </div>
                        </div>
                        <footer className="px-6 py-5 bg-neutral-800 flex justify-center md:justify-start flex-shrink-0">
                            <p className="text-center md:text-left px-0 md:px-8 text-gray-300 whitespace-nowrap">
                                © 2025{" "}
                                <span className="text-blue-500 font-bold">
                                    Share Lock
                                </span>
                                &nbsp;.&nbsp;&nbsp;&nbsp;All Rights Reserved.
                            </p>
                        </footer>
                    </div>
                </PageTransition>
            }
        >
            <AuthActionContent />
        </Suspense>
    );
}
