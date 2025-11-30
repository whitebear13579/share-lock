"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/utils/authProvider";
import { Timestamp } from "firebase/firestore";
import gsap from "gsap";
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
import { hashPin } from "@/utils/crypto";
import { CircleX, ArrowLeft, Download, FileText } from "lucide-react";

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
    pinHash?: string;
    revoked: boolean;
    ownerUid: string;
    allowedDevices: DeviceInfo[];
}

export default function SharePage() {
    const params = useParams();
    const { user, loading: authLoading } = useAuth();
    const shareId = params.shareId as string;

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [shareData, setShareData] = useState<ShareData | null>(null);
    const [fileData, setFileData] = useState<FileData | null>(null);
    const [needsAuth, setNeedsAuth] = useState(false);
    const [pinInput, setPinInput] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [verified, setVerified] = useState(false);
    const [downloadSuccess, setDownloadSuccess] = useState(false);
    const [sessionToken, setSessionToken] = useState<string>("");
    const [webAuthnSupported, setWebAuthnSupported] = useState(false);
    const [deviceLabel, setDeviceLabel] = useState("");

    const containerRef = useRef<HTMLDivElement>(null);
    const errorBoxRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        const support = checkWebAuthnSupport();
        setWebAuthnSupported(support.supported);

        if (fileData?.shareMode === "device" && !support.supported) {
            setError(support.error || "此裝置不支援 WebAuthn");
        }
    }, [fileData]);


    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    };

    useEffect(() => {
        const loadShare = async () => {
            try {
                setIsLoading(true);
                setError("");

                if (authLoading) {
                    console.log("waiting the auth loading.");
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
                    console.log("internal server error", data.error);
                    setError(data.error || "載入失敗");
                    setIsLoading(false);
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
                    pinHash: data.fileData.pinHash,
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
                            setError("此檔案已綁定帳號，請先登入");
                            setIsLoading(false);
                            return;
                        }

                        if (share.boundUid !== user.uid) {
                            setNeedsAuth(false);
                            setError("此檔案已綁定至其他帳號");
                            setIsLoading(false);
                            return;
                        }

                        setNeedsAuth(false);
                        setError("");
                    } else {
                        if (!user) {
                            setNeedsAuth(true);
                            setError("此檔案已開啟帳號綁定，請先登入");
                            setIsLoading(false);
                            return;
                        }
                        setNeedsAuth(false);
                        setError("");
                    }
                } else if (file.shareMode === "device") {
                    // device mode
                    if (file.allowedDevices && file.allowedDevices.length > 0) {
                        if (!user) {
                            setNeedsAuth(true);
                            setError("此檔案已綁定特定裝置，請先登入");
                            setIsLoading(false);
                            return;
                        }
                        setNeedsAuth(false);
                        setError("");
                    }
                }

                setIsLoading(false);
            } catch (err) {
                console.error("load share data failed:", err);
                setError("載入失敗，請稍後再試");
                setIsLoading(false);
            }
        };

        if (shareId) {
            loadShare();
        }
    }, [shareId, user, authLoading]);

    const handleVerification = async () => {
        if (!shareData || !fileData) return;

        setIsVerifying(true);
        setError("");

        try {

            if (fileData.shareMode === "account") {

                if (!user) {
                    setError("請先登入");
                    setIsVerifying(false);
                    return;
                }

                if (shareData.boundUid) {
                    if (shareData.boundUid !== user.uid) {
                        setError("此檔案已綁定至其他帳號");
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
                        setError(bindData.error === "already bound to another account"
                            ? "此檔案已綁定至其他帳號"
                            : "綁定失敗，請重試");
                        setIsVerifying(false);
                        return;
                    }
                    setShareData((prev) => prev ? { ...prev, boundUid: user.uid } : null);
                }
                setVerified(true);
            } else if (fileData.shareMode === "device") {
                if (fileData.allowedDevices.length === 0) {
                    if (!user) {
                        setError("綁定裝置前請先登入");
                        setNeedsAuth(true);
                        setIsVerifying(false);
                        return;
                    }

                    const support = checkWebAuthnSupport();
                    if (!support.supported) {
                        setError(support.error || "很抱歉，此裝置不支援 WebAuthn");
                        setIsVerifying(false);
                        return;
                    }

                    const hasPlatform = await checkPlatformAuthenticatorAvailable();
                    if (!hasPlatform) {
                        setError("此裝置沒有內建認證器，系統無法認證");
                        setIsVerifying(false);
                        return;
                    }

                    const result = await registerAuthenticator(shareId, user.uid, deviceLabel || "我的裝置");

                    if (!result.success) {
                        console.error("webauthn register failed:", result.error);
                        setError(result.error || "裝置綁定失敗");
                        setIsVerifying(false);
                        return;
                    }
                    setVerified(true);
                } else {
                    if (!user) {
                        setError("請先登入");
                        setIsVerifying(false);
                        return;
                    }

                    const result = await verifyAuthenticator(shareId, user.uid);

                    if (!result.success || !result.verified) {
                        console.error("webauthn verify failed:", result.error);
                        setError(result.error || "未通過裝置驗證");
                        setIsVerifying(false);
                        return;
                    }

                    if (result.sessionToken) {
                        setSessionToken(result.sessionToken);
                    }
                    setVerified(true);
                }
            } else if (fileData.shareMode === "pin") {

                if (!pinInput || pinInput.length !== 6) {
                    setError("請輸入 6 位數 PIN 碼");
                    setIsVerifying(false);
                    return;
                }

                const inputHash = hashPin(pinInput);
                if (inputHash !== fileData.pinHash) {
                    setError("PIN 碼錯誤");
                    setIsVerifying(false);
                    return;
                }
                setVerified(true);
            } else {
                // public mode
                setVerified(true);
            }

            setIsVerifying(false);
        } catch (err) {
            console.error("auth failed, please try again later:", err);
            setError("驗證失敗，請重試");
            setIsVerifying(false);
        }
    };

    const handleDownload = async () => {
        if (!fileData || !shareData) return;

        setIsDownloading(true);
        setError("");

        try {
            if (!verified) {
                setError("請先完成驗證");
                setIsDownloading(false);
                return;
            }

            if (fileData.shareMode === "account" && user) {

                if (shareData.boundUid && shareData.boundUid !== user.uid) {
                    setError("此檔案已綁定至其他帳號");
                    setIsDownloading(false);
                    return;
                }
            }

            if (fileData.shareMode === "device" && !sessionToken) {
                console.log("missing session token, cannot download");
                setError("請重新進行裝置驗證");
                setIsDownloading(false);
                return;
            }

            const now = Date.now();
            const expiresAt = fileData.expiresAt.toDate().getTime();
            if (now > expiresAt) {
                setError("此分享已過期");
                setIsDownloading(false);
                return;
            }

            if (fileData.remainingDownloads <= 0) {
                setError("下載次數已達上限");
                setIsDownloading(false);
                return;
            }

            // always call API to signature download URL !!!!
            const requestBody: { shareId: string; sessionToken?: string } = {
                shareId,
            };

            // device mode needs sessionToken
            if (fileData.shareMode === "device" && sessionToken) {
                requestBody.sessionToken = sessionToken;
            }

            const response = await fetch("/api/download/issue-url", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.log("internal server error:", errorData);
                throw new Error(errorData.error || "無法產生下載連結");
            }

            const data = await response.json();
            const downloadUrl = data.downloadUrl;
            const remainingDownloads = data.remainingDownloads;


            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = fileData.displayName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            if (typeof remainingDownloads === 'number') {
                setFileData((prev) =>
                    prev
                        ? {
                            ...prev,
                            remainingDownloads,
                        }
                        : null
                );
            }
            setDownloadSuccess(true);
            setIsDownloading(false);
        } catch (err) {
            console.error("download failed:", err);
            setError(err instanceof Error ? err.message : "下載失敗，請重試");
            setIsDownloading(false);
        }
    };

    useEffect(() => {
        if (error && errorBoxRef.current) {
            gsap.fromTo(
                errorBoxRef.current,
                { opacity: 0, y: -20 },
                { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.4)" }
            );
        }
    }, [error]);

    useEffect(() => {
        if (isLoading && containerRef.current) {
            gsap.set(containerRef.current, {
                y: -100,
                opacity: 0,
            });

            gsap.to(containerRef.current, {
                y: 0,
                opacity: 1,
                duration: 0.4,
                ease: "back.out(1.2)",
            });
        }
    }, [isLoading]);

    useEffect(() => {
        if (!isLoading && containerRef.current && (shareData || error)) {
            gsap.set(containerRef.current, {
                y: -100,
                opacity: 0,
            });

            gsap.to(containerRef.current, {
                y: 0,
                opacity: 1,
                duration: 0.4,
                ease: "back.out(1.2)",
            });
        }
    }, [isLoading, shareData, error]);

    return (
        <PageTransition>
            <div className="flex flex-col min-h-screen max-h-screen bg-neutral-800 overflow-hidden">
                <div className="bg-gradient-to-tr from-indigo-900 from-25% to-sky-800 relative overflow-hidden flex flex-1 flex-col items-center justify-center bg-cover bg-center bg-no-repeat border-t-0 rounded-b-5xl w-full shadow-2xl border-b-2 border-b-gray-500 tracking-wider">
                    {isLoading && (
                        <div
                            ref={containerRef}
                            className="flex flex-col items-center justify-center relative border-4 border-white/20 w-[90%] sm:w-2/3 lg:w-1/3 xl:w-1/4 min-h-28 rounded-xl px-8 py-6 bg-white/5 backdrop-blur-xl shadow-2xl font-medium tracking-wide"
                        >
                            <Spinner
                                size="lg"
                                color="default"
                                label="載入分享資訊中"
                                classNames={{
                                    label: "text-white font-bold text-xl",
                                }}
                            />
                        </div>
                    )}

                    {!isLoading && error && !shareData && (
                        <div
                            ref={containerRef}
                            className="flex flex-col items-center justify-center relative border-4 border-white/20 w-[90%] sm:w-2/3 lg:w-1/3 xl:w-1/4 min-h-28 rounded-xl px-8 py-6 bg-white/5 backdrop-blur-xl shadow-2xl font-medium tracking-wide gap-4"
                        >
                            <CircleX size={64} className="text-red-500" />
                            <div className="text-2xl font-bold text-white">
                                無法載入分享
                            </div>
                            <div className="text-gray-300 text-base text-center">
                                {error}
                            </div>
                            <Link
                                href="/dashboard"
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
                                    返回儀表板
                                </CustomButton>
                            </Link>
                        </div>
                    )}

                    {!isLoading && shareData && fileData && (
                        <div
                            ref={containerRef}
                            className="flex flex-col items-center justify-center relative border-4 border-white/20 w-[90%] sm:w-2/3 lg:w-1/2 xl:w-2/5 2xl:w-1/3 min-h-28 rounded-xl px-8 py-6 bg-white/5 backdrop-blur-xl shadow-2xl font-medium tracking-wide"
                        >
                            <div className="flex items-center justify-center w-full text-3xl font-bold text-white pb-4">
                                <FileText className="mr-3" size={32} />
                                {verified ? "檔案下載" : "檔案分享"}
                            </div>

                            {error && (
                                <div
                                    ref={errorBoxRef}
                                    className="w-full max-w-md p-2 border-2 rounded-full text-sm text-center flex items-center justify-center gap-2 bg-red-500/20 border-red-500/50 text-red-200 mb-3"
                                >
                                    <CircleX size={16} />
                                    <span className="leading-relaxed break-words">
                                        {error}
                                    </span>
                                </div>
                            )}

                            {downloadSuccess && (
                                <div className="w-full max-w-md p-2 border-2 rounded-full text-sm text-center flex items-center justify-center gap-2 bg-green-500/20 border-green-500/50 text-green-200 mb-3">
                                    <Download size={16} />
                                    <span className="leading-relaxed break-words">
                                        下載已開始！剩餘次數：{fileData.remainingDownloads}
                                    </span>
                                </div>
                            )}

                            <div className="w-full max-w-2xl flex flex-col items-center transition-all duration-300 ease-out space-y-4">
                                <div className="w-full p-4 bg-white/10 rounded-xl border border-white/20">
                                    <div className="text-gray-300 text-sm mb-1">
                                        檔案名稱
                                    </div>
                                    <div className="text-white font-semibold text-lg break-all">
                                        {fileData.displayName}
                                    </div>
                                </div>

                                {verified && (
                                    <div className="w-full flex gap-3">
                                        <div className="flex-1 p-4 bg-white/10 rounded-xl border border-white/20">
                                            <div className="text-gray-300 text-sm mb-1">
                                                檔案大小
                                            </div>
                                            <div className="text-white font-semibold">
                                                {formatBytes(fileData.size)}
                                            </div>
                                        </div>
                                        <div className="flex-1 p-4 bg-white/10 rounded-xl border border-white/20">
                                            <div className="text-gray-300 text-sm mb-1">
                                                檔案類型
                                            </div>
                                            <div className="text-white font-semibold text-sm break-all">
                                                {fileData.contentType || "未知"}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="w-full flex gap-3">
                                    <div className="flex-1 p-4 bg-white/10 rounded-xl border border-white/20">
                                        <div className="text-gray-300 text-sm mb-1">
                                            剩餘下載次數
                                        </div>
                                        <div className="text-white font-bold text-xl">
                                            {!fileData.maxDownloads || fileData.maxDownloads === 0
                                                ? "無限制"
                                                : fileData.remainingDownloads}
                                        </div>
                                    </div>
                                    <div className="flex-1 p-4 bg-white/10 rounded-xl border border-white/20">
                                        <div className="text-gray-300 text-sm mb-1">
                                            到期日
                                        </div>
                                        <div className="text-white font-semibold">
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

                                <div className="w-full flex gap-2 items-center justify-center">
                                    <Chip
                                        color={
                                            fileData.shareMode === "public"
                                                ? "default"
                                                : "primary"
                                        }
                                        variant="flat"
                                        size="md"
                                        classNames={{
                                            base: "border-white/30",
                                        }}
                                    >
                                        {fileData.shareMode === "public" && "未鎖定"}
                                        {fileData.shareMode === "pin" && "密碼鎖定"}
                                        {fileData.shareMode === "device" && "裝置綁定"}
                                        {fileData.shareMode === "account" && "帳號綁定"}
                                    </Chip>
                                </div>

                                {needsAuth && (
                                    <div className="w-full p-4 bg-yellow-500/20 border-2 border-yellow-500/50 rounded-xl text-yellow-200 text-sm text-center">
                                        此檔案需要登入才能存取，請先
                                        <Link
                                            href="/login"
                                            className="underline ml-1 font-semibold hover:text-yellow-100"
                                            prefetch={false}
                                        >
                                            登入
                                        </Link>
                                    </div>
                                )}

                                {!verified && fileData.shareMode === "pin" && !needsAuth && (
                                    <div className="w-full flex flex-col gap-3">
                                        <label className="text-gray-200 text-sm font-medium text-center">
                                            請輸入 6 位數 PIN 碼：
                                        </label>
                                        <div className="flex justify-center">
                                            <InputOtp
                                                length={6}
                                                value={pinInput}
                                                onValueChange={setPinInput}
                                            />
                                        </div>
                                    </div>
                                )}

                                {!verified && fileData.shareMode === "device" && !needsAuth && (
                                    <div className="w-full flex flex-col gap-3">
                                        {fileData.allowedDevices.length === 0 ? (
                                            <>
                                                {!user ? (
                                                    <div className="p-4 bg-yellow-500/20 border-2 border-yellow-500/50 rounded-xl text-yellow-200 text-sm text-center">
                                                        裝置綁定需要先登入帳號，請先
                                                        <Link
                                                            href="/login"
                                                            className="underline ml-1 font-semibold hover:text-yellow-100"
                                                            prefetch={false}
                                                        >
                                                            登入
                                                        </Link>
                                                        後再進行綁定
                                                    </div>
                                                ) : (
                                                    <>
                                                        <label className="text-gray-200 text-sm font-medium text-center">
                                                            首次綁定裝置，請為此裝置命名：
                                                        </label>
                                                        <CustomInput
                                                            placeholder="例如：我的 MacBook Pro"
                                                            value={deviceLabel}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeviceLabel(e.target.value)}
                                                            className="w-full"
                                                        />
                                                        <div className="text-gray-300 text-xs text-center">
                                                            將使用 {webAuthnSupported ? "Touch ID / Face ID / Windows Hello" : "瀏覽器驗證"} 進行裝置綁定
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <div className="p-4 bg-blue-500/20 border-2 border-blue-500/50 rounded-xl text-blue-200 text-sm text-center">
                                                此檔案已綁定裝置，請使用 Touch ID / Face ID / Windows Hello 驗證
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!verified && !needsAuth && !(fileData.shareMode === "device" && fileData.allowedDevices.length === 0 && !user) && (
                                    <div className="flex w-full justify-center mt-2">
                                        <CustomButton
                                            variant="blur"
                                            size="lg"
                                            radius="full"
                                            onClick={handleVerification}
                                            isDisabled={isVerifying}
                                            isLoading={isVerifying}
                                            className="w-[200px] text-white bg-blue-500 border-0 text-lg"
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
                                )}

                                {verified && (
                                    <div className="flex w-full justify-center mt-2">
                                        <CustomButton
                                            variant="blur"
                                            size="lg"
                                            radius="full"
                                            onClick={handleDownload}
                                            isDisabled={
                                                isDownloading || fileData.remainingDownloads <= 0
                                            }
                                            isLoading={isDownloading}
                                            className="w-[200px] text-white bg-green-500 border-0 text-lg"
                                            startContent={
                                                !isDownloading ? (
                                                    <Download size={20} />
                                                ) : undefined
                                            }
                                            spinner={
                                                <Spinner
                                                    size="sm"
                                                    color="default"
                                                />
                                            }
                                        >
                                            {fileData.remainingDownloads > 0
                                                ? "下載檔案"
                                                : "下載次數已用盡"}
                                        </CustomButton>
                                    </div>
                                )}

                                <div className="flex w-full justify-center items-center">
                                    <Link href="/dashboard" className="w-[200px]" prefetch={false}>
                                        <CustomButton
                                            variant="blur"
                                            size="lg"
                                            radius="full"
                                            className="w-full hover:bg-white/20 text-gray-200 text-lg"
                                            startContent={<ArrowLeft size={20} />}
                                        >
                                            返回儀表板
                                        </CustomButton>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
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
