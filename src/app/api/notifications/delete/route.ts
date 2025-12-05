import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/utils/firebase-admin";
import { auth } from "firebase-admin";

/*

    method: DELETE /api/notifications/delete?notificationId=xxx
    Delete a notification

*/

export async function DELETE(request: NextRequest) {
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

        const { searchParams } = new URL(request.url);
        const notificationId = searchParams.get("notificationId");

        if (!notificationId) {
            return NextResponse.json(
                { error: "notificationId is required" },
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

        // Delete the notification
        await adminDb
            .collection("notifications")
            .doc(notificationId)
            .delete();

        return NextResponse.json({
            success: true,
            message: "Notification deleted",
        });
    } catch (error) {
        console.error("Error deleting notification:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
