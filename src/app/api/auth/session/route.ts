import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/utils/firebase-admin";
import { cookies } from "next/headers";

/*
    API endpoints for managing authentication sessions

    POST /api/auth/session - Create a session cookie from Firebase ID token
    DELETE /api/auth/session - Clear the session cookie (logout)
    GET /api/auth/session - Verify current session and return user info
*/

const SESSION_COOKIE_NAME = "__session";
const SESSION_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 5,
};

export async function POST(request: NextRequest) {
    try {
        const { idToken } = await request.json();

        if (!idToken) {
            return NextResponse.json(
                { error: "ID token is required" },
                { status: 400 }
            );
        }

        const decodedToken = await adminAuth.verifyIdToken(idToken);

        // Create a session cookie
        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        const sessionCookie = await adminAuth.createSessionCookie(idToken, {
            expiresIn,
        });

        // Set the cookie
        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, SESSION_COOKIE_OPTIONS);

        return NextResponse.json({
            success: true,
            uid: decodedToken.uid,
        });
    } catch (error) {
        console.error("Session creation error:", error);
        return NextResponse.json(
            { error: "Failed to create session" },
            { status: 401 }
        );
    }
}

// Clear session cookie (logout)
export async function DELETE() {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

        // Revoke the session if it exists
        if (sessionCookie) {
            try {
                const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
                await adminAuth.revokeRefreshTokens(decodedClaims.uid);
            } catch {
                // Session might already be invalid, continue with deletion
            }
        }

        // Delete the cookie
        cookieStore.delete(SESSION_COOKIE_NAME);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Session deletion error:", error);
        return NextResponse.json(
            { error: "Failed to delete session" },
            { status: 500 }
        );
    }
}

// Verify current session and return user info
export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

        if (!sessionCookie) {
            return NextResponse.json(
                { authenticated: false },
                { status: 401 }
            );
        }

        // Verify the session cookie
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

        return NextResponse.json({
            authenticated: true,
            uid: decodedClaims.uid,
            email: decodedClaims.email,
        });
    } catch (error) {
        console.error("Session verification error:", error);
        return NextResponse.json(
            { authenticated: false },
            { status: 401 }
        );
    }
}
