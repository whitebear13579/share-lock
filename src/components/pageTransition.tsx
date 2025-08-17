"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";

interface pageTransitionProps {
    children: React.ReactNode;
}

export default function pageTransition({ children }: pageTransitionProps) {
    const pathname = usePathname();
    const containerRef = useRef<HTMLDivElement>(null);
    const prevPathnameRef = useRef<string>("");

    useEffect(() => {
        if (!containerRef.current) return;

        // if first load
        if (!prevPathnameRef.current) {
            gsap.set(containerRef.current, { opacity: 1 });
            prevPathnameRef.current = pathname;
            return;
        }

        if (prevPathnameRef.current !== pathname) {
            gsap.set(containerRef.current, {
                opacity: 0,
            });

            gsap.to(containerRef.current, {
                opacity: 1,
                duration: 0.2,
                ease: "power2.out",
            });

            prevPathnameRef.current = pathname;
        }
    }, [pathname]);

    return (
        <div ref={containerRef} style={{ opacity: 0 }} className="min-h-screen">
            {children}
        </div>
    );
}
