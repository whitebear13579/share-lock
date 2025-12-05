import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/utils/firebase-admin";
import { auth } from "firebase-admin";

/*

    method: GET /api/statistics/overview
    Get statistics overview for the authenticated user
    - Files shared by user (cumulative count from user document)
    - Files received by user (cumulative count from user document)

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

        const userDoc = await adminDb.collection("users").doc(uid).get();
        const userData = userDoc.data();

        const totalFilesShared = userData?.totalFilesShared || 0;
        const totalFilesReceived = userData?.totalFilesReceived || 0;

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
