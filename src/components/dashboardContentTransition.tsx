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

            // If not first visit to any page, perform animation
            if (globalPrevPathname && globalPrevPathname !== pathname) {
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
                // first load
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
