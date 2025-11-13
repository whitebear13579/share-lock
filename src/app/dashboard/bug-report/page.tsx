"use client";
import React from "react";
import { useAuth } from "@/utils/authProvider";
import { Spinner } from "@heroui/react";
import DashboardNavigation from "@/components/dashboardNavigation";
import DashboardContentTransition from "@/components/dashboardContentTransition";

export default function BugReport() {
    const { user, loading, logout } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-800 flex items-center justify-center">
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
            <DashboardNavigation loading={loading} onLogout={logout} />
            <DashboardContentTransition>
                <div className="pt-36 px-12">
                    <h1 className="font-bold text-white mb-2 text-4xl">
                        🐛 漏洞有賞計畫
                    </h1>
                    <p className="text-gray-300 text-lg">
                        發現問題？回報給我們，一起讓 Share Lock 更安全！
                    </p>
                </div>
            </DashboardContentTransition>
        </div>
    );
}
