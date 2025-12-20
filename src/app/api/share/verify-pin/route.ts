import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/utils/firebase-admin";
import jwt from "jsonwebtoken";
import crypto from "crypto";

/*

    method: POST /api/share/verify-pin
    Server-side PIN verification for share links.

    This API verifies the PIN on the server side to prevent client-side bypass attacks.
    If verification succeeds, it issues a session token that must be used for download.

*/

function hashPin(pin: string): string {
    return crypto.createHash('sha256').update(pin).digest('hex');
}

export async function POST(request: NextRequest) {
    try {
        const { shareId, pin } = await request.json();

        if (!shareId) {
            return NextResponse.json(
                { error: "缺少 shareId" },
                { status: 400 }
            );
        }

        if (!pin || typeof pin !== "string") {
            return NextResponse.json(
                { error: "缺少 PIN 碼" },
                { status: 400 }
            );
        }

        // Validate PIN format
        if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
            return NextResponse.json(
                { error: "PIN 碼格式錯誤" },
                { status: 400 }
            );
        }

        // Get share data
        const shareDoc = await adminDb.collection("shares").doc(shareId).get();

        if (!shareDoc.exists) {
            return NextResponse.json(
                { error: "連結不存在或已過期" },
                { status: 404 }
            );
        }

        const shareData = shareDoc.data();

        if (!shareData?.valid) {
            return NextResponse.json(
                { error: "連結已失效" },
                { status: 403 }
            );
        }

        // Get file data
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

        // Check if this is a PIN-protected share
        const shareMode = shareData.shareMode || fileData.shareMode;
        if (shareMode !== "pin") {
            return NextResponse.json(
                { error: "此分享不需要 PIN 碼驗證" },
                { status: 400 }
            );
        }

        // Get stored PIN hash
        const storedPinHash = shareData.pinHash || fileData.pinHash;
        if (!storedPinHash) {
            return NextResponse.json(
                { error: "此分享未設定 PIN 碼" },
                { status: 400 }
            );
        }

        // Check expiration
        const now = Date.now();
        const expiresAt = fileData.expiresAt?.toDate().getTime();
        if (expiresAt && now > expiresAt) {
            return NextResponse.json(
                { error: "連結已過期" },
                { status: 403 }
            );
        }

        // Check revocation
        if (shareData.revoked || fileData.revoked) {
            return NextResponse.json(
                { error: "此分享已被撤銷" },
                { status: 403 }
            );
        }

        // Check download count
        const maxDownloads = fileData.maxDownloads;
        const remainingDownloads = fileData.remainingDownloads || 0;
        if (typeof maxDownloads === 'number' && maxDownloads > 0 && remainingDownloads <= 0) {
            return NextResponse.json(
                { error: "下載次數已達上限" },
                { status: 403 }
            );
        }

        // Verify PIN server-side
        const inputHash = hashPin(pin);
        if (inputHash !== storedPinHash) {
            // Log failed attempt for security monitoring
            console.warn(`Failed PIN attempt for shareId: ${shareId}`);

            return NextResponse.json(
                { error: "PIN 碼錯誤" },
                { status: 401 }
            );
        }

        // PIN is correct - issue a session token
        const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
        const sessionToken = jwt.sign(
            {
                shareId,
                fileId: shareData.fileId,
                mode: "pin",
                verifiedAt: Date.now(),
            },
            jwtSecret,
            { expiresIn: "2m" }
        );

        return NextResponse.json({
            success: true,
            verified: true,
            sessionToken,
        });

    } catch (error) {
        console.error("PIN verification failed:", error);
        return NextResponse.json(
            { error: "伺服器錯誤，請稍後再試" },
            { status: 500 }
        );
    }
}
