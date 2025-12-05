import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/utils/firebase-admin";
import { auth } from "firebase-admin";

/*

    method: GET /api/notifications/list
    Get notifications for the authenticated user

*/

export async function GET(request: NextRequest) {
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

        // Get notifications for this user's email
        const notificationsSnapshot = await adminDb
            .collection("notifications")
            .where("toEmail", "==", userEmail)
            .orderBy("createdAt", "desc")
            .limit(50)
            .get();

        const notifications = await Promise.all(
            notificationsSnapshot.docs.map(async (doc) => {
                const notifData = doc.data();

                // Get sender info if fromUid exists
                let senderInfo = null;
                if (notifData.fromUid) {
                    try {
                        const senderUser = await auth().getUser(notifData.fromUid);
                        senderInfo = {
                            displayName: senderUser.displayName || "Unknown",
                            photoURL: senderUser.photoURL || null,
                            email: senderUser.email || null,
                        };
                    } catch (error) {
                        console.error("Error fetching sender info:", error);
                    }
                }

                // Get file info if fileId exists
                let fileInfo = null;
                if (notifData.fileId) {
                    try {
                        const fileDoc = await adminDb
                            .collection("files")
                            .doc(notifData.fileId)
                            .get();

                        if (fileDoc.exists) {
                            const fileData = fileDoc.data();
                            fileInfo = {
                                id: fileDoc.id,
                                displayName: fileData?.displayName || fileData?.originalName,
                                size: fileData?.size,
                                contentType: fileData?.contentType,
                                expiresAt: fileData?.expiresAt?.toDate?.()?.toISOString() || null,
                                shareMode: fileData?.shareMode,
                            };
                        }
                    } catch (error) {
                        console.error("Error fetching file info:", error);
                    }
                }

                return {
                    id: doc.id,
                    type: notifData.type,
                    message: notifData.message,
                    shareId: notifData.shareId,
                    fileId: notifData.fileId,
                    createdAt: notifData.createdAt?.toDate?.()?.toISOString() || null,
                    delivered: notifData.delivered,
                    deliveredAt: notifData.deliveredAt?.toDate?.()?.toISOString() || null,
                    senderInfo,
                    fileInfo,
                };
            })
        );

        return NextResponse.json({ success: true, notifications });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
