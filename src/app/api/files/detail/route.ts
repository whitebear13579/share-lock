import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/utils/firebase-admin";
import { auth } from "firebase-admin";

/*

    method: GET /api/files/detail?fileId=xxx
    Get detailed information about a specific file
    Query: fileId - the file ID to get details for

*/

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Unauthorized - No token provided" },
                { status: 401 }
            );
        }

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
        const { searchParams } = new URL(request.url);
        const fileId = searchParams.get("fileId");

        if (!fileId) {
            return NextResponse.json(
                { error: "fileId is required" },
                { status: 400 }
            );
        }

        // Get the file document
        const fileDoc = await adminDb.collection("files").doc(fileId).get();

        if (!fileDoc.exists) {
            return NextResponse.json(
                { error: "File not found" },
                { status: 404 }
            );
        }

        const fileData = fileDoc.data();

        // Check if user is owner or has access
        const isOwner = fileData?.ownerUid === uid;

        if (!isOwner) {
            // Check if user has shared access
            const sharedWithMeSnapshot = await adminDb
                .collection("sharedWithMe")
                .where("fileId", "==", fileId)
                .where("ownerUid", "==", uid)
                .limit(1)
                .get();

            if (sharedWithMeSnapshot.empty) {
                return NextResponse.json(
                    { error: "Permission denied - You do not have access to this file" },
                    { status: 403 }
                );
            }
        }

        const accessLogsSnapshot = await adminDb
            .collection("accessLogs")
            .where("fileId", "==", fileId)
            .get();

        let viewCount = 0;
        let downloadCount = 0;

        accessLogsSnapshot.forEach((log) => {
            const logData = log.data();
            if (logData.type === "access") viewCount++;
            if (logData.type === "download") downloadCount++;
        });

        let shareInfo = null;
        if (isOwner) {
            const shareSnapshot = await adminDb
                .collection("shares")
                .where("fileId", "==", fileId)
                .limit(1)
                .get();

            if (!shareSnapshot.empty) {
                const shareDoc = shareSnapshot.docs[0];
                shareInfo = {
                    shareId: shareDoc.id,
                    shareUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/share/${shareDoc.id}`,
                    valid: shareDoc.data().valid,
                    createdAt: shareDoc.data().createdAt?.toDate?.()?.toISOString() || null,
                };
            }
        }

        const sharedWithMeSnapshot = await adminDb
            .collection("sharedWithMe")
            .where("fileId", "==", fileId)
            .get();

        const recipients: Array<{ email: string; photoURL?: string; displayName?: string }> = [];
        for (const doc of sharedWithMeSnapshot.docs) {
            const data = doc.data();
            // ownerUid in sharedWithMe is the recipient (the person who accepted the share)
            if (data.ownerUid) {
                try {
                    const userRecord = await auth().getUser(data.ownerUid);
                    recipients.push({
                        email: userRecord.email || "未知",
                        photoURL: userRecord.photoURL || undefined,
                        displayName: userRecord.displayName || undefined,
                    });
                } catch (error) {
                    // User not found or error fetching user
                    console.error("Error fetching recipient user:", error);
                }
            }
        }

        let ownerEmail = null;
        if (!isOwner && fileData?.ownerUid) {
            try {
                const ownerUser = await auth().getUser(fileData.ownerUid);
                ownerEmail = ownerUser.email;
            } catch (error) {
                console.error("Error fetching owner email:", error);
            }
        }

        // Record access log for recent files tracking
        try {
            await adminDb.collection("accessLogs").add({
                fileId: fileId,
                uid: uid,
                type: "view",
                at: new Date(),
                ip: request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown',
                userAgent: request.headers.get('user-agent') || 'unknown',
            });
        } catch (logError) {
            console.error("Failed to record access log:", logError);
        }

        return NextResponse.json({
            success: true,
            file: {
                id: fileDoc.id,
                name: fileData?.displayName || fileData?.originalName,
                originalName: fileData?.originalName,
                size: fileData?.size,
                contentType: fileData?.contentType,
                shareMode: fileData?.shareMode,
                maxDownloads: fileData?.maxDownloads,
                remainingDownloads: fileData?.remainingDownloads,
                createdAt: fileData?.createdAt?.toDate?.()?.toISOString() || null,
                expiresAt: fileData?.expiresAt?.toDate?.()?.toISOString() || null,
                revoked: fileData?.revoked,
                views: viewCount,
                downloads: downloadCount,
                isOwner,
                ownerEmail,
                shareInfo,
                recipients,
                storagePath: isOwner ? fileData?.storagePath : undefined,
            },
        });

    } catch (error) {
        console.error("Error getting file details:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
