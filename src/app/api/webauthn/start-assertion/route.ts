import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/utils/firebase-admin";
import crypto from "crypto";

/*

    method: POST /api/webauthn/start-assertion
    start the WebAuthn assertion process
    - validate share link
    - generate challenge (random 32 bytes)
    - save challenge to Firestore (5 minutes TTL)
    - return PublicKeyCredentialRequestOptions

*/

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { shareId, userId } = body;

        if (!shareId || typeof shareId !== "string") {
            return NextResponse.json(
                { error: "缺少必要參數" },
                { status: 400 }
            );
        }

        if (!userId || typeof userId !== "string") {
            return NextResponse.json(
                { error: "請先登入" },
                { status: 401 }
            );
        }

        // use the firebase-admin SDK to verify share link
        const shareDoc = await adminDb.collection("shares").doc(shareId).get();

        if (!shareDoc.exists || !shareDoc.data()?.valid) {
            return NextResponse.json(
                { error: "連結無效或已過期" },
                { status: 404 }
            );
        }

        const shareData = shareDoc.data();
        if (!shareData) {
            return NextResponse.json(
                { error: "分享資料不存在" },
                { status: 404 }
            );
        }

        const fileId = shareData.fileId;
        const fileDoc = await adminDb.collection("files").doc(fileId).get();

        if (!fileDoc.exists) {
            return NextResponse.json(
                { error: "檔案不存在" },
                { status: 404 }
            );
        }

        const fileData = fileDoc.data();
        if (!fileData) {
            return NextResponse.json(
                { error: "檔案資料不存在" },
                { status: 404 }
            );
        }

        if (fileData.shareMode !== "device") {
            return NextResponse.json(
                { error: "這個檔案不要求裝置驗證" },
                { status: 400 }
            );
        }

        // check for registered devices
        const allowedDevices = fileData.allowedDevices || [];
        if (allowedDevices.length === 0) {
            return NextResponse.json(
                { error: "這個檔案未綁定任何裝置" },
                { status: 400 }
            );
        }


        const challenge = crypto.randomBytes(32).toString("base64url");

        // save challenge to Firestore (temporary collection, 5 minutes TTL)
        const challengeId = `auth_${shareId}_${Date.now()}`;
        await adminDb.collection("webauthn_challenges").doc(challengeId).set({
            challenge,
            shareId,
            fileId,
            userId,
            type: "assertion",
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        });

        const rpId = process.env.NEXT_PUBLIC_DOMAIN || "localhost";

        const allowCredentials = allowedDevices.map((device: { credentialId: string; transports?: string[] }) => ({
            id: device.credentialId,
            type: "public-key" as const,
            transports: device.transports || [],
        }));

        const publicKeyCredentialRequestOptions = {
            challenge, // Base64URL string
            rpId,
            timeout: 60000, // 60s
            userVerification: "required" as const,
            allowCredentials,
        };

        return NextResponse.json({
            success: true,
            options: publicKeyCredentialRequestOptions,
        });

    } catch (error) {
        console.error("/api/webauthn/start-assertion 錯誤", error);
        return NextResponse.json(
            { error: "/api/webauthn/start-assertion 錯誤" },
            { status: 500 }
        );
    }
}
