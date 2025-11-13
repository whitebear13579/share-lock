import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/utils/firebase-admin";
import { auth } from "firebase-admin";

/*

    method: GET /api/storage/usage
    Get storage usage for the authenticated user

*/

export async function GET(request: NextRequest) {
    try {
        // get the authorization header
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Unauthorized - No token provided" },
                { status: 401 }
            );
        }

        // verify the Firebase ID token
        const idToken = authHeader.split("Bearer ")[1];
        let decodedToken;
        try {
            decodedToken = await auth().verifyIdToken(idToken);
        } catch (error) {
            console.error("Token verification error:", error);
            return NextResponse.json(
                { error: "Unauthorized - Invalid token" },
                { status: 401 }
            );
        }

        const uid = decodedToken.uid;

        // query all files owned by the user
        const filesSnapshot = await adminDb
            .collection("files")
            .where("ownerUid", "==", uid)
            .where("revoked", "==", false)
            .get();

        // Calculate total size
        let totalBytes = 0;
        filesSnapshot.forEach((doc) => {
            const fileData = doc.data();
            totalBytes += fileData.size || 0;
        });

        // 1 GB quota
        const quotaBytes = 1024 * 1024 * 1024;
        const percentage = Math.min((totalBytes / quotaBytes) * 100, 100);

        // Format bytes helper
        const formatBytes = (bytes: number): string => {
            if (bytes === 0) return "0 B";
            const k = 1024;
            const sizes = ["B", "KB", "MB", "GB", "TB"];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
        };

        return NextResponse.json({
            usedBytes: totalBytes,
            quotaBytes,
            usedMB: Math.round((totalBytes / (1024 * 1024)) * 100) / 100,
            quotaMB: Math.round((quotaBytes / (1024 * 1024)) * 100) / 100,
            usedGB: Math.round((totalBytes / (1024 * 1024 * 1024)) * 1000) / 1000,
            quotaGB: 1,
            percentage: Math.round(percentage * 10) / 10,
            formattedUsed: formatBytes(totalBytes),
            formattedQuota: formatBytes(quotaBytes),
            fileCount: filesSnapshot.size,
        });
    } catch (error) {
        console.error("Error fetching storage usage:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
