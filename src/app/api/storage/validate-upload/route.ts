import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/utils/firebase-admin";
import { auth } from "firebase-admin";

/*
    method: POST /api/storage/validate-upload

    Validates if user has enough storage quota BEFORE upload.
    This is the first line of defense - backend must verify quota,
    never trust client-side checks.

    Request body:
    - fileSize: number (bytes)

    Response:
    - allowed: boolean
    - availableBytes: number
    - message?: string (error message if not allowed)
*/

const STORAGE_QUOTA_BYTES = 1024 * 1024 * 1024; // 1GB

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Unauthorized - No token provided" },
                { status: 401 }
            );
        }

        const idToken = authHeader.split("Bearer ")[1];
        let decodedToken;
        try {
            decodedToken = await auth().verifyIdToken(idToken);
        } catch (error) {
            console.error("Token verification error:", error);
            return NextResponse.json(
                { error: "Unauthorized - Invalid token" },
                { status: 401 }
            );
        }

        const uid = decodedToken.uid;

        const body = await request.json();
        const { fileSize } = body;

        if (typeof fileSize !== "number" || fileSize <= 0) {
            return NextResponse.json(
                { error: "Invalid file size" },
                { status: 400 }
            );
        }

        const filesSnapshot = await adminDb
            .collection("files")
            .where("ownerUid", "==", uid)
            .where("revoked", "==", false)
            .get();

        let usedBytes = 0;
        filesSnapshot.forEach((doc) => {
            const fileData = doc.data();
            usedBytes += fileData.size || 0;
        });

        const availableBytes = STORAGE_QUOTA_BYTES - usedBytes;

        if (fileSize > availableBytes) {
            return NextResponse.json({
                allowed: false,
                availableBytes,
                usedBytes,
                quotaBytes: STORAGE_QUOTA_BYTES,
                message: "儲存空間不足",
            });
        }

        const validationToken = `${uid}_${Date.now()}_${fileSize}_${Math.random().toString(36).slice(2)}`;

        await adminDb.collection("uploadValidations").doc(validationToken).set({
            uid,
            fileSize,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
            used: false,
        });

        return NextResponse.json({
            allowed: true,
            availableBytes,
            usedBytes,
            quotaBytes: STORAGE_QUOTA_BYTES,
            validationToken,
        });
    } catch (error) {
        console.error("Error validating upload:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
