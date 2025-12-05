import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/utils/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { auth } from "firebase-admin";

/*

    method: POST /api/share/bind-account
    bind a share link to the current user account

*/

export async function POST(request: NextRequest) {
    try {
        const { shareId, userId } = await request.json();
        if (!shareId || !userId) {
            return NextResponse.json(
                { error: "shareId missing" },
                { status: 400 }
            );
        }

        const shareRef = adminDb.collection("shares").doc(shareId);
        const shareDoc = await shareRef.get();

        if (!shareDoc.exists) {
            return NextResponse.json(
                { error: "share not found" },
                { status: 404 }
            );
        }

        const shareData = shareDoc.data();

        // check the file already bound or not
        if (shareData?.boundUid) {
            if (shareData.boundUid !== userId) {
                return NextResponse.json(
                    { error: "already bound to another account" },
                    { status: 403 }
                );
            }

            return NextResponse.json({
                success: true,
                message: "already bound to this account",
            });
        }

        // Get file data for sharedWithMe record
        const fileDoc = await adminDb.collection("files").doc(shareData?.fileId).get();
        const fileData = fileDoc.data();

        // Get user email
        let userEmail: string | undefined;
        try {
            const userRecord = await auth().getUser(userId);
            userEmail = userRecord.email;
        } catch {
            // Ignore error if unable to get user email
        }

        // Use batch write for atomicity
        const batch = adminDb.batch();

        // Update share with boundUid
        batch.update(shareRef, {
            boundUid: userId,
            boundAt: new Date(),
        });

        // Create sharedWithMe record
        const sharedWithMeRef = adminDb.collection("sharedWithMe").doc();
        batch.set(sharedWithMeRef, {
            shareId: shareId,
            fileId: shareData?.fileId,
            ownerUid: userId, // The receiver's UID
            ownerEmail: userEmail,
            fileName: fileData?.displayName || fileData?.originalName || "Unknown",
            fileSize: fileData?.size || 0,
            contentType: fileData?.contentType || "application/octet-stream",
            sharedAt: new Date(),
            lastAccessedAt: null,
            accessCount: 0,
            expiresAt: fileData?.expiresAt,
        });

        // Update user's totalFilesReceived counter (cumulative, never decreases)
        const userRef = adminDb.collection("users").doc(userId);
        batch.set(userRef, {
            totalFilesReceived: FieldValue.increment(1),
        }, { merge: true });

        await batch.commit();

        return NextResponse.json({
            success: true,
            message: "account bound successfully",
        });
    } catch (error) {
        console.error("internal server error", error);
        return NextResponse.json(
            { error: "internal server error" },
            { status: 500 }
        );
    }
}
