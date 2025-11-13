"use client";
import { useState, useCallback } from "react";
import { useAuth } from "@/utils/authProvider";
import { useAvatarCache } from "@/utils/avatarCache";
import { updateProfile } from "firebase/auth";
import CryptoJS from "crypto-js";

export function useAvatarManager() {
    const { user } = useAuth();
    const { setAvatarUrl, clearCache } = useAvatarCache();
    const [avatarSource, setAvatarSourceState] = useState("default");

    // get the user's avatar URL based on source
    const getAvatarUrlBySource = useCallback((source: string) => {
        if (!user) return "/undefined.png";

        switch (source) {
            case "gravatar":
                if (!user.email) return "/undefined.png";
                const hash = CryptoJS.MD5(user.email.toLowerCase().trim()).toString();
                return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`;

            case "google": {
                const googleProvider = user.providerData.find(p => p.providerId === "google.com");
                return googleProvider?.photoURL || "/undefined.png";
            }

            case "github": {
                const githubProvider = user.providerData.find(p => p.providerId === "github.com");
                return githubProvider?.photoURL || "/undefined.png";
            }

            case "default":
            default:
                return user.photoURL || "/undefined.png";
        }
    }, [user]);

    // change avatar source and update Firebase
    const changeAvatarSource = useCallback(async (newSource: string) => {
        if (!user) throw new Error("No user logged in");

        const newUrl = getAvatarUrlBySource(newSource);

        // update user Firebase profile
        await updateProfile(user, {
            photoURL: newUrl,
        });

        // update client cache
        setAvatarUrl(user.uid, newUrl, newSource);
        setAvatarSourceState(newSource);

    }, [user, getAvatarUrlBySource, setAvatarUrl]);

    // clear current user's avatar cache
    const clearUserCache = useCallback(() => {
        if (user) {
            clearCache(user.uid);
        }
    }, [user, clearCache]);

    return {
        avatarSource,
        setAvatarSource: setAvatarSourceState,
        changeAvatarSource,
        getAvatarUrlBySource,
        clearUserCache,
    };
}
