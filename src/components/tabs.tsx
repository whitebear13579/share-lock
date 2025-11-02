"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";

interface Tab {
    key: string;
    label: string;
    icon?: React.ReactNode;
}

interface TabsProps {
    tabs: Tab[];
    defaultTab?: string;
    onTabChange?: (key: string) => void;
    className?: string;
}

export default function CustomTabs({
    tabs,
    defaultTab,
    onTabChange,
    className = "",
}: TabsProps) {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.key);

    const handleTabClick = (key: string) => {
        setActiveTab(key);
        onTabChange?.(key);
    };

    return (
        <div
            className={`rounded-full border border-white/30 bg-white/10 shadow-2xl flex items-center justify-center px-3 sm:px-6 py-2.5 gap-2 sm:gap-10 h-12 relative overflow-visible ${className}`}
        >
            {tabs.map((tab) => (
                <div
                    key={tab.key}
                    onClick={() => handleTabClick(tab.key)}
                    className="text-gray-200 flex items-center gap-1.5 sm:gap-2 cursor-pointer hover:text-white transition-colors relative z-10 sm:text-base whitespace-nowrap flex-1 sm:flex-initial justify-center px-2 sm:px-0"
                >
                    <span className="flex-shrink-0">{tab.icon}</span>
                    <span>{tab.label}</span>
                    {activeTab === tab.key && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute -inset-3 lg:-inset-x-6 -inset-y-2.5 bg-neutral-950/60 rounded-full -z-10"
                            transition={{
                                type: "spring",
                                stiffness: 380,
                                damping: 30,
                            }}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
