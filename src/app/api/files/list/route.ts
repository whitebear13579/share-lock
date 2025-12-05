import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/utils/firebase-admin";
import { auth } from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

/*

    method: GET /api/files/list?type=myFiles|sharedWithMe|expired
    Get files list for the authenticated user

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
        } catch {
            return NextResponse.json(
                { error: "Unauthorized - Invalid token" },
                { status: 401 }
            );
        }

        const uid = decodedToken.uid;
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "myFiles";

        const now = Timestamp.now();

        if (type === "myFiles") {
            // Get files owned by the user (active only)
            // Try a simpler query first to avoid index issues
            const filesSnapshot = await adminDb
                .collection("files")
                .where("ownerUid", "==", uid)
                .where("revoked", "==", false)
                .get();

            // Filter and sort in memory
            const allFiles = filesSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((fileData) => {
                    const expiresAt = (fileData as { expiresAt?: { toMillis(): number } }).expiresAt;
                    return expiresAt && expiresAt.toMillis() > now.toMillis();
                })
                .sort((a, b) => {
                    const aExpires = (a as { expiresAt?: { toMillis(): number } }).expiresAt?.toMillis() || 0;
                    const bExpires = (b as { expiresAt?: { toMillis(): number } }).expiresAt?.toMillis() || 0;
                    return bExpires - aExpires;
                });

            const files = await Promise.all(
                allFiles.map(async (docData) => {
                    const docId = docData.id;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const fileData = docData as Record<string, any>;

                    // Get access logs for views and downloads
                    const accessLogsSnapshot = await adminDb
                        .collection("accessLogs")
                        .where("fileId", "==", docId)
                        .get();

                    let viewCount = 0;
                    let downloadCount = 0;

                    accessLogsSnapshot.forEach((log) => {
                        const logData = log.data();
                        if (logData.type === "access") viewCount++;
                        if (logData.type === "download") downloadCount++;
                    });

                    // Get recipients for this file (from sharedWithMe collection)
                    const sharedWithMeSnapshot = await adminDb
                        .collection("sharedWithMe")
                        .where("fileId", "==", docId)
                        .get();

                    const sharedWith: string[] = [];
                    sharedWithMeSnapshot.forEach((sharedDoc) => {
                        const sharedData = sharedDoc.data();
                        if (sharedData.ownerEmail) {
                            sharedWith.push(sharedData.ownerEmail);
                        }
                    });

                    // Get shareId for this file (from shares collection)
                    const sharesSnapshot = await adminDb
                        .collection("shares")
                        .where("fileId", "==", docId)
                        .where("valid", "==", true)
                        .limit(1)
                        .get();

                    const shareId = sharesSnapshot.empty ? null : sharesSnapshot.docs[0].id;

                    return {
                        id: docId,
                        name: fileData.displayName || fileData.originalName,
                        size: formatBytes(fileData.size || 0),
                        sizeBytes: fileData.size || 0,
                        sharedWith,
                        expiryDate: fileData.expiresAt?.toDate().toLocaleDateString("zh-TW") || "",
                        status: "active" as const,
                        isProtected: fileData.shareMode === "device",
                        shareMode: fileData.shareMode,
                        sharedDate: fileData.createdAt?.toDate().toLocaleDateString("zh-TW") || "",
                        views: viewCount,
                        downloads: downloadCount,
                        contentType: fileData.contentType,
                        remainingDownloads: fileData.remainingDownloads,
                        maxDownloads: fileData.maxDownloads,
                        shareId,
                    };
                })
            );

            return NextResponse.json({ files });
        } else if (type === "sharedWithMe") {
            // Get files shared with the user (active only)
            const sharedSnapshot = await adminDb
                .collection("sharedWithMe")
                .where("ownerUid", "==", uid)
                .get();

            // Filter and sort in memory
            const activeShared = sharedSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((sharedData) => {
                    const expiresAt = (sharedData as { expiresAt?: { toMillis(): number } }).expiresAt;
                    return expiresAt && expiresAt.toMillis() > now.toMillis();
                })
                .sort((a, b) => {
                    const aExpires = (a as { expiresAt?: { toMillis(): number } }).expiresAt?.toMillis() || 0;
                    const bExpires = (b as { expiresAt?: { toMillis(): number } }).expiresAt?.toMillis() || 0;
                    return bExpires - aExpires;
                });

            const files = await Promise.all(
                activeShared.map(async (docData) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const sharedData = docData as Record<string, any>;

                    // Get the actual file data
                    const fileDoc = await adminDb
                        .collection("files")
                        .doc(sharedData.fileId as string)
                        .get();

                    if (!fileDoc.exists) {
                        return null;
                    }

                    const fileData = fileDoc.data()!;

                    // Get owner's email
                    let ownerEmail = sharedData.ownerEmail || "Unknown";
                    if (!sharedData.ownerEmail && fileData.ownerUid) {
                        try {
                            const ownerUser = await auth().getUser(fileData.ownerUid);
                            ownerEmail = ownerUser.email || "Unknown";
                        } catch (error) {
                            console.error("Error fetching owner email:", error);
                        }
                    }

                    return {
                        id: docData.id,
                        fileId: (sharedData.fileId as string),
                        shareId: (sharedData.shareId as string),
                        name: sharedData.fileName || fileData.displayName || fileData.originalName,
                        size: formatBytes(sharedData.fileSize || fileData.size),
                        sizeBytes: sharedData.fileSize || fileData.size,
                        sharedWith: [ownerEmail],
                        ownerEmail: ownerEmail,
                        expiryDate: sharedData.expiresAt?.toDate?.().toLocaleDateString("zh-TW") || "",
                        status: "active" as const,
                        isProtected: fileData.shareMode === "device",
                        shareMode: fileData.shareMode,
                        sharedDate: sharedData.sharedAt?.toDate?.().toLocaleDateString("zh-TW") || "",
                        views: sharedData.accessCount || 0,
                        downloads: 0, // Shared files don't track individual downloads
                        contentType: sharedData.contentType || fileData.contentType,
                        remainingDownloads: fileData.remainingDownloads,
                        maxDownloads: fileData.maxDownloads,
                        lastAccessedAt: sharedData.lastAccessedAt?.toDate?.().toLocaleDateString("zh-TW") || "",
                    };
                })
            );

            // Filter out null values (deleted files)
            const validFiles = files.filter((file) => file !== null);

            return NextResponse.json({ files: validFiles });
        } else if (type === "expired") {
            // Get expired files owned by the user (including revoked files)
            const filesSnapshot = await adminDb
                .collection("files")
                .where("ownerUid", "==", uid)
                .get();

            // Filter expired or revoked files in memory
            const expiredFileDocs = filesSnapshot.docs
                .filter((doc) => {
                    const fileData = doc.data();
                    const expiresAt = fileData.expiresAt;
                    const isRevoked = fileData.revoked === true;
                    const isExpired = expiresAt && expiresAt.toMillis() <= now.toMillis();
                    // Include files that are either revoked OR expired
                    return isRevoked || isExpired;
                })
                .sort((a, b) => {
                    const aExpires = a.data().expiresAt?.toMillis() || 0;
                    const bExpires = b.data().expiresAt?.toMillis() || 0;
                    return bExpires - aExpires;
                })
                .slice(0, 50); // Limit to 50

            const files = await Promise.all(
                expiredFileDocs.map(async (doc) => {
                    const fileData = doc.data();

                    // Get access logs for views and downloads
                    const accessLogsSnapshot = await adminDb
                        .collection("accessLogs")
                        .where("fileId", "==", doc.id)
                        .get();

                    let viewCount = 0;
                    let downloadCount = 0;

                    accessLogsSnapshot.forEach((log) => {
                        const logData = log.data();
                        if (logData.type === "access") viewCount++;
                        if (logData.type === "download") downloadCount++;
                    });

                    // Get recipients for this file
                    const sharedWithMeSnapshot = await adminDb
                        .collection("sharedWithMe")
                        .where("fileId", "==", doc.id)
                        .get();

                    const sharedWith: string[] = [];
                    sharedWithMeSnapshot.forEach((sharedDoc) => {
                        const sharedData = sharedDoc.data();
                        if (sharedData.ownerEmail) {
                            sharedWith.push(sharedData.ownerEmail);
                        }
                    });

                    // Get shareId for this file (from shares collection)
                    const sharesSnapshot = await adminDb
                        .collection("shares")
                        .where("fileId", "==", doc.id)
                        .limit(1)
                        .get();

                    const shareId = sharesSnapshot.empty ? null : sharesSnapshot.docs[0].id;

                    return {
                        id: doc.id,
                        name: fileData.displayName || fileData.originalName,
                        size: formatBytes(fileData.size),
                        sizeBytes: fileData.size,
                        sharedWith,
                        expiryDate: fileData.expiresAt.toDate().toLocaleDateString("zh-TW"),
                        revokedDate: fileData.revokedAt?.toDate().toLocaleDateString("zh-TW") || null,
                        status: "expired" as const,
                        isProtected: fileData.shareMode === "device",
                        shareMode: fileData.shareMode,
                        sharedDate: fileData.createdAt.toDate().toLocaleDateString("zh-TW"),
                        views: viewCount,
                        downloads: downloadCount,
                        contentType: fileData.contentType,
                        remainingDownloads: fileData.remainingDownloads,
                        maxDownloads: fileData.maxDownloads,
                        shareId,
                        revoked: fileData.revoked === true,
                    };
                })
            );

            return NextResponse.json({ files });
        } else {
            return NextResponse.json(
                { error: "Invalid type parameter" },
                { status: 400 }
            );
        }
    } catch (error) {
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}

// Helper function to format bytes
function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}
