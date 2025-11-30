"use client";
import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/utils/firebase";
import { useRouter } from "next/navigation";
import { recordLogin } from "@/utils/loginHistory";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
    recordUserLogin: (success: boolean, provider?: string, errorMessage?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => { },
    recordUserLogin: async () => { },
});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const isLoggingOut = useRef(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            const currentPath = window.location.pathname;
            const publicPaths = ['/login', '/signup', '/reset-password', '/privacy-policy', '/terms-of-service', '/share', '/auth-action'];
            const isPublicPath = currentPath === '/' || publicPaths.some(path => currentPath.startsWith(path));

            if (!currentUser && !isPublicPath && !isLoggingOut.current) {
                window.location.href = '/login';
                return;
            }

            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const logout = async () => {
        isLoggingOut.current = true;
        try {
            await signOut(auth);
        } finally {
            setTimeout(() => {
                isLoggingOut.current = false;
            }, 1000);
        }
    };

    const recordUserLogin = async (
        success: boolean,
        provider?: string,
        errorMessage?: string
    ) => {
        if (user) {
            await recordLogin(user, success, provider, errorMessage);
        }
    };

    const value = {
        user,
        loading,
        logout,
        recordUserLogin,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
