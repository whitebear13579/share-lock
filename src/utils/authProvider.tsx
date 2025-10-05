"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        try {
            await signOut(auth);
            router.push("/login");
        } catch (error) {
            console.error("Logout Error! This is an internal error!", error);
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
