"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { gsap } from "gsap";
import CustomButton from "@/components/button";
import CustomInput from "@/components/input";
import {
    ArrowLeft,
    CircleAlert,
    CircleCheck,
    CircleX,
    Eye,
    EyeClosed,
    Key
} from "lucide-react";
import { Button } from "@heroui/button";
import PageTransition from "@/components/pageTransition";
import ProtectedRoute from "@/components/protectedRoute";
import { auth } from "@/utils/firebase";
import {
    confirmPasswordReset,
    verifyPasswordResetCode,
    checkActionCode,
} from "firebase/auth";
import { Spinner } from "@heroui/react";
import Link from "next/link";

export default function ResetPassword() {
    const [isVisible, setIsVisible] = useState(false);
    const [isConfirmVisible, setIsConfirmVisible] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [isValidating, setIsValidating] = useState(true);
    const [userEmail, setUserEmail] = useState("");

    const [passwordError, setPasswordError] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState("");

    const [hasCompletedValidation, setHasCompletedValidation] = useState(false);

    const formContainerRef = useRef<HTMLDivElement>(null);
    const errorBoxRef = useRef<HTMLDivElement>(null);
    const invalidLinkRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef<HTMLDivElement>(null);

    const oobCode = searchParams.get("oobCode");
    const mode = searchParams.get("mode");

    const toggleVisibility = () => setIsVisible(!isVisible);
    const toggleConfirmVisibility = () =>
        setIsConfirmVisible(!isConfirmVisible);

    const clearFieldErrors = () => {
        setPasswordError("");
        setConfirmPasswordError("");
        setError("");
    };

    useEffect(() => {
        const validateResetCode = async () => {
            if (!oobCode || mode !== "resetPassword") {
                setError("無效的密碼重設連結");
                setIsValidating(false);
                setHasCompletedValidation(true);
                return;
            }

            try {
                const email = await verifyPasswordResetCode(auth, oobCode);
                setUserEmail(email);
                setIsValidating(false);
                setHasCompletedValidation(true);
            } catch (error) {
                console.error("驗證重設代碼失敗:", error);
                const firebaseError = error as { code?: string };
                switch (firebaseError.code) {
                    case "auth/invalid-action-code":
                        setError("無效或已過期的密碼重設連結");
                        break;
                    case "auth/expired-action-code":
                        setError("密碼重設連結已過期");
                        break;
                    case "auth/user-disabled":
                        setError("此帳號已被停用");
                        break;
                    default:
                        setError("無法驗證密碼重設連結");
                }
                setIsValidating(false);
                setHasCompletedValidation(true);
            }
        };

        validateResetCode();
    }, [oobCode, mode]);

    const validatePassword = (pwd: string) => {
        if (pwd.length < 8) {
            return "密碼至少需要 8 個字符";
        }
        return "";
    };

    const handleResetPassword = async () => {
        clearFieldErrors();
        let isValid = true;

        const passwordValidation = validatePassword(password);
        if (passwordValidation) {
            setPasswordError(passwordValidation);
            isValid = false;
        }

        if (password !== confirmPassword) {
            setConfirmPasswordError("密碼不一致");
            isValid = false;
        }

        if (!isValid) return;

        setIsLoading(true);

        try {
            await confirmPasswordReset(auth, oobCode!, password);
            setSuccess(true);
            setError("密碼重設完成，即將自動導向至登入頁面！");
            setTimeout(async () => {
                try {
                    await handlePageExit();
                    await new Promise((resolve) => setTimeout(resolve, 100));
                    router.push("/login");
                } catch (error) {
                    console.error("transition failed!!!:", error);
                    router.push("/login");
                }
            }, 5000);
        } catch (error) {
            console.error("密碼重設失敗:", error);
            const firebaseError = error as { code?: string };
            switch (firebaseError.code) {
                case "auth/invalid-action-code":
                    setError("無效或已過期的密碼重設連結");
                    break;
                case "auth/expired-action-code":
                    setError("密碼重設連結已過期");
                    break;
                case "auth/weak-password":
                    setPasswordError("密碼強度不足");
                    break;
                case "auth/user-disabled":
                    setError("此帳號已被停用");
                    break;
                default:
                    setError("密碼重設失敗，請稍後再試");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // animate setup
    const animateErrorBox = () => {
        if (!errorBoxRef.current || !formContainerRef.current) return;

        gsap.killTweensOf(errorBoxRef.current);

        gsap.set(errorBoxRef.current, {
            scale: 0.8,
            opacity: 0,
            height: 0,
            marginBottom: 0,
        });

        const tl = gsap.timeline();

        tl.to(errorBoxRef.current, {
            height: "auto",
            marginBottom: "0.5rem",
            duration: 0.2,
            ease: "power2.out",
        }).to(
            errorBoxRef.current,
            {
                scale: 1,
                opacity: 1,
                duration: 0.3,
                ease: "back.out(1.4)",
            },
            "-=0.1"
        );
    };

    const hideErrorBox = () => {
        if (!errorBoxRef.current) return;

        gsap.killTweensOf(errorBoxRef.current);

        const tl = gsap.timeline();

        tl.to(errorBoxRef.current, {
            scale: 0.8,
            opacity: 0,
            duration: 0.2,
            ease: "power2.in",
        }).to(
            errorBoxRef.current,
            {
                height: 0,
                marginBottom: 0,
                duration: 0.2,
                ease: "power2.in",
            },
            "-=0.1"
        );
    };

    useEffect(() => {
        if (isValidating && loadingRef.current) {
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
    }, [isValidating]);

    useEffect(() => {
        if (hasCompletedValidation && !isValidating && !success) {
            const nextElement =
                error && !success
                    ? invalidLinkRef.current
                    : formContainerRef.current;

            if (!nextElement) {
                console.log(
                    "target container NOT find!\nThis is an error, REPORT IT !"
                );
                return;
            }

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
                // calculate the container's actul height
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
                                delay: index * 0.05,
                                ease: "power2.out",
                            });
                        });

                        setTimeout(() => {
                            gsap.set(nextElement, {
                                height: "auto",
                                overflow: "visible",
                                clearProps: "paddingTop,paddingBottom",
                            });
                        }, 600);
                    },
                });
            }, 40);
        }
    }, [hasCompletedValidation, error, success]);

    useEffect(() => {
        if (error && errorBoxRef.current) {
            animateErrorBox();
        } else if (!error && errorBoxRef.current) {
            hideErrorBox();
        }
    }, [error, success]);

    const handlePageExit = () => {
        return new Promise<void>((resolve) => {
            let element: HTMLDivElement | null = null;

            // check which element is really existed in DOM and has opacity
            // process this page's animation & transform is much more complicated than I thought, Bruh
            if (
                formContainerRef.current &&
                getComputedStyle(formContainerRef.current).display !== "none"
            ) {
                element = formContainerRef.current;
            } else if (
                invalidLinkRef.current &&
                getComputedStyle(invalidLinkRef.current).display !== "none"
            ) {
                element = invalidLinkRef.current;
            } else if (
                loadingRef.current &&
                getComputedStyle(loadingRef.current).display !== "none"
            ) {
                element = loadingRef.current;
            }

            if (!element) {
                console.log("No element found, resolving now");
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

            const tween = gsap.to(element, {
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
                }
            });
        });
    };

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

            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

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
                    const originalHref = href;
                    link.removeAttribute("href");
                    link.style.pointerEvents = "none";

                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    (e as MouseEvent & { __handled?: boolean }).__handled = true;

                    if (isNavigating) {
                        link.setAttribute("href", originalHref);
                        link.style.pointerEvents = "";
                        return;
                    }
                    isNavigating = true;

                    try {
                        await handlePageExit();
                        router.push(originalHref);
                    } catch (error) {
                        console.error("transition failed!!!:", error);
                        router.push(originalHref);
                    } finally {
                        link.setAttribute("href", originalHref);
                        link.style.pointerEvents = "";
                        setTimeout(() => {
                            isNavigating = false;
                        }, 100);
                    }
                }
            }
        };

        document.addEventListener("click", handleClick, true);

        return () => {
            document.removeEventListener("click", handleClick, true);
        };
    }, [router]);

    return (
        <ProtectedRoute requireAuth={false}>
            <PageTransition>
                <div className="flex flex-col min-h-screen max-h-screen bg-neutral-800 overflow-hidden">
                    <div className="bg-gradient-to-tr from-indigo-900 from-25% to-sky-800 relative overflow-hidden flex flex-1 flex-col items-center justify-center bg-cover bg-center bg-no-repeat border-t-0 rounded-b-5xl w-full shadow-2xl border-b-2 border-b-gray-500 tracking-wider">
                        {isValidating && (
                            <div
                                ref={loadingRef}
                                className="flex flex-col items-center justify-center relative border-4 border-white/20 w-[90%] sm:w-2/3 lg:w-1/3 xl:w-1/4 min-h-28 rounded-xl px-8 py-6 bg-white/5 backdrop-blur-xl shadow-2xl font-medium tracking-wide"
                            >
                                <Spinner
                                    size="lg"
                                    color="default"
                                    label="正在驗證重設連結"
                                    classNames={{
                                        label: "text-white font-bold text-xl",
                                    }}
                                />
                            </div>
                        )}

                        {/* invalid(error) container */}
                        <div
                            ref={invalidLinkRef}
                            className="hidden flex-col items-center justify-center relative border-4 border-white/20 w-[90%] sm:w-2/3 lg:w-1/3 xl:w-1/4 min-h-28 rounded-xl px-8 py-6 bg-white/5 backdrop-blur-xl shadow-2xl font-medium tracking-wide gap-4"
                        >
                            <CircleX size={64} className="text-red-500" />
                            <div className="text-2xl font-bold">
                                無效的重設連結
                            </div>
                            <div className="text-gray-300 text-base">
                                {error || "此重設連結無效或已過期"}
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

                        {/* reset password container */}
                        <div
                            ref={formContainerRef}
                            className="hidden flex-col items-center justify-center relative border-4 border-white/20 w-[90%] sm:w-2/3 lg:w-1/3 xl:w-1/4 min-h-28 rounded-xl px-8 py-6 bg-white/5 backdrop-blur-xl shadow-2xl font-medium tracking-wide"
                        >
                            <div className="flex items-center justify-center w-full text-3xl font-bold text-white pb-2">
                                重設密碼
                            </div>
                            {userEmail && (
                                <div className="text-gray-300 text-sm pb-6 text-center">
                                    為以下帳號設定一組新密碼
                                    <div className="font-semibold text-sky-300">
                                        {userEmail}
                                    </div>
                                </div>
                            )}

                            <div
                                ref={errorBoxRef}
                                className={`w-full max-w-md p-1.5 border-2 rounded-full text-sm text-center items-center justify-center gap-2 ${error ? "flex" : "hidden"} ${success
                                    ? "bg-green-500/20 border-green-500/50 text-green-200"
                                    : "bg-red-500/20 border-red-500/50 text-red-200"
                                    }`}
                            >
                                <div className="flex-shrink-0">
                                    {success ? (
                                        <CircleCheck size={16} />
                                    ) : (
                                        <CircleAlert size={16} />
                                    )}
                                </div>
                                <span className="leading-relaxed break-words">
                                    {error}
                                </span>
                            </div>

                            <div
                                className={`w-full max-w-md flex flex-col items-center transition-all duration-300 ease-out ${!passwordError && !confirmPasswordError ? "space-y-6" : "space-y-4"}`}
                            >
                                <div className="relative w-full custom-input-trans-animate">
                                    <CustomInput
                                        label="新密碼"
                                        size="sm"
                                        type={isVisible ? "text" : "password"}
                                        className="pr-12"
                                        value={password}
                                        onValueChange={setPassword}
                                        isDisabled={isLoading || success}
                                        isInvalid={!!passwordError}
                                        errorMessage={
                                            passwordError
                                                ? `*${passwordError}`
                                                : undefined
                                        }
                                    />
                                    <Button
                                        isIconOnly
                                        variant="light"
                                        aria-label="切換密碼是否可見"
                                        className="absolute right-4 top-[26px] transform -translate-y-1/2 focus:outline-hidden bg-transparent hover:bg-transparent min-w-0 w-auto h-auto p-0 text-gray-300 hover:text-white"
                                        type="button"
                                        onPress={toggleVisibility}
                                        isDisabled={isLoading || success}
                                    >
                                        {isVisible ? (
                                            <EyeClosed size={20} />
                                        ) : (
                                            <Eye size={20} />
                                        )}
                                    </Button>
                                </div>

                                <div className="relative w-full custom-input-trans-animate">
                                    <CustomInput
                                        label="確認新密碼"
                                        size="sm"
                                        type={
                                            isConfirmVisible
                                                ? "text"
                                                : "password"
                                        }
                                        className="pr-12"
                                        value={confirmPassword}
                                        onValueChange={setConfirmPassword}
                                        isDisabled={isLoading || success}
                                        isInvalid={!!confirmPasswordError}
                                        errorMessage={
                                            confirmPasswordError
                                                ? `*${confirmPasswordError}`
                                                : undefined
                                        }
                                    />
                                    <Button
                                        isIconOnly
                                        variant="light"
                                        aria-label="切換確認密碼是否可見"
                                        className="absolute right-4 top-[26px] transform -translate-y-1/2 focus:outline-hidden bg-transparent hover:bg-transparent min-w-0 w-auto h-auto p-0 text-gray-300 hover:text-white"
                                        type="button"
                                        onPress={toggleConfirmVisibility}
                                        isDisabled={isLoading || success}
                                    >
                                        {isConfirmVisible ? (
                                            <EyeClosed size={20} />
                                        ) : (
                                            <Eye size={20} />
                                        )}
                                    </Button>
                                </div>

                                <div className="flex w-full justify-center">
                                    <CustomButton
                                        variant="blur"
                                        size="lg"
                                        radius="full"
                                        startContent={
                                            !isLoading ? (
                                                <Key size={20} />
                                            ) : undefined
                                        }
                                        className="w-[180px] text-white bg-blue-500 border-0 text-lg"
                                        onPress={handleResetPassword}
                                        isLoading={isLoading}
                                        isDisabled={isLoading || success}
                                        spinner={
                                            <Spinner
                                                size="sm"
                                                color="default"
                                            />
                                        }
                                    >
                                        {success ? "密碼已重設" : "重設密碼"}
                                    </CustomButton>
                                </div>
                                <div className="flex w-full justify-center items-center">
                                    <Link
                                        href="/login"
                                        className="w-[180px]"
                                        prefetch={false}
                                    >
                                        <CustomButton
                                            variant="blur"
                                            size="lg"
                                            radius="full"
                                            className="w-full hover:bg-white/20 text-gray-200 text-lg"
                                            startContent={
                                                <ArrowLeft size={20} />
                                            }
                                        >
                                            返回登入頁面
                                        </CustomButton>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-5 flex w-full flex-shrink-0 justify-center md:justify-start">
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
            </PageTransition>
        </ProtectedRoute>
    );
}
