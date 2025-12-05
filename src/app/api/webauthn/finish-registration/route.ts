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

        // block backup-eligible authenticators
        if (backupEligible) {
            return NextResponse.json(
                { error: "不允許使用具備份能力的驗證器" },
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
