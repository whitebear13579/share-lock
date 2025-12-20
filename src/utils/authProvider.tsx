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
    syncSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => { },
    recordUserLogin: async () => { },
    syncSession: async () => { },
});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

const createServerSession = async (user: User): Promise<boolean> => {
    try {
        const idToken = await user.getIdToken();
        const response = await fetch("/api/auth/session", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ idToken }),
        });
        return response.ok;
    } catch (error) {
        console.error("Failed to create server session:", error);
        return false;
    }
};

const deleteServerSession = async (): Promise<boolean> => {
    try {
        const response = await fetch("/api/auth/session", {
            method: "DELETE",
        });
        return response.ok;
    } catch (error) {
        console.error("Failed to delete server session:", error);
        return false;
    }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const isLoggingOut = useRef(false);
    const sessionSynced = useRef(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            const currentPath = window.location.pathname;
            const publicPaths = ['/login', '/signup', '/reset-password', '/privacy-policy', '/terms-of-service', '/share', '/auth-action'];
            const isPublicPath = currentPath === '/' || publicPaths.some(path => currentPath.startsWith(path));

            if (currentUser && !sessionSynced.current) {
                await createServerSession(currentUser);
                sessionSynced.current = true;
            }

            if (!currentUser && !isPublicPath && !isLoggingOut.current) {
                await deleteServerSession();
                sessionSynced.current = false;
                window.location.href = '/login';
                return;
            }

            if (!currentUser) {
                sessionSynced.current = false;
            }

            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const logout = async () => {
        isLoggingOut.current = true;
        try {
            await deleteServerSession();
            sessionSynced.current = false;
            router.push("/login");
            await signOut(auth);
        } finally {
            setTimeout(() => {
                isLoggingOut.current = false;
            }, 1000);
        }
    };

    const syncSession = async () => {
        if (user && !sessionSynced.current) {
            await createServerSession(user);
            sessionSynced.current = true;
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
        syncSession,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
