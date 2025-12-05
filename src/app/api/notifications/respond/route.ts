import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/utils/firebase-admin";
import { auth } from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

/*

    method: POST /api/notifications/respond
    Respond to a share invitation (accept or reject)
    Body: { notificationId: string, shareId: string, action: "accept" | "reject" }

*/

export async function POST(request: NextRequest) {
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
        } catch {
            return NextResponse.json(
                { error: "Unauthorized - Invalid token" },
                { status: 401 }
            );
        }

        const uid = decodedToken.uid;
        const userRecord = await auth().getUser(uid);
        const userEmail = userRecord.email;

        if (!userEmail) {
            return NextResponse.json(
                { error: "User email not found" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { notificationId, shareId, action } = body;

        if (!notificationId || !shareId || !action) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (action !== "accept" && action !== "reject") {
            return NextResponse.json(
                { error: "Invalid action" },
                { status: 400 }
            );
        }

        // Get the notification
        const notifDoc = await adminDb
            .collection("notifications")
            .doc(notificationId)
            .get();

        if (!notifDoc.exists) {
            return NextResponse.json(
                { error: "Notification not found" },
                { status: 404 }
            );
        }

        const notifData = notifDoc.data();

        // Verify the notification belongs to this user
        if (notifData?.toEmail !== userEmail) {
            return NextResponse.json(
                { error: "Permission denied" },
                { status: 403 }
            );
        }

        // Get the share document
        const shareDoc = await adminDb
            .collection("shares")
            .doc(shareId)
            .get();

        if (!shareDoc.exists) {
            return NextResponse.json(
                { error: "Share not found" },
                { status: 404 }
            );
        }

        const shareData = shareDoc.data();
        const fileId = shareData?.fileId;

        if (!fileId) {
            return NextResponse.json(
                { error: "File ID not found in share" },
                { status: 400 }
            );
        }

        // Get the file document
        const fileDoc = await adminDb
            .collection("files")
            .doc(fileId)
            .get();

        if (!fileDoc.exists) {
            return NextResponse.json(
                { error: "File not found" },
                { status: 404 }
            );
        }

        const fileData = fileDoc.data();

        if (action === "accept") {
            // Create a sharedWithMe entry
            const sharedWithMeRef = adminDb.collection("sharedWithMe").doc();
            await sharedWithMeRef.set({
                fileId,
                shareId,
                ownerUid: uid,
                ownerEmail: fileData?.ownerUid ? (await auth().getUser(fileData.ownerUid)).email : null,
                fileName: fileData?.displayName || fileData?.originalName,
                fileSize: fileData?.size,
                contentType: fileData?.contentType,
                sharedAt: Timestamp.now(),
                accessCount: 0,
                expiresAt: fileData?.expiresAt || null,
            });

            // Update user's totalFilesReceived counter
            await adminDb
                .collection("users")
                .doc(uid)
                .set(
                    {
                        totalFilesReceived: (await adminDb.collection("users").doc(uid).get()).data()?.totalFilesReceived || 0 + 1,
                    },
                    { merge: true }
                );

            // Mark notification as delivered
            await adminDb
                .collection("notifications")
                .doc(notificationId)
                .update({
                    delivered: true,
                    deliveredAt: Timestamp.now(),
                });

            return NextResponse.json({
                success: true,
                message: "Share invitation accepted",
            });
        } else {
            // action === "reject"
            // Just delete the notification
            await adminDb
                .collection("notifications")
                .doc(notificationId)
                .delete();

            return NextResponse.json({
                success: true,
                message: "Share invitation rejected",
            });
        }
    } catch (error) {
        console.error("Error responding to notification:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
