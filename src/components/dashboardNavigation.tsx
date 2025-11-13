"use client";
import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { House, Folder, Cog, Star, LogOut } from "lucide-react";
import CustomTabs from "./tabs";
import CustomButton from "./button";

interface DashboardNavigationProps {
    loading?: boolean;
    onLogout?: () => void;
    className?: string;
}

// navigation routes definition
export const NAVIGATION_ROUTES = [
    { key: "dashboard", path: "/dashboard", label: "資訊主頁", icon: <House size={18} /> },
    { key: "files", path: "/dashboard/files", label: "我的檔案", icon: <Folder size={18} /> },
    { key: "settings", path: "/dashboard/settings", label: "帳號設定", icon: <Cog size={18} /> },
    { key: "bug-report", path: "/dashboard/bug-report", label: "漏洞有賞計畫", icon: <Star size={18} /> },
];

export function getNavigationDirection(fromPath: string, toPath: string): "left" | "right" {
    const fromIndex = NAVIGATION_ROUTES.findIndex(route => route.path === fromPath);
    const toIndex = NAVIGATION_ROUTES.findIndex(route => route.path === toPath);

    console.log("🧭 Navigation direction calculation:", {
        fromPath,
        toPath,
        fromIndex,
        toIndex,
        result: toIndex > fromIndex ? "left" : "right"
    });

    return toIndex > fromIndex ? "left" : "right";
}

export default function DashboardNavigation({
    loading = false,
    onLogout,
    className = "",
}: DashboardNavigationProps) {
    const router = useRouter();
    const pathname = usePathname();

    const currentRoute = NAVIGATION_ROUTES.find(route => route.path === pathname);
    const activeTab = currentRoute?.key || "dashboard";

    const handleTabChange = (key: string) => {
        const route = NAVIGATION_ROUTES.find(r => r.key === key);
        if (route && route.path !== pathname) {
            router.push(route.path);
        }
    };

    return (
        <div className={`absolute top-6 right-6 flex space-x-3 z-50 ${className}`}>
            <CustomTabs
                tabs={NAVIGATION_ROUTES}
                defaultTab={activeTab}
                onTabChange={handleTabChange}
                layoutId="dashboardNavigation"
            />
            <CustomButton
                variant="blur"
                size="lg"
                radius="full"
                startContent={<LogOut size={18} className="text-gray-200" />}
                isDisabled={loading}
                onPress={onLogout}
                className="text-base hover:bg-white/20 text-gray-200"
            >
                登出
            </CustomButton>
        </div>
    );
}
