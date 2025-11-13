"use client";
import React, { useMemo } from "react";
import { Avatar as HeroUIAvatar, AvatarProps } from "@heroui/react";
import { useAuth } from "@/utils/authProvider";
import { useAvatarCache } from "@/utils/avatarCache";

interface CachedAvatarProps extends Omit<AvatarProps, "src"> {
    source?: "default" | "gravatar" | "google" | "github";
    fallbackSrc?: string;
}

export default function CachedAvatar({
    source = "default",
    fallbackSrc = "/undefined.png",
    name,
    ...props
}: CachedAvatarProps) {
    const { user } = useAuth();
    const { getAvatarUrl } = useAvatarCache();

    const avatarUrl = useMemo(() => {
        if (!user) return fallbackSrc;

        const cachedUrl = getAvatarUrl(user, source);
        return cachedUrl || fallbackSrc;
    }, [user, source, fallbackSrc, getAvatarUrl]);

    return (
        <HeroUIAvatar
            src={avatarUrl}
            name={name || user?.displayName || "User"}
            {...props}
        />
    );
}
