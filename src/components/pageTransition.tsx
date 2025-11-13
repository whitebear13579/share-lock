"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { getNavigationDirection } from "./dashboardNavigation";

interface PageTransitionProps {
    children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
    const pathname = usePathname();
    const containerRef = useRef<HTMLDivElement>(null);
    const prevPathnameRef = useRef<string>("");

    useEffect(() => {
        if (!containerRef.current) return;

        // if first load
        if (!prevPathnameRef.current) {
            gsap.set(containerRef.current, { opacity: 1, x: 0 });
            prevPathnameRef.current = pathname;
            return;
        }

        if (prevPathnameRef.current !== pathname) {
            const direction = getNavigationDirection(prevPathnameRef.current, pathname);

            // according user navigation direction
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

            prevPathnameRef.current = pathname;
        }
    }, [pathname]);

    return (
        <div ref={containerRef} className="min-h-screen opacity-0">
            {children}
        </div>
    );
}
