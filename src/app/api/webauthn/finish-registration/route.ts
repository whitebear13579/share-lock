import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/utils/firebase-admin";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";

/*

    method: POST /api/webauthn/finish-registration
    finish the WebAuthn registration process
    - verify the attestation response
    - extract credentialId, publicKey, counter, aaguid
    - check BE/BS flags
    - save DeviceInfo to Firestore

*/

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { shareId, credential, deviceLabel, userId } = body;

        if (!shareId || !credential || !userId) {
            return NextResponse.json(
                { error: "缺少必要參數" },
                { status: 400 }
            );
        }

        const challengesSnapshot = await adminDb
            .collection("webauthn_challenges")
            .where("shareId", "==", shareId)
            .where("type", "==", "registration")
            .get();

        if (challengesSnapshot.empty) {
            return NextResponse.json(
                { error: "找不到認證階段" },
                { status: 400 }
            );
        }

        const challenges = challengesSnapshot.docs
            .map(doc => ({ doc, data: doc.data() }))
            .sort((a, b) => {
                const timeA = a.data.createdAt?.toDate()?.getTime() || 0;
                const timeB = b.data.createdAt?.toDate()?.getTime() || 0;
                return timeB - timeA;
            });

        const challengeDoc = challenges[0].doc;
        const challengeData = challenges[0].data;
        const expectedChallenge = challengeData.challenge;
        const fileId = challengeData.fileId;
        const expiresAt = challengeData.expiresAt?.toDate().getTime();
        if (expiresAt && Date.now() > expiresAt) {
            return NextResponse.json(
                { error: "認證階段已過期，請重試" },
                { status: 400 }
            );
        }

        const rpId = process.env.NEXT_PUBLIC_DOMAIN || "localhost";
        const expectedOrigin = process.env.NEXT_PUBLIC_SITE_URL
            || (process.env.NODE_ENV === "production"
                ? `https://${rpId}`
                : `http://localhost:3000`);

        const verification = await verifyRegistrationResponse({
            response: credential,
            expectedChallenge,
            expectedOrigin,
            expectedRPID: rpId,
            requireUserVerification: true,
        });

        if (!verification.verified || !verification.registrationInfo) {
            return NextResponse.json(
                { error: "身分驗證失敗" },
                { status: 400 }
            );
        }

        const regInfo = verification.registrationInfo;
        const {
            credential: cred,
            aaguid,
        } = regInfo;

        const credentialID = cred.id;
        const credentialPublicKey = cred.publicKey;
        const counter = cred.counter;

        const backupEligible = regInfo.credentialDeviceType === "multiDevice";
        const backupState = regInfo.credentialBackedUp || false;

        /*
            Apple 的 Passkey 預設儲存在「密碼」app 中，會透過 iCloud Keychain 同步
            因為 Apple 裝置上沒有任何 app 可以做到真正的本地端儲存 Passkey
            所以這裡允許使用 Apple 裝置的驗證器可以儲存在密碼 app 中。

            Apple authenticators AAGUID:
            - iCloud Keychain (iOS/macOS): fbfc3007-154e-4ecc-8c0b-6e020557d7bd
            - iCloud Keychain (newer): f24a8e70-d0d3-f82c-2937-32523cc4de5a
            - Apple Touch ID / Face ID: adce0002-35bc-c60a-648b-0b25f1f05503
        */
        const appleAAGUIDs = [
            "fbfc3007-154e-4ecc-8c0b-6e020557d7bd",
            "f24a8e70-d0d3-f82c-2937-32523cc4de5a",
            "adce0002-35bc-c60a-648b-0b25f1f05503",
            "00000000-0000-0000-0000-000000000000",
        ];

        const isAppleAuthenticator = appleAAGUIDs.includes(aaguid);

        // block backup-eligible authenticators, except for Apple devices
        if (backupEligible && !isAppleAuthenticator) {
            return NextResponse.json(
                { error: "不允許使用具備份能力的驗證器（Apple 裝置除外）" },
                { status: 400 }
            );
        }

        const deviceInfo = {
            id: credentialID,
            label: deviceLabel || "未命名裝置",
            credentialId: credentialID,
            publicKey: isoBase64URL.fromBuffer(credentialPublicKey),
            counter,
            createdAt: new Date(),
            lastUsedAt: new Date(),
            aaguid: aaguid,
            transports: credential.response?.transports || [],
            backupEligible,
            backupState,
            boundByUid: userId,
        };

        const fileRef = adminDb.collection("files").doc(fileId);
        const fileDoc = await fileRef.get();

        if (!fileDoc.exists) {
            return NextResponse.json(
                { error: "檔案不存在" },
                { status: 404 }
            );
        }

        const fileData = fileDoc.data();
        const existingDevices = fileData?.allowedDevices || [];

        await fileRef.update({
            allowedDevices: [...existingDevices, deviceInfo],
        });

        await adminDb
            .collection("webauthn_challenges")
            .doc(challengeDoc.id)
            .update({ used: true });

        return NextResponse.json({
            success: true,
            verified: true,
            credentialId: deviceInfo.credentialId,
        });

    } catch (error) {
        console.error("Finish registration error:", error);
        return NextResponse.json(
            { error: `/api/webauthn/finish-registration 錯誤： ${error instanceof Error ? error.message : '未知的錯誤'}` },
            { status: 500 }
        );
    }
}
