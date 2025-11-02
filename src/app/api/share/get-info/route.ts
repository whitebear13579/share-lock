import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/utils/firebase-admin";

/*

    method: POST /api/share/get-info
    use firebase-admin SDK to get share files info

*/

export async function POST(request: NextRequest) {
    try {
        const { shareId } = await request.json();

        if (!shareId) {
            return NextResponse.json(
                { error: "shareId missing" },
                { status: 400 }
            );
        }

        const shareDoc = await adminDb.collection("shares").doc(shareId).get();

        if (!shareDoc.exists) {
            return NextResponse.json(
                { error: "link not exist or expired" },
                { status: 404 }
            );
        }

        const shareData = shareDoc.data();

        // check the link validity
        // tips: in account-bound mode, if boundUid exists, allow access
        const isAccountBound = shareData?.shareMode === "account" && shareData?.boundUid;

        if (!shareData?.valid && !isAccountBound) {
            return NextResponse.json(
                { error: "link invalid" },
                { status: 403 }
            );
        }

        const fileDoc = await adminDb.collection("files").doc(shareData.fileId).get();

        if (!fileDoc.exists) {
            return NextResponse.json(
                { error: "file not exist" },
                { status: 404 }
            );
        }

        const fileData = fileDoc.data();

        if (!fileData) {
            return NextResponse.json(
                { error: "file data not exist" },
                { status: 404 }
            );
        }

        // check expiration
        const now = Date.now();
        const expiresAt = fileData.expiresAt?.toDate().getTime();
        if (expiresAt && now > expiresAt) {
            return NextResponse.json(
                { error: "link expired" },
                { status: 403 }
            );
        }

        // check revocation
        if (shareData.revoked) {
            return NextResponse.json(
                { error: "link revoked" },
                { status: 403 }
            );
        }

        // check download count
        const maxDownloads = fileData.maxDownloads;
        const remainingDownloads = fileData.remainingDownloads || 0;
        if (typeof maxDownloads === 'number' && maxDownloads > 0 && remainingDownloads <= 0) {
            return NextResponse.json(
                { error: "download limit reached" },
                { status: 403 }
            );
        }

        const shareMode = shareData.shareMode || fileData.shareMode || "public";
        const pinHash = shareData.pinHash || fileData.pinHash;

        return NextResponse.json({
            success: true,
            shareData: {
                fileId: shareData.fileId,
                ownerUid: shareData.ownerUid,
                boundUid: shareData.boundUid,
                valid: shareData.valid,
                createdAt: shareData.createdAt,
            },
            fileData: {
                displayName: fileData.displayName || fileData.originalName || "未知檔案",
                originalName: fileData.originalName,
                size: fileData.size || 0,
                contentType: fileData.contentType || "application/octet-stream",
                expiresAt: fileData.expiresAt,
                createdAt: fileData.createdAt,
                remainingDownloads: remainingDownloads,
                maxDownloads: maxDownloads,
                shareMode: shareMode,
                pinHash: pinHash,
                revoked: shareData.revoked || false,
                allowedDevices: fileData.allowedDevices || [],
                ownerUid: fileData.ownerUid,
            },
        });
    } catch (error) {
        console.error("failed to get share files info:", error);
        return NextResponse.json(
            { error: "internal server error" },
            { status: 500 }
        );
    }
}
