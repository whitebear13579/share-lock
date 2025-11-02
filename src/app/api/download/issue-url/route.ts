import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/utils/firebase-admin";
import jwt from "jsonwebtoken";
import crypto from "crypto";

/*

    method: POST /api/download/issue-url
    signature the one-time download token
    the token is valid for 2 minutes, and can only be used once.

*/

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { shareId, sessionToken } = body;

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
            console.log("download failed - valid:", shareData.valid, "isAccountBound:", isAccountBound);
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


        if (shareData.revoked) {
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
