import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/utils/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { auth } from "firebase-admin";
import jwt from "jsonwebtoken";
import crypto from "crypto";

/*

    method: POST /api/download/issue-url
    signature the one-time download token
    the token is valid for 2 minutes, and can only be used once.

    Optional: If Authorization header is provided with a valid Firebase ID token,
    creates sharedWithMe record for the user (for non-account modes) and updates
    totalFilesReceived counter.

*/

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { shareId, sessionToken } = body;

        // Optional: Get user ID from Authorization header
        let userId: string | null = null;
        let userEmail: string | undefined;
        const authHeader = request.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
            try {
                const idToken = authHeader.split("Bearer ")[1];
                const decodedToken = await auth().verifyIdToken(idToken);
                userId = decodedToken.uid;
                userEmail = decodedToken.email;
            } catch {
                // Ignore token verification errors - user is optional
            }
        }

        if (!shareId) {
            return NextResponse.json(
                { error: "shareId missing" },
                { status: 400 }
            );
        }

        const shareDoc = await adminDb.collection("shares").doc(shareId).get();

        if (!shareDoc.exists) {
            return NextResponse.json(
                { error: "link does not exist" },
                { status: 404 }
            );
        }

        const shareData = shareDoc.data();
        if (!shareData) {
            return NextResponse.json(
                { error: "share data does not exist" },
                { status: 404 }
            );
        }

        const isAccountBound = shareData.shareMode === "account" && shareData.boundUid;

        if (!shareData.valid && !isAccountBound) {
            return NextResponse.json(
                { error: "link is invalid" },
                { status: 404 }
            );
        }

        const fileId = shareData.fileId;
        const fileDoc = await adminDb.collection("files").doc(fileId).get();

        if (!fileDoc.exists) {
            return NextResponse.json(
                { error: "file does not exist" },
                { status: 404 }
            );
        }

        const fileData = fileDoc.data();
        if (!fileData) {
            return NextResponse.json(
                { error: "file does not exist" },
                { status: 404 }
            );
        }

        const now = Date.now();
        const expiresAt = fileData.expiresAt?.toDate().getTime();
        if (expiresAt && now > expiresAt) {
            return NextResponse.json(
                { error: "link has expired" },
                { status: 400 }
            );
        }


        // Check revocation (both shareData and fileData)
        if (shareData.revoked || fileData.revoked) {
            return NextResponse.json(
                { error: "link has been revoked" },
                { status: 400 }
            );
        }

        const maxDownloads = fileData.maxDownloads;
        const remainingDownloads = fileData.remainingDownloads || 0;

        if (typeof maxDownloads === 'number' && maxDownloads > 0 && remainingDownloads <= 0) {
            return NextResponse.json(
                { error: "download limit exceeded" },
                { status: 400 }
            );
        }

        // device bound mode: verification sessionToken
        if (shareData.shareMode === "device") {
            if (!sessionToken) {
                return NextResponse.json(
                    { error: "sessionToken is required" },
                    { status: 401 }
                );
            }

            try {
                const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
                const decoded = jwt.verify(sessionToken, jwtSecret) as { shareId: string; fileId: string };

                if (decoded.shareId !== shareId || decoded.fileId !== fileId) {
                    return NextResponse.json(
                        { error: "sessionToken invalid" },
                        { status: 401 }
                    );
                }
            } catch {
                return NextResponse.json(
                    { error: "sessionToken has expired or is invalid" },
                    { status: 401 }
                );
            }
        }

        if (shareData.shareMode === "pin") {
            if (!sessionToken) {
                return NextResponse.json(
                    { error: "PIN verification required - sessionToken is missing" },
                    { status: 401 }
                );
            }

            try {
                const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
                const decoded = jwt.verify(sessionToken, jwtSecret) as {
                    shareId: string;
                    fileId: string;
                    mode: string;
                };

                if (decoded.shareId !== shareId || decoded.fileId !== fileId || decoded.mode !== "pin") {
                    return NextResponse.json(
                        { error: "sessionToken invalid" },
                        { status: 401 }
                    );
                }
            } catch {
                return NextResponse.json(
                    { error: "PIN session has expired, please verify PIN again" },
                    { status: 401 }
                );
            }
        }

        // For logged-in users (non-account mode): Create sharedWithMe record if not exists
        // Account mode creates record in bind-account API, so skip it here
        if (userId && shareData.shareMode !== "account") {
            // Check if sharedWithMe record already exists for this user and file
            const existingSharedWithMe = await adminDb
                .collection("sharedWithMe")
                .where("fileId", "==", fileId)
                .where("ownerUid", "==", userId)
                .limit(1)
                .get();

            if (existingSharedWithMe.empty) {
                // Create sharedWithMe record and update user's totalFilesReceived counter
                const batch = adminDb.batch();

                const sharedWithMeRef = adminDb.collection("sharedWithMe").doc();
                batch.set(sharedWithMeRef, {
                    shareId: shareId,
                    fileId: fileId,
                    ownerUid: userId,
                    ownerEmail: userEmail,
                    fileName: fileData.displayName || fileData.originalName || "Unknown",
                    fileSize: fileData.size || 0,
                    contentType: fileData.contentType || "application/octet-stream",
                    sharedAt: new Date(),
                    lastAccessedAt: new Date(),
                    accessCount: 1,
                    expiresAt: fileData.expiresAt,
                });

                // Update user's totalFilesReceived counter (cumulative, never decreases)
                const userRef = adminDb.collection("users").doc(userId);
                batch.set(userRef, {
                    totalFilesReceived: FieldValue.increment(1),
                }, { merge: true });

                await batch.commit();
            } else {
                // Update access count and last accessed time
                const sharedWithMeDoc = existingSharedWithMe.docs[0];
                await sharedWithMeDoc.ref.update({
                    lastAccessedAt: new Date(),
                    accessCount: FieldValue.increment(1),
                });
            }
        }

        const downloadToken = crypto.randomBytes(32).toString('base64url');

        // tips: the actual download count will be updated when /stream is accessed
        const tokenData: {
            shareId: string;
            fileId: string;
            storagePath: string;
            fileName: string;
            contentType: string;
            createdAt: Date;
            expiresAt: Date;
            used: boolean;
            maxDownloads?: number;
            remainingDownloads?: number;
        } = {
            shareId,
            fileId,
            storagePath: fileData.storagePath,
            fileName: fileData.originalName || 'download',
            contentType: fileData.contentType || 'application/octet-stream',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 2 * 60 * 1000), // token expires in 2 minutes
            used: false,
        };

        if (typeof maxDownloads === 'number' && maxDownloads > 0) {
            tokenData.maxDownloads = maxDownloads;
            tokenData.remainingDownloads = remainingDownloads;
        }

        await adminDb.collection("download_tokens").doc(downloadToken).set(tokenData);
        const downloadUrl = `/api/download/stream?token=${downloadToken}`;

        return NextResponse.json({
            success: true,
            downloadUrl,
            expiresIn: 120, // seconds
            remainingDownloads: typeof maxDownloads === 'number' && maxDownloads > 0
                ? remainingDownloads
                : 999, // return 999 for unlimited
        });

    } catch (error) {
        console.error("failed to issue download token:", error);
        return NextResponse.json(
            { error: `failed to issue download token: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
        );
    }
}
