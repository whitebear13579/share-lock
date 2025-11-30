"use client";
import React from "react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef } from "react";
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
    LogOut,
} from "lucide-react";
import { Button } from "@heroui/button";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import PageTransition from "@/components/pageTransition";
import { auth, getPasswordResetActionCodeSettings } from "@/utils/firebase";
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    GithubAuthProvider,
    sendPasswordResetEmail,
} from "firebase/auth";
import { Spinner, Navbar, NavbarContent, NavbarBrand, NavbarMenuToggle } from "@heroui/react";
import { Avatar } from "@heroui/avatar";
import { useAuth } from "@/utils/authProvider";
import { recordLogin } from "@/utils/loginHistory";
import CustomTabs from "@/components/tabs";
import { NAVIGATION_ROUTES } from "@/components/dashboardNavigation";

export default function Login() {
    const [isVisible, setIsVisible] = React.useState(false);
    const router = useRouter();
    const { user, loading, recordUserLogin } = useAuth();

    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState("");
    const [displayedError, setDisplayedError] = React.useState("");
    const [resetEmailSent, setResetEmailSent] = React.useState(false);

    const [emailError, setEmailError] = React.useState("");
    const [passwordError, setPasswordError] = React.useState("");

    const formContainerRef = useRef<HTMLDivElement>(null);
    const errorBoxRef = useRef<HTMLDivElement>(null);
    const isPageEntering = useRef(false);
    const mainContentRef = useRef<HTMLDivElement>(null);
    const footerRef = useRef<HTMLDivElement>(null);
    const fakeTabRef = useRef<HTMLDivElement>(null);
    const fakeBgRef = useRef<HTMLDivElement>(null);

    const [isMobile, setIsMobile] = React.useState(false);
    const [isRedirecting, setIsRedirecting] = React.useState(false);

    const fromLogoutRef = useRef(
        typeof window !== "undefined" &&
        sessionStorage.getItem("fromDashboardLogout") === "true"
    );

    const toggleVisbility = () => setIsVisible(!isVisible); useEffect(() => {
        if (fromLogoutRef.current) {
            return;
        }

        if (!loading && user && !isRedirecting && !isLoading) {
            setError("");
            setEmailError("");
            setPasswordError("");
            setResetEmailSent(false);
            setIsRedirecting(true);
            router.replace('/dashboard');
        }
    }, [user, loading, router, isRedirecting, isLoading]);
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 1536);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

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
        setIsRedirecting(true);

        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            try {
                await recordLogin(userCredential.user, true, 'email');
            } catch (logError) {
                console.error("Failed to record successful login:", logError);
            }

            await handlePageExit("/dashboard");
            router.push("/dashboard");
        } catch (error: unknown) {
            console.error("Login FAILED!!!:", error);
            setResetEmailSent(false);
            setIsRedirecting(false);
            const firebaseError = error as { code: string };

            try {
                await recordLogin(null, false, 'email', firebaseError.code, email);
            } catch (logError) {
                console.error("Failed to record failed login:", logError);
            }

            switch (firebaseError.code) {
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
        } catch (error: unknown) {
            console.error("reset pwd FAILED!!!:", error);
            if (typeof error === "object" && error !== null && "code" in error) {
                const firebaseError = error as { code: string };
                switch (firebaseError.code) {
                    case "auth/user-not-found":
                        setEmailError("找不到此電子郵件帳號");
                        break;
                    case "auth/invalid-email":
                        setEmailError("電子郵件格式不正確");
                        break;
                    default:
                        setError("密碼重設失敗，請稍後再試");
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Google login
    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setIsRedirecting(true);
        setError("");
        setResetEmailSent(false);

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            try {
                await recordLogin(result.user, true, 'google');
            } catch (logError) {
                console.error("Failed to record successful login:", logError);
            }

            await handlePageExit("/dashboard");
            router.push("/dashboard");
        } catch (error: unknown) {
            console.error("Google login FAILED!!!:", error);
            setIsRedirecting(false);
            const firebaseError = error as { code: string };
            try {
                await recordLogin(null, false, 'google', firebaseError.code);
            } catch (logError) {
                console.error("Failed to record failed login:", logError);
            }

            switch (firebaseError.code) {
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
        setIsRedirecting(true);
        setError("");
        setResetEmailSent(false);

        try {
            const provider = new GithubAuthProvider();
            const result = await signInWithPopup(auth, provider);

            try {
                await recordLogin(result.user, true, 'github');
            } catch (logError) {
                console.error("Failed to record successful login:", logError);
            }

            await handlePageExit("/dashboard");
            router.push("/dashboard");
        } catch (error: unknown) {
            console.error("GitHub login FAILED!!!:", error);
            setIsRedirecting(false);
            const firebaseError = error as { code: string };
            try {
                await recordLogin(null, false, 'github', firebaseError.code);
            } catch (logError) {
                console.error("Failed to record failed login:", logError);
            }

            switch (firebaseError.code) {
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

        gsap.killTweensOf(formContainerRef.current);

        const currentOpacity = gsap.getProperty(errorBoxRef.current, "opacity") as number;
        const currentHeight = gsap.getProperty(errorBoxRef.current, "height") as number;
        const isCurrentlyVisible = currentOpacity > 0 && currentHeight > 0;

        if (isCurrentlyVisible) {
            gsap.killTweensOf(errorBoxRef.current);

            setDisplayedError(error);

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
            gsap.killTweensOf(formContainerRef.current);

            const currentContainerHeight = formContainerRef.current.offsetHeight;

            gsap.set(errorBoxRef.current, {
                display: "flex",
                height: "auto",
                scale: 0.8,
                opacity: 0,
                visibility: "hidden",
            });

            const newContainerHeight = formContainerRef.current.offsetHeight;
            const heightDiff = newContainerHeight - currentContainerHeight;

            gsap.set(errorBoxRef.current, {
                height: 0,
                visibility: "visible",
                scale: 0.8,
                opacity: 0,
            });

            gsap.set(formContainerRef.current, {
                height: currentContainerHeight,
            });

            setDisplayedError(error);

            const tl = gsap.timeline({
                onComplete: () => {
                    if (formContainerRef.current) {
                        gsap.set(formContainerRef.current, { clearProps: "height" });
                    }
                    if (errorBoxRef.current) {
                        gsap.set(errorBoxRef.current, { clearProps: "height" });
                    }
                }
            });

            tl.to(formContainerRef.current, {
                height: `+=${heightDiff}`,
                duration: 0.4,
                ease: "power2.out",
            }, 0)
                .to(errorBoxRef.current, {
                    height: "auto",
                    opacity: 1,
                    duration: 0.25,
                    ease: "power2.out",
                }, 0)
                .to(errorBoxRef.current, {
                    scale: 1,
                    duration: 0.5,
                    ease: "elastic.out(1, 0.5)",
                }, 0.1);
        }
    };

    const hideErrorBox = () => {
        if (!errorBoxRef.current || !formContainerRef.current) return;


        gsap.killTweensOf(errorBoxRef.current);
        gsap.killTweensOf(formContainerRef.current);

        const errorBoxHeight = errorBoxRef.current.offsetHeight;
        const currentContainerHeight = formContainerRef.current.offsetHeight;

        const tl = gsap.timeline({
            onComplete: () => {
                setDisplayedError("");
                if (errorBoxRef.current) {
                    gsap.set(errorBoxRef.current, { display: "none" });
                }
                if (formContainerRef.current) {
                    gsap.set(formContainerRef.current, { clearProps: "height" });
                }
            }
        });

        tl.to(errorBoxRef.current, {
            scale: 0.8,
            opacity: 0,
            duration: 0.2,
            ease: "power2.in",
        }, 0)
            .to(errorBoxRef.current, {
                height: 0,
                duration: 0.2,
                ease: "power2.in",
            }, 0.1)
            .to(
                formContainerRef.current,
                {
                    height: "-=" + (errorBoxHeight + 12),
                    duration: 0.3,
                    ease: "power2.out",
                },
                0.1
            );
    };

    useLayoutEffect(() => {
        if (loading || isRedirecting || !formContainerRef.current) return;

        isPageEntering.current = true;
        if (errorBoxRef.current) {
            gsap.killTweensOf(errorBoxRef.current);
        }
        gsap.killTweensOf(formContainerRef.current);

        if (fromLogoutRef.current) {
            const overlay = document.getElementById("logout-transition-overlay");
            if (overlay) {
                gsap.to(overlay, {
                    opacity: 0,
                    duration: 0.4,
                    delay: 0.1,
                    ease: "power2.out",
                    onComplete: () => {
                        overlay.remove();
                    }
                });
            }

            if (typeof window !== "undefined") {
                sessionStorage.removeItem("fromDashboardLogout");
            }
        }

        if (errorBoxRef.current) {
            gsap.set(errorBoxRef.current, {
                display: "none",
                opacity: 0,
                height: 0,
                scale: 0.8,
            });
        }

        gsap.set(formContainerRef.current, {
            y: -100,
            opacity: 0,
        });

        gsap.to(formContainerRef.current, {
            y: 0,
            opacity: 1,
            duration: 0.4,
            ease: "back.out(1.2)",
            onComplete: () => {
                isPageEntering.current = false;
            }
        });
    }, [loading, isRedirecting]);

    useLayoutEffect(() => {
        if (isPageEntering.current) {
            return;
        }

        if (formContainerRef.current && gsap.isTweening(formContainerRef.current)) {
            return;
        }

        if (error && error.trim() && errorBoxRef.current) {
            animateErrorBox();
        } else if ((!error || !error.trim()) && errorBoxRef.current) {
            hideErrorBox();
        }
    }, [error]);

    const handlePageExit = (targetPath?: string) => {
        const isDashboardTarget = targetPath?.startsWith("/dashboard");

        return new Promise<void>((resolve) => {
            const tl = gsap.timeline({
                onComplete: () => {
                    resolve();
                },
            });

            tl.to(formContainerRef.current, {
                y: 100,
                opacity: 0,
                duration: 0.4,
                ease: "power2.in",
            });

            if (isDashboardTarget) {
                if (fakeTabRef.current && fakeBgRef.current) {
                    tl.set([fakeTabRef.current, fakeBgRef.current], {
                        opacity: 1,
                    });

                    if (typeof window !== "undefined") {
                        sessionStorage.setItem("pageTransition", "fromHome");
                    }
                } else {
                    console.warn("[Transition] fakeTabRef or fakeBgRef is null!", {
                        fakeTabRef: fakeTabRef.current,
                        fakeBgRef: fakeBgRef.current
                    });
                }

                tl.to(
                    mainContentRef.current,
                    {
                        y: -((window.innerHeight) + 50),
                        duration: 0.5,
                        ease: "power2.inOut",
                    },
                    "-=0.2"
                );

                tl.to(
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
                        await handlePageExit(href);
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


    if ((loading || (user && !isRedirecting)) && !fromLogoutRef.current) {
        return (
            <div className="flex flex-col min-h-screen max-h-screen bg-neutral-800">
                <div className="flex-1 flex items-center justify-center bg-gradient-to-tr from-indigo-900 to-sky-800 rounded-b-5xl border-b-2 border-b-gray-500">
                    <Spinner size="lg" color="default" />
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
        );
    }

    return (
        <PageTransition>
            <div className="flex flex-col min-h-screen max-h-screen bg-neutral-800 overflow-hidden relative">
                <div ref={mainContentRef} className="bg-gradient-to-tr from-indigo-900 from-25% to-sky-800 relative z-20 overflow-hidden flex flex-1 flex-col items-center justify-center bg-cover bg-center bg-no-repeat border-t-0 rounded-b-5xl w-full shadow-2xl border-b-2 border-b-gray-500 tracking-wider">
                    <div
                        ref={formContainerRef}
                        className="flex flex-col items-center justify-center relative border-4 border-white/20 w-[90%] sm:w-2/3 lg:w-1/3 xl:w-1/4 min-h-28 rounded-xl px-8 py-6 bg-white/5 backdrop-blur-xl shadow-2xl font-medium tracking-wide"
                    >
                        <div className="flex items-center justify-center w-full text-3xl font-bold text-white pb-4 transition-all duration-300">
                            登入
                        </div>
                        <div className="w-full max-w-md flex flex-col gap-3">
                            <div
                                ref={errorBoxRef}
                                className={`w-full p-1.5 border-2 rounded-full text-sm text-center flex items-center justify-center gap-2 ${resetEmailSent
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
                                    {displayedError || '\u00A0'}
                                </span>
                            </div>
                            <div
                                className={`w-full flex flex-col items-center transition-[gap,margin,padding] duration-300 ease-out ${!emailError && !passwordError ? "space-y-8" : "space-y-6"}`}
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
                                    size="sm"
                                    src="/undefined.png"
                                />
                            </NavbarContent>
                        </Navbar>
                    </div>
                )}
            </div>
        </PageTransition>
    );
}
