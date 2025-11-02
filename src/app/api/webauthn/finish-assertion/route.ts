import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/utils/firebase-admin";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import jwt from "jsonwebtoken";

/*

    method: POST /api/webauthn/finish-assertion
    finish the WebAuthn assertion process
    - verify the assertion response
    - check the signCount (to prevent replay attacks)
    - update lastUsedAt and counter
    - generate a sessionToken (JWT, valid for 5 minutes)

*/

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { shareId, credential } = body;

        if (!shareId || !credential) {
            return NextResponse.json(
                { error: "missing required parameters" },
                { status: 400 }
            );
        }

        const challengesSnapshot = await adminDb
            .collection("webauthn_challenges")
            .where("shareId", "==", shareId)
            .where("type", "==", "assertion")
            .get();

        if (challengesSnapshot.empty) {
            return NextResponse.json(
                { error: "can not find corresponding challenge" },
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
                { error: "Challenge expired, please restart" },
                { status: 400 }
            );
        }

        const fileDoc = await adminDb.collection("files").doc(fileId).get();

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

        const allowedDevices = fileData.allowedDevices || [];

        const credentialIdBase64 = credential.id;
        const device = allowedDevices.find(
            (dev: { credentialId: string }) => dev.credentialId === credentialIdBase64
        );

        if (!device) {
            return NextResponse.json(
                { error: "this device is not bound to the file" },
                { status: 403 }
            );
        }

        const rpId = process.env.NEXT_PUBLIC_DOMAIN || "localhost";
        const expectedOrigin = process.env.NODE_ENV === "production"
            ? `https://${rpId}`
            : `http://localhost:3000`;

        const verification = await verifyAuthenticationResponse({
            response: credential,
            expectedChallenge,
            expectedOrigin,
            expectedRPID: rpId,
            requireUserVerification: true,
            credential: {
                id: device.credentialId, // Base64URL string
                publicKey: isoBase64URL.toBuffer(device.publicKey),
                counter: device.counter,
            },
        });

        if (!verification.verified) {
            return NextResponse.json(
                { error: "device verification failed" },
                { status: 403 }
            );
        }

        const { authenticationInfo } = verification;
        const newCounter = authenticationInfo.newCounter;

        /*

            check the signCount is incremented to prevent replay attacks
            tips: some authenticators do not support counter (always 0), this is valid, only check increment when old counter > 0 or new counter > 0

        */

        if (device.counter > 0 || newCounter > 0) {
            if (newCounter <= device.counter) {
                console.error("Counter rollback detected!", {
                    oldCounter: device.counter,
                    newCounter,
                    credentialId: device.credentialId,
                });
                return NextResponse.json(
                    { error: "detected abnormality: signature counter not incremented" },
                    { status: 403 }
                );
            }
        }

        const updatedDevices = allowedDevices.map((dev: { credentialId: string; counter: number;[key: string]: unknown }) => {
            if (dev.credentialId === device.credentialId) {
                return {
                    ...dev,
                    counter: newCounter,
                    lastUsedAt: new Date(),
                };
            }
            return dev;
        });

        await adminDb.collection("files").doc(fileId).update({
            allowedDevices: updatedDevices,
        });

        // generate JWT sessionToken (valid for 5 mins)
        const jwtSecret = process.env.JWT_SECRET || "your-secret-key-change-in-production";
        const sessionToken = jwt.sign(
            {
                shareId,
                fileId,
                credentialId: device.credentialId,
                verified: true,
            },
            jwtSecret,
            { expiresIn: "5m" }
        );

        // mark challenge as used
        await adminDb
            .collection("webauthn_challenges")
            .doc(challengeDoc.id)
            .update({ used: true });

        return NextResponse.json({
            success: true,
            verified: true,
            sessionToken,
        });

    } catch (error) {
        console.error("Finish assertion error:", error);
        return NextResponse.json(
            { error: `verification failed: ${error instanceof Error ? error.message : 'unknown error'}` },
            { status: 500 }
        );
    }
}
