import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/utils/firebase-admin";
import crypto from "crypto";

/*

    method: POST /api/webauthn/start-registration
    start the WebAuthn registration process
    - validate the share link
    - generate a challenge (32 random bytes)
    - store the challenge in Firestore (5 minutes TTL)
    - return PublicKeyCredentialCreationOptions

*/
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { shareId } = body;

        if (!shareId || typeof shareId !== "string") {
            return NextResponse.json(
                { error: "缺少必要參數" },
                { status: 400 }
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

        const challenge = crypto.randomBytes(32).toString("base64url");

        // save challenge to Firestore (temporary collection, 5 minutes TTL)
        const challengeId = `reg_${shareId}_${Date.now()}`;
        await adminDb.collection("webauthn_challenges").doc(challengeId).set({
            challenge,
            shareId,
            fileId,
            type: "registration",
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 mins
        });
        const rpId = process.env.NEXT_PUBLIC_DOMAIN || "localhost";

        const publicKeyCredentialCreationOptions = {
            challenge, // Base64URL string
            rp: {
                name: "ShareLock",
                id: rpId,
            },
            user: {
                id: shareId,
                name: `device_${shareId.slice(0, 8)}`,
                displayName: `ShareLock Device ${shareId.slice(0, 8)}`,
            },
            pubKeyCredParams: [
                { alg: -7, type: "public-key" },  // ES256
                { alg: -257, type: "public-key" } // RS256
            ],
            timeout: 60000, // 60s
            attestation: "none" as const,
            authenticatorSelection: {
                authenticatorAttachment: "platform" as const,
                userVerification: "required" as const,
                requireResidentKey: false,
                residentKey: "discouraged" as const,
            },
            excludeCredentials: [],
        };

        return NextResponse.json({
            success: true,
            options: publicKeyCredentialCreationOptions,
        });

    } catch (error) {
        console.error("/api/webauthn/start-registration 錯誤", error);
        return NextResponse.json(
            { error: "/api/webauthn/start-registration 錯誤" },
            { status: 500 }
        );
    }
}
