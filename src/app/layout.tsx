import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { AuthProvider } from "@/utils/authProvider";
import { AvatarCacheProvider } from "@/utils/avatarCache";

export const metadata: Metadata = {
    title: "Share Lock",
    description: "一個安全、高效的檔案分享軟體。",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="zh-Hant">
            <head>
                <Script
                    src="https://font.emtech.cc/emfont.js"
                    strategy="beforeInteractive"
                />
                <Script id="emfont-init" strategy="afterInteractive">
                    {`emfont.init();`}
                </Script>
            </head>
            <body className="emfont-NotoSansTC">
                <HeroUIProvider>
                    <ToastProvider
                        placement="bottom-right"
                        toastProps={{
                            radius: "lg",
                            variant: "flat",
                            timeout: 4000,
                            classNames: {
                                base: "bg-neutral-800/95 backdrop-blur-md border border-white/10 shadow-xl",
                                title: "text-white font-semibold text-base",
                                description: "text-gray-300 text-sm max-w-[250px] truncate block",
                                icon: "[&>svg]:w-5 [&>svg]:h-5",
                                closeButton: "text-gray-400 hover:text-white hover:bg-white/10 transition-colors",
                                progressTrack: "bg-white/10",
                                progressIndicator: "bg-gradient-to-r from-indigo-500 to-sky-500",
                            },
                        }}
                    />
                    <AuthProvider>
                        <AvatarCacheProvider>
                            {children}
                        </AvatarCacheProvider>
                    </AuthProvider>
                </HeroUIProvider>
            </body>
        </html>
    );
}
