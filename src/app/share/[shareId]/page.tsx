"use client";
import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/utils/authProvider";
import { Timestamp } from "firebase/firestore";
import { gsap } from "gsap";
import CustomButton from "@/components/button";
import CustomInput from "@/components/input";
import PageTransition from "@/components/pageTransition";
import { Spinner, InputOtp, Chip } from "@heroui/react";
import Link from "next/link";
import {
    checkWebAuthnSupport,
    checkPlatformAuthenticatorAvailable,
    registerAuthenticator,
    verifyAuthenticator
} from "@/utils/webauthn";
import { CircleX, CircleAlert, ArrowLeft, Download, Lock, LockOpen, InfoIcon, Check } from "lucide-react";

type ShareMode = "device" | "account" | "pin" | "public";

interface ShareData {
    fileId: string;
    ownerUid: string; // files owner
    boundUid?: string; // "account" share mode's bound uid
    valid: boolean;
    createdAt: Timestamp;
}

interface DeviceInfo {
    id: string;
    label: string;
    credentialId: string;
    publicKey: string;
    counter: number;
    createdAt: Timestamp;
    boundByUid?: string;
}

interface FileData {
    displayName: string;
    originalName: string;
    size: number;
    contentType: string;
    expiresAt: Timestamp;
    createdAt: Timestamp;
    remainingDownloads: number;
    maxDownloads: number;
    shareMode: ShareMode;
    revoked: boolean;
    ownerUid: string;
    allowedDevices: DeviceInfo[];
}

