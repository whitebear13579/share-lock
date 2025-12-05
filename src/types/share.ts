import { Timestamp } from "firebase/firestore";

// share Mode
export type ShareMode = "device" | "account" | "pin" | "public";

// user data
export interface User {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    storageQuotaUsed: number; // bytes
    storageQuotaLimit: number; // bytes, maximum 1GB
    createdAt: Timestamp;
    lastLoginAt?: Timestamp;
    // Cumulative statistics (never decrease)
    totalFilesShared?: number; // Total files shared since account creation
    totalFilesReceived?: number; // Total files received since account creation
}

// files metadata
export interface FileMeta {
    id: string; // Firestore document ID
    ownerUid: string;
    originalName: string; // original file name
    displayName: string; // display name (editable)
    size: number; // bytes
    contentType: string; // MIME type
    storagePath: string; // Firebase Storage path
    downloadURL?: string;
    createdAt: Timestamp;
    expiresAt: Timestamp;
    maxDownloads: number;
    remainingDownloads: number;
    shareMode: ShareMode;
    pinHash?: string; // PIN mode's hashed PIN ( SHA-256 )
    boundAccountUid?: string; // account bound mode's bound account UID
    revoked: boolean;
    allowedAuthenticators: AuthenticatorInfo[]; // device mode's allowed WebAuthn authenticators list
}

// files
export interface ShareDoc {
    id: string; // shareId
    fileId: string; // related file ID
    ownerUid: string;
    createdAt: Timestamp;
    valid: boolean; // will set to false when the files has been bound to an account
    firstAccessAt?: Timestamp;
    lastAccessAt?: Timestamp;
}

// share with me files
export interface SharedWithMe {
    id: string; // file ID
    shareId: string; // related share ID
    fileId: string; // related file ID
    ownerUid: string;
    ownerEmail?: string; // for cached
    fileName: string; // for cached
    fileSize: number; // for cached
    contentType: string; // for cached
    sharedAt: Timestamp; // share time
    lastAccessedAt?: Timestamp;
    accessCount: number;
    expiresAt: Timestamp;
}

/*

    WebAuthn Authenticator Info

*/

export interface AuthenticatorInfo {
    credentialId: string; // Base64URL encoded credential ID
    credentialPublicKey: string; // Base64 encoded public key (COSE format)
    counter: number; // Signature counter
    aaguid?: string; // Authenticator AAGUID
    createdAt: Timestamp;
    lastUsedAt: Timestamp;
    userAgent?: string;
    deviceLabel?: string; // user's custom label
    transports?: ("internal" | "usb" | "nfc" | "ble")[];
    backupEligible?: boolean;
    backupState?: boolean;
}

/*

    files access log

*/

export interface AccessLog {
    id: string;
    type: "register" | "assert" | "download" | "access";
    fileId: string;
    uid?: string;
    deviceKey?: string;
    userAgent?: string;
    ipHash?: string; // hashed IP
    at: Timestamp;
    success: boolean;
    reason?: string; // failure reason
}

/*

    notification data

*/

export interface NotificationDoc {
    id: string;
    type: "share-invite" | "download-complete" | "share-expired";
    toEmail: string;
    fromUid?: string;
    shareId?: string;
    fileId?: string;
    message?: string;
    createdAt: Timestamp;
    delivered: boolean;
    deliveredAt?: Timestamp;
}

/*

    upload progress

*/

export interface UploadProgress {
    [fileId: string]: number; // 0-100
}

/*

    share settings (front-end used)

*/

export interface ShareSettings {
    displayName: string;
    expiresAt: Date;
    maxDownloads: number;
    shareMode: ShareMode;
    pin?: string;
    recipients: string[]; // Email list
}

/*

    API Request and Response Types

*/

// Login History API
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

export interface RecordLoginResponse {
    success: boolean;
    recordId?: string;
    error?: string;
    details?: string;
}

export interface LoginHistoryRequest {
    limit?: number;
}

export interface LoginHistoryResponse {
    success: boolean;
    records?: Array<{
        id: string;
        userId: string;
        attemptedEmail?: string;
        timestamp: {
            _seconds: number;
            _nanoseconds: number;
        };
        device: string;
        userAgent: string;
        ip: string;
        location: string;
        success: boolean;
        provider?: string;
        errorMessage?: string;
    }>;
    error?: string;
    details?: string;
}

// WebAuthn Registration (start registration)
export interface StartRegistrationRequest {
    shareId: string;
}

