import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/utils/firebase-admin';
import { adminAuth } from '@/utils/firebase-admin';

/*

    method: GET /api/auth/login-history
    fetch user login history
    requires Bearer token authentication
    returns records matching userId or attemptedEmail

*/

export interface LoginHistoryRequest {
    limit?: number;
}

export async function GET(request: NextRequest) {
    try {
        // Get authorization header
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const idToken = authHeader.split('Bearer ')[1];

        // Verify the ID token
        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(idToken);
        } catch (error) {
            console.error('Invalid token:', error);
            return NextResponse.json(
                { success: false, error: 'Invalid token' },
                { status: 401 }
            );
        }

        const userId = decodedToken.uid;
        const userEmail = decodedToken.email;
        const searchParams = request.nextUrl.searchParams;
        const limitCount = parseInt(searchParams.get('limit') || '50', 10);

        const queries = [];

        queries.push(
            adminDb
                .collection('loginHistory')
                .where('userId', '==', userId)
                .get()
        );

        if (userEmail) {
            queries.push(
                adminDb
                    .collection('loginHistory')
                    .where('attemptedEmail', '==', userEmail)
                    .get()
            );
        }

        const snapshots = await Promise.all(queries);

        const recordsMap = new Map();

        snapshots.forEach(snapshot => {
            snapshot.docs.forEach(doc => {
                if (!recordsMap.has(doc.id)) {
                    const data = doc.data();
                    recordsMap.set(doc.id, {
                        id: doc.id,
                        ...data
                    });
                }
            });
        });

        const records = Array.from(recordsMap.values())
            .sort((a, b) => {
                // Handle Firestore Timestamp format
                const aTime = a.timestamp?._seconds || a.timestamp?.seconds || 0;
                const bTime = b.timestamp?._seconds || b.timestamp?.seconds || 0;
                return bTime - aTime;
            })
            .slice(0, limitCount);

        return NextResponse.json({
            success: true,
            records
        });

    } catch (error) {
        console.error('Failed to fetch login history via API:', error);

        if (error instanceof Error) {
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch login history',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
