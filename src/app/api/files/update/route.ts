import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/utils/firebase-admin";
import { auth } from "firebase-admin";

/*

    method: PATCH /api/files/update
    Update file metadata (displayName, maxDownloads, etc.)
    Body: { fileId: string, updates: { displayName?: string, maxDownloads?: number, revoked?: boolean } }

*/

export async function PATCH(request: NextRequest) {
    try {
        // get the authorization header
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Unauthorized - No token provided" },
                { status: 401 }
            );
        }

        // verify the Firebase ID token
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
        const { fileId, updates } = body;

        if (!fileId) {
            return NextResponse.json(
                { error: "fileId is required" },
                { status: 400 }
            );
        }

        if (!updates || typeof updates !== "object") {
            return NextResponse.json(
                { error: "updates object is required" },
                { status: 400 }
            );
        }

        // Get the file document
        const fileDoc = await adminDb.collection("files").doc(fileId).get();

        if (!fileDoc.exists) {
            return NextResponse.json(
                { error: "File not found" },
                { status: 404 }
            );
        }

        const fileData = fileDoc.data();

        // Check ownership
        if (fileData?.ownerUid !== uid) {
            return NextResponse.json(
                { error: "Permission denied - You do not own this file" },
                { status: 403 }
            );
        }

        // Prepare allowed updates
        const allowedUpdates: Record<string, unknown> = {};

        if (typeof updates.displayName === "string" && updates.displayName.trim()) {
            allowedUpdates.displayName = updates.displayName.trim();
        }

        if (typeof updates.maxDownloads === "number" && updates.maxDownloads >= 0) {
            allowedUpdates.maxDownloads = updates.maxDownloads;
            // Also update remaining downloads if increasing max
            if (updates.maxDownloads > (fileData?.maxDownloads || 0)) {
                const currentRemaining = fileData?.remainingDownloads || 0;
                const increase = updates.maxDownloads - (fileData?.maxDownloads || 0);
                allowedUpdates.remainingDownloads = currentRemaining + increase;
            }
        }

        if (typeof updates.revoked === "boolean") {
            allowedUpdates.revoked = updates.revoked;

            // Record revoked timestamp
            if (updates.revoked) {
                allowedUpdates.revokedAt = new Date();
            }

            // Also update related share documents
            if (updates.revoked) {
                const sharesSnapshot = await adminDb
                    .collection("shares")
                    .where("fileId", "==", fileId)
                    .get();

                const batch = adminDb.batch();
                sharesSnapshot.forEach((doc) => {
                    batch.update(doc.ref, { valid: false, revoked: true });
                });
                await batch.commit();
            }
        }

        if (Object.keys(allowedUpdates).length === 0) {
            return NextResponse.json(
                { error: "No valid updates provided" },
                { status: 400 }
            );
        }

        // Add updated timestamp
        allowedUpdates.updatedAt = new Date();

        // Update the file document
        await adminDb.collection("files").doc(fileId).update(allowedUpdates);

        return NextResponse.json({
            success: true,
            message: "File updated successfully",
            updates: allowedUpdates,
        });

    } catch (error) {
        console.error("Error updating file:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
