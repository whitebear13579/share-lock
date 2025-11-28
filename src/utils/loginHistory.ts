import { Timestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';

export interface LoginRecord {
    id: string;
    userId: string;
    attemptedEmail?: string;
    timestamp: Timestamp;
    device: string;
    userAgent: string;
    ip: string;
    location: string;
    success: boolean;
    provider?: string;
    errorMessage?: string;
}

export interface LoginRecordInput {
    device: string;
    userAgent: string;
    ip: string;
    location: string;
    success: boolean;
    provider?: string;
    errorMessage?: string;
}

export const getDeviceInfo = (): { device: string; userAgent: string } => {
    if (typeof window === 'undefined') {
        return { device: 'Server', userAgent: 'Server' };
    }

    const userAgent = navigator.userAgent;
    let device = 'Unknown Device';

    const os = (() => {
        if (userAgent.includes('Windows NT 10.0')) return 'Windows 11';
        if (userAgent.includes('Windows NT')) return 'Windows';
        if (userAgent.includes('Mac OS X')) return 'MacOS';
        if (userAgent.includes('iPhone')) return 'iPhone';
        if (userAgent.includes('iPad')) return 'iPad';
        if (userAgent.includes('Android')) return 'Android';
        if (userAgent.includes('Linux')) return 'Linux';
        if (userAgent.includes('Ubuntu')) return 'Ubuntu';
        return 'Unknown OS';
    })();

    const browser = (() => {
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
        if (userAgent.includes('Edg')) return 'Edge';
        if (userAgent.includes('Opera')) return 'Opera';
        return 'Unknown Browser';
    })();

    device = `${browser} on ${os}`;
    return { device, userAgent };
};

export const getLocationInfo = async (): Promise<{ ip: string; location: string }> => {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        return {
            ip: data.ip || 'Unknown',
            location: `${data.city || '未知'}, ${data.country_name || '未知'}`
        };
    } catch (error) {
        console.error('Failed to get location info:', error);
        return {
            ip: 'Unknown',
            location: '未知位置'
        };
    }
};

export const recordLogin = async (
    user: User | null,
    success: boolean,
    provider?: string,
    errorMessage?: string,
    attemptedEmail?: string
): Promise<void> => {
    try {
        const { device, userAgent } = getDeviceInfo();
        const { ip, location } = await getLocationInfo();

        const loginData = {
            userId: user ? user.uid : undefined,
            attemptedEmail: attemptedEmail,
            device,
            userAgent,
            ip,
            location,
            success,
            ...(provider && { provider }),
            ...(errorMessage && { errorMessage })
        };

        const response = await fetch('/api/auth/record-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API error: ${errorData.error || 'Unknown error'}`);
        }

        const result = await response.json();
    } catch (error) {
        console.error('Failed to record login:', error);
        if (error instanceof Error) {
            console.error("Please send the following messages to the sharelock team to help us imporve stability:")
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
    }
};

export const getUserLoginHistory = async (
    userId: string,
    idToken: string,
    limitCount: number = 50
): Promise<LoginRecord[]> => {
    try {
        const response = await fetch(`/api/auth/login-history?limit=${limitCount}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API error: ${errorData.error || 'Unknown error'}`);
        }

        const result = await response.json();

        const records: LoginRecord[] = result.records.map((record: unknown) => {
            const rec = record as { timestamp?: { _seconds?: number; _nanoseconds?: number } };
            return {
                ...(record as LoginRecord),
                timestamp: rec.timestamp?._seconds
                    ? new Timestamp(rec.timestamp._seconds, rec.timestamp._nanoseconds || 0)
                    : (rec.timestamp as Timestamp)
            };
        });

        return records;
    } catch (error) {
        console.error("Please send the following messages to the sharelock team to help us improve stability:")
        console.error('Failed to get login history:', error);

        if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
        }

        return [];
    }
};

export const getRecentLoginRecord = async (userId: string, idToken: string): Promise<LoginRecord | null> => {
    try {
        const records = await getUserLoginHistory(userId, idToken, 1);
        return records.length > 0 ? records[0] : null;
    } catch (error) {
        console.error("Please send the following messages to the sharelock team to help us improve stability:")
        console.error('Failed to get recent login record:', error);
        return null;
    }
};
