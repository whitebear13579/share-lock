"use client";
import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/utils/firebase";
import { useRouter } from "next/navigation";
import { recordLogin } from "@/utils/loginHistory";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isLoggingOut: boolean;
    logout: () => Promise<void>;
    setLoggingOutState: (state: boolean) => void;
    recordUserLogin: (success: boolean, provider?: string, errorMessage?: string) => Promise<void>;
    syncSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isLoggingOut: false,
    logout: async () => { },
    setLoggingOutState: () => { },
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
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const router = useRouter();
    const isLoggingOutRef = useRef(false);
    const sessionSynced = useRef(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (isLoggingOutRef.current) {
                setUser(currentUser);
                setLoading(false);
                return;
            }

            const currentPath = window.location.pathname;
            const publicPaths = ['/login', '/signup', '/reset-password', '/privacy-policy', '/terms-of-service', '/share', '/auth-action'];
            const isPublicPath = currentPath === '/' || publicPaths.some(path => currentPath.startsWith(path));

            if (currentUser && !sessionSynced.current) {
                await createServerSession(currentUser);
                sessionSynced.current = true;
            }

            if (!currentUser && !isPublicPath) {
                await deleteServerSession();
                sessionSynced.current = false;
                router.replace('/login');
                setUser(null);
                setLoading(false);
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
        isLoggingOutRef.current = true;
        setIsLoggingOut(true);
        try {
            await deleteServerSession();
            sessionSynced.current = false;
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const syncSession = async () => {
        if (user && !sessionSynced.current) {
            await createServerSession(user);
            sessionSynced.current = true;
        }
    };

    const setLoggingOutState = (state: boolean) => {
        isLoggingOutRef.current = state;
        setIsLoggingOut(state);
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
        isLoggingOut,
        logout,
        setLoggingOutState,
        recordUserLogin,
        syncSession,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
