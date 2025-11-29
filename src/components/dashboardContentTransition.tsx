"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { getNavigationDirection } from "./dashboardNavigation";

interface DashboardContentTransitionProps {
    children: React.ReactNode;
}

let globalPrevPathname = "";

export default function DashboardContentTransition({ children }: DashboardContentTransitionProps) {
    const pathname = usePathname();
    const containerRef = useRef<HTMLDivElement>(null);
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (!containerRef.current) {
            console.log("❌ containerRef is null");
            return;
        }

        if (isInitialMount.current) {
            isInitialMount.current = false;

            const isFromHome = typeof window !== "undefined" &&
                sessionStorage.getItem("pageTransition") === "fromHome";

            if (isFromHome && typeof window !== "undefined") {
                sessionStorage.removeItem("pageTransition");
            }

            // If from login/signup page, always perform animation
            if (isFromHome) {
                gsap.set(containerRef.current, {
                    opacity: 0,
                    x: 100,
                });

                gsap.to(containerRef.current, {
                    opacity: 1,
                    x: 0,
                    duration: 0.5,
                    delay: 0.3,
                    ease: "power2.out",
                });
            } else if (globalPrevPathname && globalPrevPathname !== pathname) {
                // If not first visit to any page, perform animation
                const direction = getNavigationDirection(globalPrevPathname, pathname);
                const startX = direction === "left" ? 100 : -100;

                gsap.set(containerRef.current, {
                    opacity: 0,
                    x: startX,
                });

                gsap.to(containerRef.current, {
                    opacity: 1,
                    x: 0,
                    duration: 0.4,
                    ease: "power2.out",
                });
            } else {
                // first load (direct access to dashboard)
                gsap.set(containerRef.current, { opacity: 1, x: 0 });
            }

            globalPrevPathname = pathname;
            return;
        }

        // Path changed
        if (globalPrevPathname !== pathname) {
            const direction = getNavigationDirection(globalPrevPathname, pathname);

            const startX = direction === "left" ? 100 : -100;

            gsap.set(containerRef.current, {
                opacity: 0,
                x: startX,
            });

            gsap.to(containerRef.current, {
                opacity: 1,
                x: 0,
                duration: 0.4,
                ease: "power2.out",
            });

            globalPrevPathname = pathname;
        }
    }, [pathname]);

    return (
        <div ref={containerRef}>
            {children}
        </div>
    );
}
