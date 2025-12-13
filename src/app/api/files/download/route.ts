import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/utils/firebase-admin";
import { auth } from "firebase-admin";

/*

    method: POST /api/files/download
    Download a file - checks permissions and returns download URL or share page redirect
    Body: {
        fileId: string,
        shareId?: string (for shared files)
    }

    Returns:
    - For owner: direct download URL via stream
    - For shared with email (account bound): direct download URL via stream
    - For others: redirect to share page for verification

*/

export async function POST(request: NextRequest) {
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
        const body = await request.json();
        const { fileId, shareId } = body;

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

        // Check if file is expired
        const now = Date.now();
        const expiresAt = fileData?.expiresAt?.toDate().getTime();
        if (expiresAt && now > expiresAt) {
            return NextResponse.json(
                { error: "File has expired" },
                { status: 410 }
            );
        }

        // Check if file is revoked
        if (fileData?.revoked) {
            return NextResponse.json(
                { error: "File has been revoked" },
                { status: 410 }
            );
        }

        // Check download limits
        const maxDownloads = fileData?.maxDownloads;
        const remainingDownloads = fileData?.remainingDownloads || 0;
        if (typeof maxDownloads === "number" && maxDownloads > 0 && remainingDownloads <= 0) {
            return NextResponse.json(
                { error: "Download limit exceeded" },
                { status: 410 }
            );
        }

        const isOwner = fileData?.ownerUid === uid;

        // Case 1: User is the owner
        if (isOwner) {
            return await issueDirectDownload(fileId, fileData, shareId, uid, request);
        }

        // Case 2: Check if file is shared with user via email (account bound)
        const sharedWithMeSnapshot = await adminDb
            .collection("sharedWithMe")
            .where("fileId", "==", fileId)
            .where("ownerUid", "==", uid)
            .limit(1)
            .get();

        if (!sharedWithMeSnapshot.empty) {
            const sharedDoc = sharedWithMeSnapshot.docs[0];
            const sharedData = sharedDoc.data();

            // Only allow direct download for non-device modes
            // Device mode requires verification through share page
            if (fileData?.shareMode === "account" || fileData?.shareMode === "public") {
                await sharedDoc.ref.update({
                    accessCount: (sharedData.accessCount || 0) + 1,
                    lastAccessedAt: new Date(),
                });

                return await issueDirectDownload(fileId, fileData, sharedData.shareId, uid, request);
            } else if (fileData?.shareMode === "device" || fileData?.shareMode === "pin") {
                // For device or pin mode, redirect to share page for verification
                return NextResponse.json({
                    success: true,
                    requiresVerification: true,
                    shareId: sharedData.shareId,
                    redirectUrl: `/share/${sharedData.shareId}`,
                    message: "This file requires device verification before download",
                });
            }
        }

        // Case 3: For all other cases, require verification through share page
        let foundShareId = shareId;
        if (!foundShareId) {
            const shareSnapshot = await adminDb
                .collection("shares")
                .where("fileId", "==", fileId)
                .where("valid", "==", true)
                .limit(1)
                .get();

            if (!shareSnapshot.empty) {
                foundShareId = shareSnapshot.docs[0].id;
            }
        }

        if (!foundShareId) {
            return NextResponse.json(
                { error: "No valid share link found for this file" },
                { status: 404 }
            );
        }

        // Return redirect to share page
        return NextResponse.json({
            success: true,
            requiresVerification: true,
            shareId: foundShareId,
            redirectUrl: `/share/${foundShareId}`,
            message: "This file requires verification before download",
        });

    } catch (error) {
        console.error("Error processing download request:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}

async function issueDirectDownload(
    fileId: string,
    fileData: FirebaseFirestore.DocumentData | undefined,
    shareId?: string,
    uid?: string,
    request?: NextRequest
) {
    try {
        if (uid) {
            try {
                await adminDb.collection("accessLogs").add({
                    fileId: fileId,
                    uid: uid,
                    shareId: shareId,
                    type: "download",
                    at: new Date(),
                    ip: request?.headers.get('x-forwarded-for') ||
                        request?.headers.get('x-real-ip') ||
                        'unknown',
                    userAgent: request?.headers.get('user-agent') || 'unknown',
                });
            } catch (logError) {
                console.error("Failed to record access log:", logError);
            }
        }

        const crypto = await import("crypto");
        const downloadToken = crypto.randomBytes(32).toString("base64url");

        // Create download token
        const tokenData: {
            shareId?: string;
            fileId: string;
            storagePath: string;
            fileName: string;
            contentType: string;
            createdAt: Date;
            expiresAt: Date;
            used: boolean;
            maxDownloads?: number;
            remainingDownloads?: number;
            directDownload: boolean;
        } = {
            fileId,
            storagePath: fileData?.storagePath,
            fileName: fileData?.originalName || "download",
            contentType: fileData?.contentType || "application/octet-stream",
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 2 * 60 * 1000), // token expires in 2 minutes
            used: false,
            directDownload: true,
        };

        if (shareId) {
            tokenData.shareId = shareId;
        }

        const maxDownloads = fileData?.maxDownloads;
        const remainingDownloads = fileData?.remainingDownloads || 0;
        if (typeof maxDownloads === "number" && maxDownloads > 0) {
            tokenData.maxDownloads = maxDownloads;
            tokenData.remainingDownloads = remainingDownloads;
        }

        await adminDb.collection("download_tokens").doc(downloadToken).set(tokenData);

        return NextResponse.json({
            success: true,
            requiresVerification: false,
            downloadUrl: `/api/download/stream?token=${downloadToken}`,
            expiresIn: 120, // seconds
            remainingDownloads: typeof maxDownloads === "number" && maxDownloads > 0
                ? remainingDownloads
                : -1, // -1 for unlimited
        });
    } catch (error) {
        console.error("Error issuing direct download:", error);
        throw error;
    }
}