export default function SharePage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const shareId = params.shareId as string;

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [errorKey, setErrorKey] = useState(0); // Used to force re-render on same error message
    const [displayedError, setDisplayedError] = useState("");
    const [shareData, setShareData] = useState<ShareData | null>(null);
    const [fileData, setFileData] = useState<FileData | null>(null);
    const [needsAuth, setNeedsAuth] = useState(false);
    const [pinInput, setPinInput] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [verified, setVerified] = useState(false);
    const [hasDownloaded, setHasDownloaded] = useState(false);
    const [, setIsAnimatingCount] = useState(false);
    const [displayCount, setDisplayCount] = useState<number | null>(null);
    const [sessionToken, setSessionToken] = useState<string>("");
    const [webAuthnSupported, setWebAuthnSupported] = useState(false);
    const [deviceLabel, setDeviceLabel] = useState("");
    const [hasCompletedLoading, setHasCompletedLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const loadingRef = useRef<HTMLDivElement>(null);
    const formContainerRef = useRef<HTMLDivElement>(null);
    const errorContainerRef = useRef<HTMLDivElement>(null);
    const errorBoxRef = useRef<HTMLDivElement>(null);
    const countRef = useRef<HTMLDivElement>(null);
    const verificationSectionRef = useRef<HTMLDivElement>(null);
    const downloadSectionRef = useRef<HTMLDivElement>(null);
    const fileSizeTypeRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);
    const fileNameRef = useRef<HTMLDivElement>(null);
    const remainingDateRef = useRef<HTMLDivElement>(null);
    const chipRef = useRef<HTMLDivElement>(null);
    const isPageEntering = useRef(false);

    const setErrorWithAnimation = useCallback((message: string) => {
        setError(message);
        setErrorKey(prev => prev + 1);
    }, []);

    useEffect(() => {
        const support = checkWebAuthnSupport();
        setWebAuthnSupported(support.supported);

        if (fileData?.shareMode === "device" && !support.supported) {
            setErrorWithAnimation(support.error || "此裝置不支援 WebAuthn");
        }
    }, [fileData, setErrorWithAnimation]);

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    };

    const truncateFileName = (name: string, maxLength: number = 15): string => {
        if (name.length <= maxLength) return name;
        const keepLength = Math.floor((maxLength - 3) / 2);
        return `${name.slice(0, keepLength)}...${name.slice(-keepLength)}`;
    };

    const animateCountChange = useCallback((newCount: number) => {
        if (!countRef.current) {
            setFileData((prev) => prev ? { ...prev, remainingDownloads: newCount } : null);
            return;
        }

        setIsAnimatingCount(true);
        const container = countRef.current;

        setDisplayCount(fileData?.remainingDownloads ?? 0);

        const tl = gsap.timeline({
            onComplete: () => {
                setFileData((prev) => prev ? { ...prev, remainingDownloads: newCount } : null);
                setDisplayCount(null);
                setIsAnimatingCount(false);
                gsap.set(container, { clearProps: "all" });
            }
        });

        tl.to(container, {
            y: -20,
            opacity: 0,
            duration: 0.25,
            ease: "power2.in",
        })
            .set(container, {
                y: 20,
            })
            .call(() => {
                setDisplayCount(newCount);
            })
            .to(container, {
                y: 0,
                opacity: 1,
                duration: 0.3,
                ease: "back.out(1.5)",
            });
    }, [fileData?.remainingDownloads]);

    const animateVerificationTransition = useCallback(() => {
        return new Promise<void>((resolve) => {
            setIsTransitioning(true);

            const container = formContainerRef.current;
            const verificationSection = verificationSectionRef.current;

            if (!container) {
                setVerified(true);
                setIsTransitioning(false);
                resolve();
                return;
            }

            const startHeight = container.offsetHeight;

            const titleFirst = titleRef.current?.getBoundingClientRect().top;
            const fileNameFirst = fileNameRef.current?.getBoundingClientRect().top;
            const remainingDateFirst = remainingDateRef.current?.getBoundingClientRect().top;
            const chipFirst = chipRef.current?.getBoundingClientRect().top;
            const buttonFirst = downloadSectionRef.current?.getBoundingClientRect().top;

            container.style.height = `${startHeight}px`;
            container.style.overflow = 'hidden';

            const tl = gsap.timeline();

            if (verificationSection) {
                tl.to(verificationSection, {
                    opacity: 0,
                    duration: 0.2,
                    ease: "power2.in",
                    onComplete: () => {
                        verificationSection.style.display = 'none';
                    }
                }, 0);
            }

            tl.call(() => {
                setVerified(true);
            }, [], 0.15);

            tl.call(() => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        const fileSizeType = fileSizeTypeRef.current;

                        if (fileSizeType) {
                            fileSizeType.classList.remove('absolute', 'pointer-events-none');
                            fileSizeType.style.opacity = '0';
                        }

                        container.style.height = 'auto';
                        const actualTargetHeight = container.offsetHeight;
                        const titleLast = titleRef.current?.getBoundingClientRect().top;
                        const fileNameLast = fileNameRef.current?.getBoundingClientRect().top;
                        const remainingDateLast = remainingDateRef.current?.getBoundingClientRect().top;
                        const chipLast = chipRef.current?.getBoundingClientRect().top;
                        const buttonLast = downloadSectionRef.current?.getBoundingClientRect().top;

                        container.style.height = `${startHeight}px`;

                        const flipData = [
                            { ref: titleRef, first: titleFirst, last: titleLast },
                            { ref: fileNameRef, first: fileNameFirst, last: fileNameLast },
                            { ref: remainingDateRef, first: remainingDateFirst, last: remainingDateLast },
                            { ref: chipRef, first: chipFirst, last: chipLast },
                            { ref: downloadSectionRef, first: buttonFirst, last: buttonLast },
                        ];

                        flipData.forEach(({ ref, first, last }) => {
                            if (ref.current && first !== undefined && last !== undefined) {
                                const deltaY = first - last;
                                gsap.set(ref.current, { y: deltaY });
                            }
                        });

                        const tl2 = gsap.timeline({
                            onComplete: () => {
                                gsap.set(container, { clearProps: "height,overflow" });
                                flipData.forEach(({ ref }) => {
                                    if (ref.current) gsap.set(ref.current, { clearProps: "y" });
                                });
                                if (fileSizeType) {
                                    fileSizeType.style.opacity = '';
                                }
                                setIsTransitioning(false);
                                resolve();
                            }
                        });

                        tl2.to(container, {
                            height: actualTargetHeight,
                            duration: 0.4,
                            ease: "power2.out",
                        }, 0);

                        flipData.forEach(({ ref }) => {
                            if (ref.current) {
                                tl2.to(ref.current, {
                                    y: 0,
                                    duration: 0.4,
                                    ease: "power2.out",
                                }, 0);
                            }
                        });

                        if (fileSizeType) {
                            tl2.to(fileSizeType, {
                                opacity: 1,
                                duration: 0.3,
                                ease: "power2.out",
                            }, 0.1);
                        }
                    });
                });
            }, [], 0.2);
        });
    }, []);

    useEffect(() => {
        const loadShare = async () => {
            try {
                setIsLoading(true);
                setError("");
                setLoadError(false);

                if (authLoading) {
                    return;
                }

                const response = await fetch("/api/share/get-info", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ shareId }),
                });

                const data = await response.json();

                if (!response.ok) {
                    console.error("internal server error", data.error);
                    setError(data.error || "載入失敗");
                    setLoadError(true);
                    setIsLoading(false);
                    setHasCompletedLoading(true);
                    return;
                }

                const share = {
                    ...data.shareData,
                    boundUid: data.shareData.boundUid,
                    createdAt: data.shareData.createdAt?._seconds
                        ? new Timestamp(
                            data.shareData.createdAt._seconds,
                            data.shareData.createdAt._nanoseconds
                        )
                        : Timestamp.now(),
                };
                setShareData(share);

                const file: FileData = {
                    displayName: data.fileData.displayName,
                    originalName: data.fileData.originalName,
                    size: data.fileData.size,
                    contentType: data.fileData.contentType,
                    expiresAt: data.fileData.expiresAt?._seconds
                        ? new Timestamp(
                            data.fileData.expiresAt._seconds,
                            data.fileData.expiresAt._nanoseconds
                        )
                        : Timestamp.now(),
                    createdAt: data.fileData.createdAt?._seconds
                        ? new Timestamp(
                            data.fileData.createdAt._seconds,
                            data.fileData.createdAt._nanoseconds
                        )
                        : Timestamp.now(),
                    remainingDownloads: data.fileData.remainingDownloads ?? 0,
                    maxDownloads: data.fileData.maxDownloads ?? 0,
                    shareMode: data.fileData.shareMode || "public",
                    revoked: data.fileData.revoked || false,
                    ownerUid: data.fileData.ownerUid,
                    allowedDevices: data.fileData.allowedDevices || [],
                };
                setFileData(file);

                // account mode
                if (file.shareMode === "account") {
                    if (share.boundUid) {
                        if (!user) {
                            setNeedsAuth(true);
                            setIsLoading(false);
                            setHasCompletedLoading(true);
                            return;
                        }

                        if (share.boundUid !== user.uid) {
                            setNeedsAuth(false);
                            setIsLoading(false);
                            setHasCompletedLoading(true);
                            return;
                        }

                        setNeedsAuth(false);
                    } else {
                        if (!user) {
                            setNeedsAuth(true);
                            setIsLoading(false);
                            setHasCompletedLoading(true);
                            return;
                        }
                        setNeedsAuth(false);
                    }
                } else if (file.shareMode === "device") {
                    // device mode
                    if (file.allowedDevices && file.allowedDevices.length > 0) {
                        if (!user) {
                            setNeedsAuth(true);
                            setIsLoading(false);
                            setHasCompletedLoading(true);
                            return;
                        }
                        setNeedsAuth(false);
                    }
                }

                setIsLoading(false);
                setHasCompletedLoading(true);
            } catch (err) {
                console.error("load share data failed:", err);
                setError("載入失敗，請稍後再試");
                setLoadError(true);
                setIsLoading(false);
                setHasCompletedLoading(true);
            }
        };

        if (shareId) {
            loadShare();
        }
    }, [shareId, user, authLoading]);

    const handleVerification = async () => {
        if (!shareData || !fileData) return;

        setIsVerifying(true);

        try {
            let verificationSuccess = false;

            if (fileData.shareMode === "account") {

                if (!user) {
                    setErrorWithAnimation("請先登入");
                    setIsVerifying(false);
                    return;
                }

                if (shareData.boundUid) {
                    if (shareData.boundUid !== user.uid) {
                        setErrorWithAnimation("此檔案已綁定至其他帳號");
                        setIsVerifying(false);
                        return;
                    }

                } else {
                    const bindResponse = await fetch("/api/share/bind-account", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            shareId,
                            userId: user.uid,
                        }),
                    });

                    const bindData = await bindResponse.json();

                    if (!bindResponse.ok) {
                        setErrorWithAnimation(bindData.error === "already bound to another account"
                            ? "此檔案已綁定至其他帳號"
                            : "綁定失敗，請重試");
                        setIsVerifying(false);
                        return;
                    }
                    setShareData((prev) => prev ? { ...prev, boundUid: user.uid } : null);
                }
                verificationSuccess = true;
            } else if (fileData.shareMode === "device") {
                if (fileData.allowedDevices.length === 0) {
                    if (!user) {
                        setErrorWithAnimation("綁定裝置前請先登入");
                        setNeedsAuth(true);
                        setIsVerifying(false);
                        return;
                    }

                    const support = checkWebAuthnSupport();
                    if (!support.supported) {
                        setErrorWithAnimation(support.error || "很抱歉，此裝置不支援 WebAuthn");
                        setIsVerifying(false);
                        return;
                    }

                    const hasPlatform = await checkPlatformAuthenticatorAvailable();
                    if (!hasPlatform) {
                        setErrorWithAnimation("此裝置沒有內建認證器，系統無法認證");
                        setIsVerifying(false);
                        return;
                    }

                    const result = await registerAuthenticator(shareId, user.uid, deviceLabel || "我的裝置");

                    if (!result.success) {
                        console.error("webauthn register failed:", result.error);
                        setErrorWithAnimation(result.error || "裝置綁定失敗");
                        setIsVerifying(false);
                        return;
                    }
                    verificationSuccess = true;
                } else {
                    if (!user) {
                        setErrorWithAnimation("請先登入");
                        setIsVerifying(false);
                        return;
                    }

                    const result = await verifyAuthenticator(shareId, user.uid);

                    if (!result.success || !result.verified) {
                        console.error("webauthn verify failed:", result.error);
                        setErrorWithAnimation(result.error || "未通過裝置驗證");
                        setIsVerifying(false);
                        return;
                    }

                    if (result.sessionToken) {
                        setSessionToken(result.sessionToken);
                    }
                    verificationSuccess = true;
                }
            } else if (fileData.shareMode === "pin") {

                if (!pinInput || pinInput.length !== 6) {
                    setErrorWithAnimation("請輸入 6 位數 PIN 碼");
                    setIsVerifying(false);
                    return;
                }

                const verifyResponse = await fetch("/api/share/verify-pin", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        shareId,
                        pin: pinInput,
                    }),
                });

                const verifyData = await verifyResponse.json();

                if (!verifyResponse.ok) {
                    setErrorWithAnimation(verifyData.error || "PIN 碼驗證失敗");
                    setIsVerifying(false);
                    return;
                }

                if (verifyData.sessionToken) {
                    setSessionToken(verifyData.sessionToken);
                }
                verificationSuccess = true;
            } else {
                // public mode
                verificationSuccess = true;
            }

            if (verificationSuccess) {
                setError("");
                setIsVerifying(false);
                await animateVerificationTransition();
            }
        } catch (err) {
            console.error("auth failed, please try again later:", err);
            setErrorWithAnimation("驗證失敗，請重試");
            setIsVerifying(false);
        }
    };

    const handleDownload = async () => {
        if (!fileData || !shareData) return;

        setIsDownloading(true);
        try {
            if (!verified) {
                setErrorWithAnimation("請先完成驗證");
                setIsDownloading(false);
                return;
            }

            if (fileData.shareMode === "account" && user) {

                if (shareData.boundUid && shareData.boundUid !== user.uid) {
                    setErrorWithAnimation("此檔案已綁定至其他帳號");
                    setIsDownloading(false);
                    return;
                }
            }

            if (fileData.shareMode === "device" && !sessionToken) {
                setErrorWithAnimation("請重新進行裝置驗證");
                setIsDownloading(false);
                return;
            }

            if (fileData.shareMode === "pin" && !sessionToken) {
                setErrorWithAnimation("請重新輸入 PIN 碼驗證");
                setIsDownloading(false);
                return;
            }

            const now = Date.now();
            const expiresAt = fileData.expiresAt.toDate().getTime();
            if (now > expiresAt) {
                setErrorWithAnimation("此分享已過期");
                setIsDownloading(false);
                return;
            }

            if (fileData.remainingDownloads <= 0) {
                setErrorWithAnimation("下載次數已達上限");
                setIsDownloading(false);
                return;
            }

            // always call API to signature download URL !!!!
            const requestBody: { shareId: string; sessionToken?: string } = {
                shareId,
            };

            if ((fileData.shareMode === "device" || fileData.shareMode === "pin") && sessionToken) {
                requestBody.sessionToken = sessionToken;
            }

            // Build headers with optional Authorization for logged-in users
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
            };

            // Add Authorization header if user is logged in (for sharedWithMe tracking)
            if (user) {
                try {
                    const idToken = await user.getIdToken();
                    headers["Authorization"] = `Bearer ${idToken}`;
                } catch (err) {
                    console.error("Failed to get ID token:", err);
                }
            }

            const response = await fetch("/api/download/issue-url", {
                method: "POST",
                headers,
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("internal server error:", errorData);
                throw new Error(errorData.error || "無法產生下載連結");
            }

            const data = await response.json();
            const downloadUrl = data.downloadUrl;

            const downloadResponse = await fetch(downloadUrl);
            if (!downloadResponse.ok) {
                throw new Error("下載檔案失敗");
            }

            const blob = await downloadResponse.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = fileData.displayName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(blobUrl);

            const newRemainingDownloads = Math.max(0, fileData.remainingDownloads - 1);

            animateCountChange(newRemainingDownloads);

            setHasDownloaded(true);
            setIsDownloading(false);
        } catch (err) {
            console.error("download failed:", err);
            setErrorWithAnimation(err instanceof Error ? err.message : "下載失敗，請重試");
            setIsDownloading(false);
        }
    };

    const animateErrorBox = useCallback((errorMessage: string) => {
        if (!errorBoxRef.current || !formContainerRef.current) return;

        gsap.killTweensOf(formContainerRef.current);
        gsap.killTweensOf(errorBoxRef.current);

        const currentOpacity = gsap.getProperty(errorBoxRef.current, "opacity") as number;
        const computedDisplay = getComputedStyle(errorBoxRef.current).display;
        const isCurrentlyVisible = currentOpacity > 0.5 && computedDisplay !== "none";

        if (isCurrentlyVisible) {
            setDisplayedError(errorMessage);

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

            setDisplayedError(errorMessage);

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
    }, []);

    const hideErrorBox = useCallback(() => {
        if (!errorBoxRef.current || !formContainerRef.current) return;

        gsap.killTweensOf(errorBoxRef.current);
        gsap.killTweensOf(formContainerRef.current);

        const errorBoxHeight = errorBoxRef.current.offsetHeight;

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
    }, []);

    useEffect(() => {
        if (isLoading && loadingRef.current && !hasCompletedLoading) {
            const element = loadingRef.current;

            element.style.display = "flex";

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
    }, [isLoading, hasCompletedLoading]);

    useEffect(() => {
        if (hasCompletedLoading && !isLoading) {
            const nextElement = loadError
                ? errorContainerRef.current
                : formContainerRef.current;

            if (!nextElement) {
                return;
            }

            isPageEntering.current = true;

            const children = Array.from(nextElement.children);
            children.forEach((child) => {
                gsap.set(child, { opacity: 0, y: 20 });
            });

            nextElement.style.position = "absolute";
            nextElement.style.visibility = "hidden";
            nextElement.style.display = "flex";
            nextElement.style.height = "auto";
            nextElement.style.paddingTop = "1.5rem";
            nextElement.style.paddingBottom = "1.5rem";
            nextElement.style.pointerEvents = "none";

            requestAnimationFrame(() => {
                const targetHeight = nextElement.offsetHeight;

                nextElement.style.height = "0px";
                nextElement.style.paddingTop = "0";
                nextElement.style.paddingBottom = "0";
                nextElement.style.overflow = "hidden";

                if (loadingRef.current) {
                    const loadingElement = loadingRef.current;

                    gsap.to(loadingElement, {
                        height: 0,
                        opacity: 0,
                        paddingTop: 0,
                        paddingBottom: 0,
                        duration: 0.25,
                        ease: "power2.in",
                        onComplete: () => {
                            loadingElement.style.display = "none";

                            nextElement.style.position = "relative";
                            nextElement.style.visibility = "visible";
                            nextElement.style.pointerEvents = "auto";

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
                                        isPageEntering.current = false;
                                    }, 600);
                                },
                            });
                        },
                    });
                } else {
                    nextElement.style.position = "relative";
                    nextElement.style.visibility = "visible";
                    nextElement.style.pointerEvents = "auto";

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
                                isPageEntering.current = false;
                            }, 600);
                        },
                    });
                }
            });
        }
    }, [hasCompletedLoading, isLoading, loadError]);

    useLayoutEffect(() => {
        if (isPageEntering.current) {
            return;
        }

        if (!hasCompletedLoading || isLoading || loadError) {
            return;
        }

        if (formContainerRef.current && gsap.isTweening(formContainerRef.current)) {
            return;
        }

        if (error && error.trim() && errorBoxRef.current) {
            animateErrorBox(error);
        } else if ((!error || !error.trim()) && errorBoxRef.current) {
            hideErrorBox();
        }
    }, [error, errorKey, hasCompletedLoading, isLoading, loadError, animateErrorBox, hideErrorBox]);

    const handlePageExit = () => {
        return new Promise<void>((resolve) => {
            let element: HTMLDivElement | null = null;

            if (
                formContainerRef.current &&
                getComputedStyle(formContainerRef.current).display !== "none"
            ) {
                element = formContainerRef.current;
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
                if (href && (href.startsWith("/") || href.startsWith("#")) && !href.startsWith("/api/")) {
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
        <PageTransition>
            <div className="flex flex-col min-h-screen max-h-screen bg-neutral-800 overflow-hidden">
                <div className="bg-gradient-to-tr from-indigo-900 from-25% to-sky-800 relative overflow-hidden flex flex-1 flex-col items-center justify-center bg-cover bg-center bg-no-repeat border-t-0 rounded-b-5xl w-full shadow-2xl border-b-2 border-b-gray-500 tracking-wider">
                    {/* Loading container */}
                    <div
                        ref={loadingRef}
                        className={`flex-col items-center justify-center relative border-4 border-white/20 w-[90%] sm:w-2/3 lg:w-1/3 xl:w-1/4 min-h-28 rounded-xl px-8 py-6 bg-white/5 backdrop-blur-xl shadow-2xl font-medium tracking-wide ${isLoading ? 'flex' : 'hidden'}`}
                    >
                        <Spinner
                            size="lg"
                            color="default"
                            label="正在載入分享資訊"
                            classNames={{
                                label: "text-white font-bold text-xl mt-2",
                            }}
                        />
                    </div>

                    {/* Error container*/}
                    <div
                        ref={errorContainerRef}
                        className="hidden flex-col items-center justify-center relative border-4 border-white/20 w-[90%] sm:w-2/3 lg:w-1/3 xl:w-1/4 min-h-28 rounded-xl px-8 py-6 bg-white/5 backdrop-blur-xl shadow-2xl font-medium tracking-wide gap-4"
                    >
                        <CircleX size={64} className="text-red-500" />
                        <div className="text-2xl font-bold text-white">
                            無法載入分享
                        </div>
                        <div className="text-gray-300 text-base text-center">
                            {error || "此分享連結無效或已過期"}
                        </div>
                        <Link
                            href={user ? "/dashboard" : "/"}
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
                                {user ? "返回儀表板" : "返回首頁"}
                            </CustomButton>
                        </Link>
                    </div>

                    {/* Main content container */}
                    <div
                        ref={formContainerRef}
                        className="hidden flex-col items-center justify-center relative border-4 border-white/20 w-[90%] sm:w-2/3 lg:w-1/3 xl:w-1/4 min-h-28 rounded-xl px-8 py-6 bg-white/5 backdrop-blur-xl shadow-2xl font-medium tracking-wide"
                    >
                        <div
                            ref={titleRef}
                            className="flex items-center justify-center w-full text-3xl font-bold text-white pb-4"
                        >
                            檔案分享
                        </div>

                        {/* Error msg box*/}
                        <div
                            ref={errorBoxRef}
                            className="hidden w-full max-w-md p-1.5 mb-3 border-2 rounded-full text-sm text-center items-center justify-center gap-2 bg-red-500/20 border-red-500/50 text-red-200"
                        >
                            <div className="flex-shrink-0">
                                <CircleAlert size={16} />
                            </div>
                            <span className="leading-relaxed break-words">
                                {displayedError || '\u00A0'}
                            </span>
                        </div>

                        <div className="w-full max-w-md flex flex-col items-center transition-all duration-300 ease-out space-y-4">
                            {fileData && (
                                <>
                                    <div
                                        ref={fileNameRef}
                                        className="w-full p-3 bg-white/10 rounded-xl border border-white/20"
                                    >
                                        <div className="text-gray-300 text-sm mb-1">
                                            檔案名稱
                                        </div>
                                        <div className="text-white font-semibold text-base break-all" title={fileData.displayName}>
                                            {truncateFileName(fileData.displayName, 20)}
                                        </div>
                                    </div>

                                    <div
                                        ref={remainingDateRef}
                                        className="w-full flex gap-2"
                                    >
                                        <div className="flex-1 p-3 bg-white/10 rounded-xl border border-white/20">
                                            <div className="text-gray-300 text-sm mb-1">
                                                剩餘次數
                                            </div>
                                            <div
                                                ref={countRef}
                                                className="text-white font-semibold text-base overflow-hidden"
                                            >
                                                {!fileData.maxDownloads || fileData.maxDownloads === 0
                                                    ? "無限制"
                                                    : (displayCount !== null ? displayCount : fileData.remainingDownloads)}
                                            </div>
                                        </div>
                                        <div className="flex-1 p-3 bg-white/10 rounded-xl border border-white/20">
                                            <div className="text-gray-300 text-sm mb-1">
                                                到期日
                                            </div>
                                            <div className="text-white font-semibold text-base">
                                                {fileData.expiresAt
                                                    .toDate()
                                                    .toLocaleDateString("zh-TW", {
                                                        year: "numeric",
                                                        month: "2-digit",
                                                        day: "2-digit",
                                                    })}
                                            </div>
                                        </div>
                                    </div>

                                    {verified && (
                                        <div
                                            ref={fileSizeTypeRef}
                                            className={`w-full flex gap-2 ${isTransitioning ? 'absolute opacity-0 pointer-events-none' : ''
                                                }`}
                                        >
                                            <div className="flex-1 p-3 bg-white/10 rounded-xl border border-white/20">
                                                <div className="text-gray-300 text-sm mb-1">
                                                    檔案大小
                                                </div>
                                                <div className="text-white font-semibold text-base">
                                                    {formatBytes(fileData.size)}
                                                </div>
                                            </div>
                                            <div className="flex-1 p-3 bg-white/10 rounded-xl border border-white/20">
                                                <div className="text-gray-300 text-sm mb-1">
                                                    檔案類型
                                                </div>
                                                <div className="text-white font-semibold text-base break-all">
                                                    {fileData.contentType || "未知"}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div
                                        ref={chipRef}
                                        className="w-full flex gap-2 items-center justify-center"
                                    >
                                        {fileData.shareMode === "public" ? (
                                            <Chip
                                                startContent={<LockOpen size={14} className="text-white" />}
                                                className="pl-3 items-center text-sm text-white h-8 bg-emerald-600"
                                            >
                                                未限制
                                            </Chip>
                                        ) : (
                                            <Chip
                                                startContent={<Lock size={14} className="text-white" />}
                                                className="pl-3 items-center text-sm text-white h-8 bg-blue-600"
                                            >
                                                {fileData.shareMode === "pin" && "密碼鎖定"}
                                                {fileData.shareMode === "device" && "裝置綁定"}
                                                {fileData.shareMode === "account" && "帳號綁定"}
                                            </Chip>
                                        )}
                                    </div>

                                    <div
                                        ref={verificationSectionRef}
                                        className="w-full flex flex-col items-center space-y-4"
                                    >
                                        {needsAuth && (
                                            <div className="w-full p-3 bg-yellow-500/20 border-2 border-yellow-500/50 rounded-xl text-yellow-200 text-base text-center flex items-center justify-center gap-2">
                                                <InfoIcon size={18} /> 登入帳號來存取此檔案
                                            </div>
                                        )}

                                        {fileData.shareMode === "pin" && !needsAuth && (
                                            <div className="w-full flex flex-col gap-3">
                                                <div
                                                    className="flex justify-center"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !isVerifying && !isTransitioning) {
                                                            handleVerification();
                                                        }
                                                    }}
                                                >
                                                    <InputOtp
                                                        length={6}
                                                        value={pinInput}
                                                        onValueChange={setPinInput}
                                                        onComplete={() => {
                                                            if (!isVerifying && !isTransitioning) {
                                                                handleVerification();
                                                            }
                                                        }}
                                                        validationBehavior="aria"
                                                        size="lg"
                                                        variant="bordered"
                                                        classNames={{
                                                            base: "justify-center gap-2",
                                                            segmentWrapper: "gap-2",
                                                            segment: "bg-white/10 border-2 border-white/30 !text-white font-bold text-xl rounded-xl backdrop-blur-sm data-[active=true]:border-sky-400 data-[active=true]:bg-white/20 transition-all duration-200 [&_input]:!text-white [&_input]:!caret-white",
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {fileData.shareMode === "device" && !needsAuth && (
                                            <div className="w-full flex flex-col gap-3">
                                                {fileData.allowedDevices.length === 0 ? (
                                                    <>
                                                        {!user ? (
                                                            <div className="p-3 bg-yellow-500/20 border-2 border-yellow-500/50 rounded-xl text-yellow-200 text-base text-center flex items-center justify-center gap-2">
                                                                <InfoIcon size={18} /> 設定裝置綁定前需要登入帳號
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <label className="text-gray-200 text-sm font-medium text-center">
                                                                    請為此裝置命名：
                                                                </label>
                                                                <CustomInput
                                                                    placeholder="例如：上冰的 MacBook Pro"
                                                                    value={deviceLabel}
                                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeviceLabel(e.target.value)}
                                                                    className="w-full"
                                                                />
                                                                <div className="text-gray-300 text-xs text-center">
                                                                    將使用 {webAuthnSupported ? "Face ID 等裝置驗證器" : "瀏覽器驗證"} 進行裝置綁定
                                                                </div>
                                                            </>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="p-3 bg-blue-500/20 border-2 border-blue-500/50 rounded-xl text-blue-200 text-base text-center flex items-center justify-center gap-2">
                                                        <InfoIcon size={18} /> 檔案已與 {fileData.allowedDevices[0]?.label || '未知裝置'} 綁定
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {!needsAuth && !(fileData.shareMode === "device" && fileData.allowedDevices.length === 0 && !user) && (
                                        <div
                                            ref={downloadSectionRef}
                                            className="flex w-full justify-center mt-2 relative min-h-12"
                                        >
                                            <div
                                                className={`transition-all duration-300 ${verified
                                                    ? 'opacity-0 pointer-events-none absolute inset-0 flex justify-center'
                                                    : 'opacity-100'
                                                    }`}
                                            >
                                                <CustomButton
                                                    variant="blur"
                                                    size="lg"
                                                    radius="full"
                                                    onClick={handleVerification}
                                                    isDisabled={isVerifying || isTransitioning}
                                                    isLoading={isVerifying}
                                                    className="w-[180px] text-white bg-blue-500 border-0 text-lg"
                                                    spinner={
                                                        <Spinner
                                                            size="sm"
                                                            color="default"
                                                        />
                                                    }
                                                >
                                                    {fileData.shareMode === "public"
                                                        ? "繼續"
                                                        : "驗證並存取"}
                                                </CustomButton>
                                            </div>

                                            <div
                                                className={`transition-all duration-300 ${verified
                                                    ? 'opacity-100'
                                                    : 'opacity-0 pointer-events-none absolute inset-0 flex justify-center'
                                                    }`}
                                            >
                                                <CustomButton
                                                    variant="blur"
                                                    size="lg"
                                                    radius="full"
                                                    onClick={handleDownload}
                                                    isDisabled={
                                                        isDownloading || hasDownloaded || fileData.remainingDownloads <= 0
                                                    }
                                                    isLoading={isDownloading}
                                                    className={`w-[180px] text-white border-0 text-lg ${hasDownloaded
                                                        ? "bg-gray-500 cursor-not-allowed"
                                                        : "bg-emerald-600"
                                                        }`}
                                                    startContent={
                                                        !isDownloading ? (
                                                            hasDownloaded ? (
                                                                <Check size={20} />
                                                            ) : (
                                                                <Download size={20} />
                                                            )
                                                        ) : undefined
                                                    }
                                                    spinner={
                                                        <Spinner
                                                            size="sm"
                                                            color="default"
                                                        />
                                                    }
                                                >
                                                    {hasDownloaded
                                                        ? "已下載"
                                                        : fileData.remainingDownloads > 0
                                                            ? "下載檔案"
                                                            : "下載次數已用盡"}
                                                </CustomButton>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="flex w-full justify-center items-center">
                                <Link href={user ? "/dashboard" : "/"} className="w-[180px]" prefetch={false}>
                                    <CustomButton
                                        variant="blur"
                                        size="lg"
                                        radius="full"
                                        className="w-full hover:bg-white/20 text-gray-200 text-lg"
                                        startContent={<ArrowLeft size={20} />}
                                    >
                                        {user ? "返回資訊主頁" : "返回首頁"}
                                    </CustomButton>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-5 flex w-full flex-shrink-0 justify-center md:justify-start">
                    <p className="text-center md:text-left px-0 md:px-8 text-gray-300 whitespace-nowrap">
                        © 2025{" "}
                        <span className="text-blue-500 font-bold">
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
    );
}
