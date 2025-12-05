import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/utils/firebase-admin";
import { auth } from "firebase-admin";

/*

    method: DELETE /api/files/delete
    Delete a file owned by the authenticated user
    Body: { fileId: string }

*/

export async function DELETE(request: NextRequest) {
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
        const { fileId } = body;

        if (!fileId) {
            return NextResponse.json(
                { error: "fileId is required" },
                { status: 400 }
            );
        }

        const fileDoc = await adminDb.collection("files").doc(fileId).get();

        if (!fileDoc.exists) {
            return NextResponse.json(
                { error: "File not found" },
                { status: 404 }
            );
        }

        const fileData = fileDoc.data();

        if (fileData?.ownerUid !== uid) {
            return NextResponse.json(
                { error: "Permission denied - You do not own this file" },
                { status: 403 }
            );
        }

        if (fileData?.storagePath) {
            try {
                const bucket = adminStorage.bucket();
                const file = bucket.file(fileData.storagePath);
                await file.delete();
            } catch (storageError) {
                console.error("Error deleting from storage:", storageError);
            }
        }

        const batch = adminDb.batch();

        batch.delete(adminDb.collection("files").doc(fileId));

        const sharesSnapshot = await adminDb
            .collection("shares")
            .where("fileId", "==", fileId)
            .get();

        sharesSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        const sharedWithMeSnapshot = await adminDb
            .collection("sharedWithMe")
            .where("fileId", "==", fileId)
            .get();

        sharedWithMeSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        const accessLogsSnapshot = await adminDb
            .collection("accessLogs")
            .where("fileId", "==", fileId)
            .get();

        accessLogsSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        const downloadTokensSnapshot = await adminDb
            .collection("download_tokens")
            .where("fileId", "==", fileId)
            .get();

        downloadTokensSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        try {
            const userDoc = await adminDb.collection("users").doc(uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                const currentUsed = userData?.storageQuotaUsed || 0;
                const fileSize = fileData?.size || 0;
                const newUsed = Math.max(0, currentUsed - fileSize);

                await adminDb.collection("users").doc(uid).update({
                    storageQuotaUsed: newUsed,
                });
            }
        } catch (quotaError) {
            console.error("Error updating storage quota:", quotaError);
        }

        return NextResponse.json({
            success: true,
            message: "File deleted successfully",
        });

    } catch (error) {
        console.error("Error deleting file:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
