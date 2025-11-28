import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/utils/firebase-admin";
import { auth } from "firebase-admin";

/*

    method: GET /api/statistics/overview
    Get statistics overview for the authenticated user
    - Files shared by user (including expired)
    - Files received by user (including expired)

*/

export async function GET(request: NextRequest) {
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
            console.error("token invalid", error);
            return NextResponse.json(
                { error: "Unauthorized - Invalid token" },
                { status: 401 }
            );
        }

        const uid = decodedToken.uid;

        // Get all files shared by the user
        const filesSnapshot = await adminDb
            .collection("files")
            .where("ownerUid", "==", uid)
            .where("revoked", "==", false)
            .get();

        const totalFilesShared = filesSnapshot.size;

        // Get all files received by the user (including expired)
        const sharedWithMeSnapshot = await adminDb
            .collection("sharedWithMe")
            .where("ownerUid", "==", uid)
            .get();

        const totalFilesReceived = sharedWithMeSnapshot.size;

        return NextResponse.json({
            filesShared: totalFilesShared,
            filesReceived: totalFilesReceived,
        });
    } catch (error) {
        console.error("please report these error messages to share lock team, to help us improve the stability", error);
        console.error("Error while fetching statistics:", {
            name: error instanceof Error ? error.name : "Unknown",
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined
        });
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
