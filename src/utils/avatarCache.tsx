"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User } from "firebase/auth";
import CryptoJS from "crypto-js";

interface AvatarCache {
    [userId_source: string]: {
        base64: string;
        timestamp: number;
        source: string; // 'default' | 'gravatar' | 'google' | 'github'
        originUrl: string;
    };
}

interface AvatarCacheContextType {
    getAvatarUrl: (user: User, source: string) => string | null;
    setAvatarUrl: (userId: string, url: string, source: string) => Promise<void>;
    clearCache: (userId?: string) => void;
}

const AvatarCacheContext = createContext<AvatarCacheContextType | undefined>(undefined);

const CACHE_KEY = "sharelock_avatar_cache";
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export function AvatarCacheProvider({ children }: { children: React.ReactNode }) {
    const [cache, setCache] = useState<AvatarCache>({});

    // from localStorage load cache
    useEffect(() => {
        try {
            const stored = localStorage.getItem(CACHE_KEY);
            if (stored) {
                const parsed: AvatarCache = JSON.parse(stored);
                // filter expired entries
                const now = Date.now();
                const filtered = Object.entries(parsed).reduce((acc, [key, value]) => {
                    if (now - value.timestamp < CACHE_EXPIRY) {
                        acc[key] = value;
                    }
                    return acc;
                }, {} as AvatarCache);
                setCache(filtered);
            }
        } catch (error) {
            console.error("Failed to load avatar cache, check your internet or browser environment first.", error);
        }
    }, []);

    // save to localStorage
    const saveCache = useCallback((newCache: AvatarCache) => {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
        } catch (error) {
            console.error("Failed to save avatar cache, check your internet or browser environment first.", error);
        }
    }, []);

    // generate cache key
    const getCacheKey = (userId: string, source: string) => {
        return `${userId}_${source}`;
    };

    // generate cache url
    const generateAvatarUrl = useCallback((user: User, source: string): string => {
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
    }, []);

    // download avatar and convert base64
    const fetchAvatarBase64 = useCallback(async (url: string): Promise<string> => {
        if (!url || url === "/undefined.png") return "";
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve(reader.result as string);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.warn("Failed to fetch avatar base64:", e);
            return "";
        }
    }, []);

    // get avatar base64 (with cache)
    const getAvatarUrl = useCallback((user: User, source: string): string | null => {
        const cacheKey = getCacheKey(user.uid, source);
        const cached = cache[cacheKey];

        if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY && cached.base64) {
            return cached.base64;
        }

        // cache miss, return default image and fetch asynchronously
        const url = generateAvatarUrl(user, source);

        fetchAvatarBase64(url).then(base64 => {
            if (base64) {
                const newCache = {
                    ...cache,
                    [cacheKey]: {
                        base64,
                        timestamp: Date.now(),
                        source,
                        originUrl: url,
                    },
                };
                setCache(newCache);
                saveCache(newCache);
            }
        });

        return "/undefined.png";
    }, [cache, generateAvatarUrl, fetchAvatarBase64, saveCache]);

    // manually set avatar url (for settings pages update)
    const setAvatarUrl = useCallback(async (userId: string, url: string, source: string) => {
        const cacheKey = getCacheKey(userId, source);

        const base64 = await fetchAvatarBase64(url);
        const newCache = {
            ...cache,
            [cacheKey]: {
                base64,
                timestamp: Date.now(),
                source,
                originUrl: url,
            },
        };
        setCache(newCache);
        saveCache(newCache);
    }, [cache, fetchAvatarBase64, saveCache]);

    // clear cache
    const clearCache = useCallback((userId?: string) => {
        if (userId) {
            const newCache = Object.entries(cache).reduce((acc, [key, value]) => {
                if (!key.startsWith(userId)) {
                    acc[key] = value;
                }
                return acc;
            }, {} as AvatarCache);
            setCache(newCache);
            saveCache(newCache);
        } else {
            // clear all cache
            setCache({});
            localStorage.removeItem(CACHE_KEY);
        }
    }, [cache, saveCache]);

    return (
        <AvatarCacheContext.Provider
            value={{
                getAvatarUrl,
                setAvatarUrl,
                clearCache,
            }}
        >
            {children}
        </AvatarCacheContext.Provider>
    );
}

export function useAvatarCache() {
    const context = useContext(AvatarCacheContext);
    if (!context) {
        throw new Error("useAvatarCache must be used within AvatarCacheProvider");
    }
    return context;
}
