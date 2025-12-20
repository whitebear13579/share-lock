import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/utils/firebase-admin";
import { auth } from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/*
    method: POST /api/storage/confirm-upload

    Confirms upload completion and validates the actual file size.
    This is the second line of defense - verify the uploaded file
    matches what was validated and update quota atomically.

    Request body:
    - validationToken: string
    - storagePath: string
    - actualSize: number (for verification)

    Response:
    - success: boolean
    - message?: string
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
        const { validationToken, storagePath } = body;

        if (!validationToken || !storagePath) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const validationRef = adminDb.collection("uploadValidations").doc(validationToken);
        const validationDoc = await validationRef.get();

        if (!validationDoc.exists) {
            return NextResponse.json(
                { error: "Invalid validation token", code: "INVALID_TOKEN" },
                { status: 400 }
            );
        }

        const validationData = validationDoc.data()!;
        if (validationData.uid !== uid) {
            return NextResponse.json(
                { error: "Token mismatch", code: "TOKEN_MISMATCH" },
                { status: 403 }
            );
        }

        if (validationData.expiresAt.toDate() < new Date()) {
            await validationRef.delete();
            return NextResponse.json(
                { error: "Validation expired, please retry upload", code: "TOKEN_EXPIRED" },
                { status: 400 }
            );
        }

        if (validationData.used) {
            return NextResponse.json(
                { error: "Validation token already used", code: "TOKEN_USED" },
                { status: 400 }
            );
        }

        let realFileSize: number;
        try {
            const bucket = adminStorage.bucket();
            const file = bucket.file(storagePath);
            const [metadata] = await file.getMetadata();
            realFileSize = parseInt(metadata.size as string, 10);
        } catch (error) {
            console.error("Error getting file metadata:", error);
            return NextResponse.json(
                { error: "File not found in storage", code: "FILE_NOT_FOUND" },
                { status: 400 }
            );
        }

        const sizeTolerance = Math.max(1024, validationData.fileSize * 0.01);
        if (Math.abs(realFileSize - validationData.fileSize) > sizeTolerance) {
            console.warn(`Size mismatch for user ${uid}: validated=${validationData.fileSize}, actual=${realFileSize}`);

            try {
                const bucket = adminStorage.bucket();
                await bucket.file(storagePath).delete();
            } catch (deleteError) {
                console.error("Failed to delete mismatched file:", deleteError);
            }

            return NextResponse.json(
                { error: "File size mismatch", code: "SIZE_MISMATCH" },
                { status: 400 }
            );
        }

        const filesSnapshot = await adminDb
            .collection("files")
            .where("ownerUid", "==", uid)
            .where("revoked", "==", false)
            .get();

        let currentUsedBytes = 0;
        filesSnapshot.forEach((doc) => {
            currentUsedBytes += doc.data().size || 0;
        });

        if (currentUsedBytes + realFileSize > STORAGE_QUOTA_BYTES) {
            try {
                const bucket = adminStorage.bucket();
                await bucket.file(storagePath).delete();
            } catch (deleteError) {
                console.error("Failed to delete over-quota file:", deleteError);
            }

            return NextResponse.json({
                success: false,
                error: "Storage quota exceeded",
                code: "QUOTA_EXCEEDED",
            });
        }

        await validationRef.update({
            used: true,
            usedAt: new Date(),
            actualSize: realFileSize,
            storagePath,
        });

        const userRef = adminDb.collection("users").doc(uid);
        await userRef.set(
            {
                storageQuotaUsed: FieldValue.increment(realFileSize),
                lastUploadAt: new Date(),
            },
            { merge: true }
        );

        return NextResponse.json({
            success: true,
            confirmedSize: realFileSize,
            newUsedBytes: currentUsedBytes + realFileSize,
            availableBytes: STORAGE_QUOTA_BYTES - (currentUsedBytes + realFileSize),
        });
    } catch (error) {
        console.error("Error confirming upload:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
