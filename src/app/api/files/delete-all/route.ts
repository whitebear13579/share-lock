import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/utils/firebase-admin";
import { auth } from "firebase-admin";

/*

    method: DELETE /api/files/delete-all
    Delete ALL files owned by the authenticated user
    This is a destructive operation that requires explicit confirmation

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
        const { confirmText } = body;

        if (confirmText !== "DELETE") {
            return NextResponse.json(
                { error: "Confirmation text must be 'DELETE'" },
                { status: 400 }
            );
        }

        // Get all files owned by the user
        const filesSnapshot = await adminDb
            .collection("files")
            .where("ownerUid", "==", uid)
            .get();

        if (filesSnapshot.empty) {
            return NextResponse.json({
                success: true,
                message: "No files to delete",
                deletedCount: 0,
            });
        }

        const bucket = adminStorage.bucket();
        let deletedCount = 0;
        let totalSizeDeleted = 0;
        const errors: string[] = [];

        // Process each file
        for (const fileDoc of filesSnapshot.docs) {
            const fileData = fileDoc.data();
            const fileId = fileDoc.id;

            try {
                // Delete from storage first
                if (fileData?.storagePath) {
                    try {
                        const file = bucket.file(fileData.storagePath);
                        await file.delete();
                    } catch (storageError) {
                        console.error(`Storage deletion error for ${fileId}:`, storageError);
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

                // Delete sharedWithMe entries
                const sharedWithMeSnapshot = await adminDb
                    .collection("sharedWithMe")
                    .where("fileId", "==", fileId)
                    .get();

                sharedWithMeSnapshot.forEach((doc) => {
                    batch.delete(doc.ref);
                });

                // Delete access logs
                const accessLogsSnapshot = await adminDb
                    .collection("accessLogs")
                    .where("fileId", "==", fileId)
                    .get();

                accessLogsSnapshot.forEach((doc) => {
                    batch.delete(doc.ref);
                });

                // Delete download tokens
                const downloadTokensSnapshot = await adminDb
                    .collection("download_tokens")
                    .where("fileId", "==", fileId)
                    .get();

                downloadTokensSnapshot.forEach((doc) => {
                    batch.delete(doc.ref);
                });

                await batch.commit();

                deletedCount++;
                totalSizeDeleted += fileData?.size || 0;

            } catch (fileError) {
                console.error(`Error deleting file ${fileId}:`, fileError);
                errors.push(fileId);
            }
        }

        // Reset user's storage quota to 0
        try {
            const userDoc = await adminDb.collection("users").doc(uid).get();
            if (userDoc.exists) {
                await adminDb.collection("users").doc(uid).update({
                    storageQuotaUsed: 0,
                });
            }
        } catch (quotaError) {
            console.error("Error resetting storage quota:", quotaError);
        }

        return NextResponse.json({
            success: true,
            message: `Successfully deleted ${deletedCount} file(s)`,
            deletedCount,
            totalSizeDeleted,
            failedCount: errors.length,
            failedFileIds: errors.length > 0 ? errors : undefined,
        });

    } catch (error) {
        console.error("Error deleting all files:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
