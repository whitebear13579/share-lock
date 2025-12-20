"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/utils/authProvider";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAuth?: boolean;
    redirectTo?: string;
}

export default function ProtectedRoute({
    children,
    requireAuth = true,
    redirectTo = "/login",
}: ProtectedRouteProps) {
    const { user, loading, syncSession } = useAuth();
    const router = useRouter();
    const [isVerifying, setIsVerifying] = useState(true);

    useEffect(() => {
        const verifyAuth = async () => {
            if (!loading) {
                if (requireAuth && !user) {
                    router.push(redirectTo);
                } else if (!requireAuth && user) {
                    await syncSession();
                    router.push("/dashboard");
                } else if (user) {
                    await syncSession();
                }
                setIsVerifying(false);
            }
        };

        verifyAuth();
    }, [user, loading, requireAuth, redirectTo, router, syncSession]);

    if (loading || isVerifying) {
        if (requireAuth) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <Spinner size="lg" color="primary" />
                </div>
            );
        }
        return null;
    }

    if (requireAuth && !user) {
        return null;
    }

    if (!requireAuth && user) {
        return null;
    }

    return <>{children}</>;
}
