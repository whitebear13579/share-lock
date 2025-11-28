import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/utils/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/*

    method: POST /api/auth/record-login
    record user login attempts (success or failure)
    supports tracking by userId or attemptedEmail for failed logins

*/

export interface RecordLoginRequest {
    userId?: string;
    attemptedEmail?: string;
    device: string;
    userAgent: string;
    ip: string;
    location: string;
    success: boolean;
    provider?: string;
    errorMessage?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: RecordLoginRequest = await request.json();

        const {
            userId,
            attemptedEmail,
            device,
            userAgent,
            ip,
            location,
            success,
            provider,
            errorMessage
        } = body;

        // validate required fields
        if (!device || !userAgent || !ip || !location || typeof success !== 'boolean') {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const loginRecord: Record<string, unknown> = {
            userId: userId || 'anonymous',
            timestamp: FieldValue.serverTimestamp(),
            device,
            userAgent,
            ip,
            location,
            success
        };

        if (attemptedEmail) {
            loginRecord.attemptedEmail = attemptedEmail;
        }

        if (provider) {
            loginRecord.provider = provider;
        }

        if (errorMessage) {
            loginRecord.errorMessage = errorMessage;
        }

        const docRef = await adminDb.collection('loginHistory').add(loginRecord);

        return NextResponse.json({
            success: true,
            recordId: docRef.id
        });

    } catch (error) {
        console.error('Failed to record login via API:', error);

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
                error: 'Failed to record login',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