export interface StartRegistrationResponse {
    options: {
        challenge: string; // Base64URL encoded
        rp: {
            id: string;
            name: string;
        };
        user: {
            id: string; // Base64URL encoded
            name: string;
            displayName: string;
        };
        pubKeyCredParams: Array<{
            alg: number; // -7 (ES256) or -257 (RS256)
            type: "public-key";
        }>;
        timeout?: number;
        authenticatorSelection: {
            authenticatorAttachment: "platform";
            residentKey: "preferred" | "required" | "discouraged";
            requireResidentKey: boolean;
            userVerification: "required";
        };
        attestation: "none" | "direct" | "indirect";
    };
}

// WebAuthn Registration (finish registration)
export interface FinishRegistrationRequest {
    shareId: string;
    credential: {
        id: string;
        rawId: string; // Base64URL encoded
        response: {
            clientDataJSON: string; // Base64URL encoded
            attestationObject: string; // Base64URL encoded
        };
        type: "public-key";
        authenticatorAttachment?: "platform" | "cross-platform";
        clientExtensionResults?: Record<string, unknown>;
    };
    deviceLabel?: string;
}

export interface FinishRegistrationResponse {
    success: boolean;
    credentialId?: string;
    error?: string;
}

// WebAuthn Assertion (device verification)
export interface StartAssertionRequest {
    shareId: string;
}

export interface StartAssertionResponse {
    options: {
        challenge: string; // Base64URL encoded
        rpId: string;
        timeout?: number;
        allowCredentials: Array<{
            id: string; // Base64URL encoded credential ID
            type: "public-key";
            transports?: ("internal" | "usb" | "nfc" | "ble")[];
        }>;
        userVerification: "required";
    };
}

// WebAuthn Assertion (device verification finish)
export interface FinishAssertionRequest {
    shareId: string;
    credential: {
        id: string;
        rawId: string; // Base64URL encoded
        response: {
            clientDataJSON: string; // Base64URL encoded
            authenticatorData: string; // Base64URL encoded
            signature: string; // Base64URL encoded
            userHandle?: string; // Base64URL encoded
        };
        type: "public-key";
        authenticatorAttachment?: "platform" | "cross-platform";
        clientExtensionResults?: Record<string, unknown>;
    };
}

export interface FinishAssertionResponse {
    success: boolean;
    verified?: boolean;
    sessionToken?: string;
    error?: string;
}

export interface IssueDownloadUrlRequest {
    shareId: string;
    fileId: string;
    sessionToken?: string; // WebAuthn token
}

export interface IssueDownloadUrlResponse {
    url: string;
    remainingDownloads: number;
}

export interface VerifyAccessRequest {
    shareId: string;
    pin?: string; // PIN mode
    deviceKey?: string; // device mode
}

export interface VerifyAccessResponse {
    success: boolean;
    downloadId?: string;
    error?: string;
}

/*

    error types

*/

export type ErrorType =
    | "not-found"
    | "expired"
    | "revoked"
    | "no-downloads-left"
    | "invalid-pin"
    | "device-mismatch"
    | "account-mismatch"
    | "quota-exceeded"
    | "unauthenticated"
    | "permission-denied"
    | "unknown";

export interface AppError {
    type: ErrorType;
    message: string;
    details?: Record<string, unknown>;
}

/*

    constants

*/

export const CONSTANTS = {
    STORAGE_QUOTA_BYTES: 1024 * 1024 * 1024, // 1GB
    MAX_EXPIRY_DAYS: 14,
    MAX_RECIPIENTS: 10,
    PIN_LENGTH: 6,
    MAX_FILE_SIZE_BYTES: 300 * 1024 * 1024, // 300MB pre file upload limit
} as const;

/*

    some utility function types

*/

// format bytes
export type FormatBytesFunction = (bytes: number) => string;

// generate device key
export type GenerateDeviceKeyFunction = () => string;

// hash PIN
export type HashPinFunction = (pin: string) => Promise<string>;

// validate email
export type ValidateEmailFunction = (email: string) => boolean;

/*

    React Component Props

*/

// UploadFiles component
export interface UploadFilesProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (shareId: string, shareUrl: string) => void;
}

// SharePage component
export type SharePageProps = Record<string, never>;

// form validation
export interface ValidationResult {
    isValid: boolean;
    errors: {
        displayName?: string;
        expiresAt?: string;
        maxDownloads?: string;
        shareMode?: string;
        pin?: string;
        recipients?: string;
    };
}

// fire base query params
export interface QueryParams {
    limit?: number;
    orderBy?: string;
    order?: "asc" | "desc";
    startAfter?: unknown;
}

// paginated data
export interface PaginatedData<T> {
    items: T[];
    total: number;
    hasMore: boolean;
    nextCursor?: unknown;
}

// statistics data
export interface Statistics {
    totalFiles: number;
    totalShares: number;
    totalDownloads: number;
    storageUsed: number;
    activeShares: number;
    expiredShares: number;
}
