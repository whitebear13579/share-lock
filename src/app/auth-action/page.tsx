"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@heroui/react";
import PageTransition from "@/components/pageTransition";

export default function AuthAction() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");

    useEffect(() => {
        const handleAuthAction = async () => {
            if (!mode || !oobCode) {
                setError("無效的連結");
                setLoading(false);
                return;
            }

            if (mode === "resetPassword") {
                router.replace(
                    `/reset-password?mode=${mode}&oobCode=${oobCode}`
                );
                return;
            }

            const firebaseActionUrl = `https://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'sharelock-bbf0f.firebaseapp.com'}/__/auth/action?mode=${mode}&oobCode=${oobCode}`;
            window.location.href = firebaseActionUrl;
        };

        handleAuthAction();
    }, [mode, oobCode, router]);

    if (loading) {
        return (
            <PageTransition>
                <div className="flex flex-col min-h-screen g-linear-205 from-slate-700 to-neutral-800 to-55% items-center justify-center">
                    <div className="flex flex-col items-center gap-4 text-white">
                        <Spinner size="lg" color="primary" />
                        <p>正在處理您的請求...</p>
                    </div>
                </div>
            </PageTransition>
        );
    }

    if (!error) {
        return null;
    }

    return (
        <PageTransition>
            <div className="flex flex-col min-h-screen bg-linear-205 from-slate-700 to-neutral-800 to-55% items-center justify-center">
                <div className="flex flex-col items-center gap-6 text-white text-center max-w-md p-8">
                    <p className="text-2xl font-bold text-red-400">
                        {error}
                    </p>
                    <p className="text-gray-300 text-sm">
                        請返回應用程式重試，或聯繫客服尋求協助。
                    </p>
                </div>
            </div>
        </PageTransition>
    );
}
