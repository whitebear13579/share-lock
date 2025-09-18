"use client";
import React from "react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import CustomButton from "@/components/button";
import CustomInput from "@/components/input";
import {
    CircleAlert,
    CircleCheck,
    CircleQuestionMark,
    Eye,
    EyeClosed,
    LogIn,
} from "lucide-react";
import { Button } from "@heroui/button";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import PageTransition from "@/components/pageTransition";
import ProtectedRoute from "@/components/protectedRoute";
import { auth, getPasswordResetActionCodeSettings } from "@/utils/firebase";
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    GithubAuthProvider,
    sendPasswordResetEmail,
} from "firebase/auth";
import { Spinner } from "@heroui/react";

export default function Login() {
    const [isVisible, setIsVisible] = React.useState(false);
    const router = useRouter();

    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState("");
    const [resetEmailSent, setResetEmailSent] = React.useState(false);

    const [emailError, setEmailError] = React.useState("");
    const [passwordError, setPasswordError] = React.useState("");

    const formContainerRef = useRef<HTMLDivElement>(null);
    const errorBoxRef = useRef<HTMLDivElement>(null);

    const toggleVisbility = () => setIsVisible(!isVisible);

    const clearFieldErrors = () => {
        setEmailError("");
        setPasswordError("");
        setError("");
        setResetEmailSent(false);
    };

    // regular login
    const handleEmailLogin = async () => {
        clearFieldErrors();
        let isValid = true;

        if (!email.trim()) {
            setEmailError("請輸入電子郵件");
            isValid = false;
        }
        if (!password.trim()) {
            setPasswordError("請輸入密碼");
            isValid = false;
        }

        if (!isValid) return;

        setIsLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );
            router.push("/dashboard");
        } catch (error: any) {
            console.error("Login FAILED!!!:", error);
            setResetEmailSent(false);
            switch (error.code) {
                case "auth/user-not-found":
                    setEmailError("找不到此帳號，請檢查拼字是否正確");
                    break;
                case "auth/wrong-password":
                    setPasswordError("密碼錯誤");
                    break;
                case "auth/invalid-email":
                    setEmailError("電子郵件格式不正確");
                    break;
                case "auth/user-disabled":
                    setEmailError("此帳號已被停用");
                    break;
                case "auth/invalid-credential":
                    setError("帳號或密碼錯誤");
                    break;
                case "auth/too-many-requests":
                    setError("受到速率限制，請稍後再試");
                    break;
                default:
                    setError("登入失敗，請稍後再試");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // forgot password
    const handleForgotPassword = async () => {
        if (!email.trim()) {
            setEmailError("請先輸入電子郵件地址");
            return;
        }

        setIsLoading(true);
        clearFieldErrors();

        try {
            const actionCodeSettings = getPasswordResetActionCodeSettings();
            await sendPasswordResetEmail(auth, email, actionCodeSettings);
            setResetEmailSent(true);
            setError("密碼重設信已發送");
        } catch (error: any) {
            console.error("reset pwd FAILED!!!:", error);
            switch (error.code) {
                case "auth/user-not-found":
                    setEmailError("找不到此電子郵件帳號");
                    break;
                case "auth/invalid-email":
                    setEmailError("電子郵件格式不正確");
                    break;
                default:
                    setError("密碼重設失敗，請稍後再試");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Google login
    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError("");
        setResetEmailSent(false);

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            router.push("/dashboard");
        } catch (error: any) {
            console.error("Google login FAILED!!!:", error);
            switch (error.code) {
                case "auth/account-exists-with-different-credential":
                    setError("電子郵件已使用其他方式註冊");
                    break;
                case "auth/popup-blocked":
                    setError("彈出視窗遭到封鎖");
                    break;
                case "auth/cancelled-popup-request":
                    break;
                case "auth/too-many-requests":
                    setError("受到速率限制，請稍後再試");
                    break;
                default:
                    setError("使用 Google 登入失敗，請重試");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // GitHub login
    const handleGithubLogin = async () => {
        setIsLoading(true);
        setError("");
        setResetEmailSent(false);

        try {
            const provider = new GithubAuthProvider();
            const result = await signInWithPopup(auth, provider);
            router.push("/dashboard");
        } catch (error: any) {
            console.error("GitHub login FAILED!!!:", error);
            switch (error.code) {
                case "auth/account-exists-with-different-credential":
                    setError("電子郵件已使用其他方式註冊");
                    break;
                case "auth/popup-blocked":
                    setError("彈出視窗遭到封鎖");
                    break;
                case "auth/too-many-requests":
                    setError("受到速率限制，請稍後再試");
                    break;
                default:
                    setError("使用 GitHub 登入失敗，請重試");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // animation setup
    const animateErrorBox = () => {
        if (!errorBoxRef.current || !formContainerRef.current) return;

        const currentOpacity = gsap.getProperty(errorBoxRef.current, "opacity") as number;
        const isCurrentlyVisible = currentOpacity > 0;

        if (isCurrentlyVisible) {
            gsap.killTweensOf(errorBoxRef.current);

            const tl = gsap.timeline();
            tl.to(errorBoxRef.current, {
                scale: 0.8,
                duration: 0.1,
                ease: "power2.in",
            }).to(errorBoxRef.current, {
                scale: 1.1,
                duration: 0.2,
                ease: "power2.out",
            }).to(errorBoxRef.current, {
                scale: 1,
                duration: 0.3,
                ease: "back.out(1.7)",
            });
        } else {
            gsap.killTweensOf(errorBoxRef.current);

            gsap.set(errorBoxRef.current, {
                scale: 0.8,
                opacity: 0,
                height: 0,
                marginBottom: 0,
                display: "flex",
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
        }
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
                onComplete: () => {
                    if (errorBoxRef.current) {
                        gsap.set(errorBoxRef.current, { display: "none" });
                    }
                }
            },
            "-=0.1"
        );
    };

    useEffect(() => {
        if (!formContainerRef.current) return;

        gsap.set(formContainerRef.current, {
            y: -100,
            opacity: 0,
        });

        gsap.to(formContainerRef.current, {
            y: 0,
            opacity: 1,
            duration: 0.4,
            ease: "back.out(1.2)",
        });

        if (errorBoxRef.current) {
            gsap.set(errorBoxRef.current, {
                opacity: 0,
                height: 0,
                marginBottom: 0,
                display: "none",
            });
        }
    }, []);

    useEffect(() => {
        if (error && errorBoxRef.current) {
            animateErrorBox();
        } else if (!error && errorBoxRef.current) {
            hideErrorBox();
        }
    }, [error]);

    const handlePageExit = () => {
        return new Promise<void>((resolve) => {
            if (!formContainerRef.current) {
                resolve();
                return;
            }
            const element = formContainerRef.current;
            gsap.killTweensOf(element);

            gsap.to(element, {
                y: 100,
                opacity: 0,
                duration: 0.4,
                ease: "power2.in",
                onComplete: () => {
                    resolve();
                },
            });
        });
    };

    useEffect(() => {
        let isNavigating = false;
        const handleClick = async (e: MouseEvent) => {
            if (!e.target) return;
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

            if (link && !isNavigating) {
                const href = link.getAttribute("href");
                if (href && (href.startsWith("/") || href.startsWith("#"))) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    isNavigating = true;

                    try {
                        await handlePageExit();
                        router.push(href);
                    } catch (error) {
                        console.error("transition failed.", error);
                        router.push(href);
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
                        <div
                            ref={formContainerRef}
                            className="flex flex-col items-center justify-center relative border-4 border-white/20 w-[90%] sm:w-2/3 lg:w-1/3 xl:w-1/4 min-h-28 rounded-xl px-8 py-6 bg-white/5 backdrop-blur-xl shadow-2xl font-medium tracking-wide"
                            style={{
                                transition:
                                    "height 0.3s ease-out, min-height 0.3s ease-out",
                            }}
                        >
                            <div className="flex items-center justify-center w-full text-3xl font-bold text-white pb-4">
                                登入
                            </div>
                            <div
                                ref={errorBoxRef}
                                className={`w-full max-w-md p-1.5 border-2 rounded-full text-sm text-center flex items-center justify-center gap-2 ${resetEmailSent
                                        ? "bg-green-500/20 border-green-500/50 text-green-200"
                                        : "bg-red-500/20 border-red-500/50 text-red-200"
                                    }`}
                            >
                                <div className="flex-shrink-0">
                                    {resetEmailSent ? (
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
                                className={`w-full max-w-md flex flex-col items-center ${!emailError && !passwordError ? "space-y-8" : "space-y-6"}`}
                                style={{
                                    transition:
                                        "gap 0.3s ease-out, margin 0.3s ease-out, padding 0.3s ease-out",
                                }}
                            >
                                <div className="custom-input-trans-animate w-full origin-center ">
                                    <CustomInput
                                        label="電子郵件"
                                        size="sm"
                                        type="email"
                                        value={email}
                                        onValueChange={setEmail}
                                        isDisabled={isLoading}
                                        isInvalid={!!emailError}
                                        errorMessage={`*${emailError}`}
                                    />
                                </div>
                                <div className="relative w-full origin-center custom-input-trans-animate">
                                    <CustomInput
                                        label="密碼"
                                        size="sm"
                                        type={isVisible ? "text" : "password"}
                                        className="pr-12"
                                        value={password}
                                        onValueChange={setPassword}
                                        isDisabled={isLoading}
                                        isInvalid={!!passwordError}
                                        errorMessage={`*${passwordError}`}
                                    />
                                    <Button
                                        isIconOnly
                                        variant="light"
                                        aria-label="切換密碼是否可見"
                                        className="absolute right-4 top-[26px] transform -translate-y-1/2 focus:outline-hidden bg-transparent hover:bg-transparent min-w-0 w-auto h-auto p-0 text-gray-300 hover:text-white"
                                        type="button"
                                        onPress={toggleVisbility}
                                        isDisabled={isLoading}
                                    >
                                        {isVisible ? (
                                            <EyeClosed size={20} />
                                        ) : (
                                            <Eye size={20} />
                                        )}
                                    </Button>
                                </div>
                                <div className="flex w-full justify-between items-center gap-4">
                                    <CustomButton
                                        variant="blur"
                                        size="lg"
                                        radius="full"
                                        startContent={
                                            <CircleQuestionMark
                                                size={20}
                                                className="text-gray-200"
                                            />
                                        }
                                        className="!text-sm sm:!text-lg hover:bg-white/20 text-gray-200"
                                        onPress={handleForgotPassword}
                                        isDisabled={isLoading}
                                    >
                                        忘記密碼
                                    </CustomButton>
                                    <CustomButton
                                        variant="blur"
                                        size="lg"
                                        radius="full"
                                        startContent={
                                            !isLoading ? (
                                                <LogIn size={20} />
                                            ) : undefined
                                        }
                                        className="text-white bg-blue-500 border-0 px-4 sm:px-6 custom-button-trans-override flex-shrink-0 !text-sm sm:!text-lg"
                                        onPress={handleEmailLogin}
                                        isLoading={isLoading}
                                        isDisabled={isLoading}
                                        spinner={
                                            <Spinner
                                                size="sm"
                                                color="default"
                                            />
                                        }
                                    >
                                        登入
                                    </CustomButton>
                                </div>
                                <div className="flex items-center w-full gap-3 text-gray-300 text-base">
                                    <div className="h-1 flex-1 bg-white/20 rounded-full"></div>
                                    <span>或者，使用以下方式登入</span>
                                    <div className="h-1 flex-1 bg-white/20 rounded-full"></div>
                                </div>
                                <div className="flex items-center gap-4 sm:gap-6 md:gap-10 font-normal max-w-full">
                                    <Button
                                        size="lg"
                                        radius="full"
                                        startContent={
                                            <FcGoogle
                                                size={25}
                                                className="flex-shrink-0"
                                            />
                                        }
                                        className="!test-base sm:!text-lg bg-white text-black shadow-2xl custom-button-trans-override px-4 sm:px-6 flex-1 sm:flex-initial"
                                        onPress={handleGoogleLogin}
                                        isDisabled={isLoading}
                                    >
                                        Google
                                    </Button>
                                    <Button
                                        size="lg"
                                        radius="full"
                                        startContent={
                                            <FaGithub
                                                size={25}
                                                color="white"
                                                className="flex-shrink-0"
                                            />
                                        }
                                        className="!test-base sm:!text-lg bg-zinc-900 text-white shadow-2xl custom-button-trans-override px-4 sm:px-6 flex-1 sm:flex-initial"
                                        onPress={handleGithubLogin}
                                        isDisabled={isLoading}
                                    >
                                        Github
                                    </Button>
                                </div>
                                <Link
                                    href="/signup"
                                    className="active:scale-95 transition-all duration-200 block"
                                    prefetch={false}
                                >
                                    <div className="flex items-center w-full gap-3 text-gray-300 text-base">
                                        <div className="h-1 flex-1 bg-white/20 rounded-full"></div>
                                        <span className="text-center">
                                            <span className="inline sm:inline">
                                                還沒有帳號嗎？
                                            </span>
                                            <span className="inline-block whitespace-nowrap">
                                                &nbsp;
                                                <span className="text-sky-300 font-bold hover:underline">
                                                    立即註冊！
                                                </span>
                                            </span>
                                        </span>
                                        <div className="h-1 flex-1 bg-white/20 rounded-full"></div>
                                    </div>
                                </Link>
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
