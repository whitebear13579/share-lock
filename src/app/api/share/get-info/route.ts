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
                { error: "缺少 shareId" },
                { status: 400 }
            );
        }

        const shareDoc = await adminDb.collection("shares").doc(shareId).get();

        if (!shareDoc.exists) {
            return NextResponse.json(
                { error: "連結不存在或已過期" },
                { status: 404 }
            );
        }

        const shareData = shareDoc.data();

        // check the link validity
        // tips: in account-bound mode, if boundUid exists, allow access
        const isAccountBound = shareData?.shareMode === "account" && shareData?.boundUid;

        if (!shareData?.valid && !isAccountBound) {
            return NextResponse.json(
                { error: "連結已失效" },
                { status: 403 }
            );
        }

        const fileDoc = await adminDb.collection("files").doc(shareData.fileId).get();

        if (!fileDoc.exists) {
            return NextResponse.json(
                { error: "檔案不存在" },
                { status: 404 }
            );
        }

        const fileData = fileDoc.data();

        if (!fileData) {
            return NextResponse.json(
                { error: "無法取得檔案資料" },
                { status: 404 }
            );
        }

        // check expiration
        const now = Date.now();
        const expiresAt = fileData.expiresAt?.toDate().getTime();
        if (expiresAt && now > expiresAt) {
            return NextResponse.json(
                { error: "連結已過期" },
                { status: 403 }
            );
        }

        // check revocation (check both shareData and fileData)
        if (shareData.revoked || fileData.revoked) {
            return NextResponse.json(
                { error: "此分享已被撤銷" },
                { status: 403 }
            );
        }

        // check download count
        const maxDownloads = fileData.maxDownloads;
        const remainingDownloads = fileData.remainingDownloads || 0;
        if (typeof maxDownloads === 'number' && maxDownloads > 0 && remainingDownloads <= 0) {
            return NextResponse.json(
                { error: "下載次數已達上限" },
                { status: 403 }
            );
        }

        const shareMode = shareData.shareMode || fileData.shareMode || "public";
        const pinHash = shareData.pinHash || fileData.pinHash;

        // Record access log for view count tracking
        try {
            await adminDb.collection("accessLogs").add({
                fileId: shareData.fileId,
                shareId: shareId,
                type: "access",
                timestamp: new Date(),
                ip: request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown',
                userAgent: request.headers.get('user-agent') || 'unknown',
            });
        } catch (logError) {
            // Don't fail the request if logging fails
            console.error("Failed to record access log:", logError);
        }

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
            { error: "伺服器錯誤，請稍後再試" },
            { status: 500 }
        );
    }
}
