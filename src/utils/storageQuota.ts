import { auth } from "./firebase";

/*

    Calculate total storage usage for a user via API
    @returns Object containing used bytes, quota, and percentage

*/

export async function getUserStorageUsage(): Promise<{
    usedBytes: number;
    quotaBytes: number;
    usedMB: number;
    quotaMB: number;
    usedGB: number;
    quotaGB: number;
    percentage: number;
    formattedUsed: string;
    formattedQuota: string;
    fileCount?: number;
}> {
    try {
        // get the current user's ID token
        const user = auth.currentUser;
        if (!user) {
            throw new Error("No authenticated user");
        }

        const idToken = await user.getIdToken();

        // call the API endpoint
        const response = await fetch("/api/storage/usage", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${idToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching storage usage:", error);
        // return default values on error
        return {
            usedBytes: 0,
            quotaBytes: 1024 * 1024 * 1024,
            usedMB: 0,
            quotaMB: 1024,
            usedGB: 0,
            quotaGB: 1,
            percentage: 0,
            formattedUsed: "0 B",
            formattedQuota: "1 GB",
            fileCount: 0,
        };
    }
}

/*

    Format bytes to human-readable format
    @param bytes - Number of bytes
    @returns Formatted string (e.g., "1.5 MB", "2.3 GB")

*/
export function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

/*

    get storage status color based on usage percentage
    @param percentage - Usage percentage
    @returns Color class for UI

*/
export function getStorageStatusColor(percentage: number): {
    indicator: string;
    text: string;
    icon: string;
} {
    if (percentage >= 90) {
        return {
            indicator: "bg-linear-245 from-red-500 to-rose-700",
            text: "text-red-400",
            icon: "text-red-400",
        };
    } else if (percentage >= 75) {
        return {
            indicator: "bg-linear-245 from-amber-500 to-rose-700",
            text: "text-amber-400",
            icon: "text-amber-400",
        };
    } else {
        return {
            indicator: "bg-linear-245 from-cyan-500 to-sky-600",
            text: "text-cyan-400",
            icon: "text-cyan-400",
        };
    }
}
