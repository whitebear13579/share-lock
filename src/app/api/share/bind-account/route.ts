import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/utils/firebase-admin";

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

        await shareRef.update({
            boundUid: userId,
            boundAt: new Date(),
        });

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
