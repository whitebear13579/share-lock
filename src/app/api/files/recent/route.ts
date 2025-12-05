import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/utils/firebase-admin";
import { auth } from "firebase-admin";

/*

    method: GET /api/files/recent
    Get recent files accessed by the authenticated user

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

        // Get recent access logs for this user
        const accessLogsSnapshot = await adminDb
            .collection("accessLogs")
            .where("uid", "==", uid)
            .orderBy("at", "desc")
            .limit(20)
            .get();

        const fileIds = new Set<string>();
        const fileAccessMap = new Map<string, { at: Date; type: string }>();

        // Collect unique file IDs and their most recent access time
        accessLogsSnapshot.forEach((doc) => {
            const logData = doc.data();
            const fileId = logData.fileId;

            if (fileId && !fileAccessMap.has(fileId)) {
                fileAccessMap.set(fileId, {
                    at: logData.at?.toDate() || new Date(),
                    type: logData.type,
                });
                fileIds.add(fileId);
            }
        });

        if (fileIds.size === 0) {
            return NextResponse.json({ success: true, files: [] });
        }

        // Get file details for each unique file ID
        const recentFiles = await Promise.all(
            Array.from(fileIds).map(async (fileId) => {
                try {
                    const fileDoc = await adminDb
                        .collection("files")
                        .doc(fileId)
                        .get();

                    if (!fileDoc.exists) {
                        return null;
                    }

                    const fileData = fileDoc.data();
                    const accessInfo = fileAccessMap.get(fileId);

                    // Check if user owns the file or has shared access
                    const isOwner = fileData?.ownerUid === uid;
                    let hasAccess = isOwner;

                    if (!isOwner) {
                        const sharedWithMeSnapshot = await adminDb
                            .collection("sharedWithMe")
                            .where("fileId", "==", fileId)
                            .where("ownerUid", "==", uid)
                            .limit(1)
                            .get();

                        hasAccess = !sharedWithMeSnapshot.empty;
                    }

                    if (!hasAccess) {
                        return null;
                    }

                    return {
                        id: fileDoc.id,
                        name: fileData?.displayName || fileData?.originalName,
                        size: fileData?.size,
                        contentType: fileData?.contentType,
                        lastAccessedAt: accessInfo?.at?.toISOString() || null,
                        accessType: accessInfo?.type || "unknown",
                    };
                } catch (error) {
                    console.error(`Error fetching file ${fileId}:`, error);
                    return null;
                }
            })
        );

        // Filter out null values and sort by last accessed time
        const validFiles = recentFiles
            .filter((file) => file !== null)
            .sort((a, b) => {
                const aTime = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
                const bTime = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
                return bTime - aTime;
            })
            .slice(0, 10); // Return top 10 most recent

        return NextResponse.json({ success: true, files: validFiles });
    } catch (error) {
        console.error("Error fetching recent files:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
