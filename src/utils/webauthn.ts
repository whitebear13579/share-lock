const DISABLE_HTTPS_CHECK = false;
// disable HTTPS check for development purposes only

// check the browser support for WebAuthn or not
export const checkWebAuthnSupport = (): {
    supported: boolean;
    error?: string;
} => {
    if (typeof window === "undefined") {
        return { supported: false, error: "NOT BROWSER ENVIRONMENT!!!" };
    }

    if (!window.isSecureContext && !DISABLE_HTTPS_CHECK) {
        return {
            supported: false,
            error: "請使用 HTTPS 連線",
        };
    }

    if (!window.PublicKeyCredential) {
        return {
            supported: false,
            error: "您的瀏覽器不支援 WebAuthn",
        };
    }

    if (!navigator.credentials) {
        return {
            supported: false,
            error: "您的瀏覽器不支援 Credential Management API",
        };
    }

    return { supported: true };
};

// check the device has platform authenticator available (like Touch ID, Face ID, Windows Hello, samsung pass, etc)
export const checkPlatformAuthenticatorAvailable = async (): Promise<boolean> => {
    try {
        if (!window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) {
            return false;
        }

        return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (error) {
        console.error("check platform authenticator failed:", error);
        return false;
    }
};

const base64UrlEncode = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
};


const base64UrlDecode = (base64url: string): ArrayBuffer => {
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
};

// device authenticator registration
export const registerAuthenticator = async (
    shareId: string,
    userId: string,
    deviceLabel?: string
): Promise<{
    success: boolean;
    credentialId?: string;
    error?: string;
}> => {
    try {
        const support = checkWebAuthnSupport();
        if (!support.supported) {
            return {
                success: false,
                error: support.error || "您的裝置不支援 WebAuthn",
            };
        }

        if (!navigator.credentials || !navigator.credentials.create) {
            return {
                success: false,
                error: "您的瀏覽器不支援 Credential Management API",
            };
        }

        const startRes = await fetch("/api/webauthn/start-registration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shareId }),
        });

        if (!startRes.ok) {
            const errorData = await startRes.json();
            throw new Error(errorData.error || "無法擷取註冊選項");
        }

        const { options } = await startRes.json();

        const publicKeyOptions: PublicKeyCredentialCreationOptions = {
            challenge: base64UrlDecode(options.challenge),
            rp: options.rp,
            user: {
                id: base64UrlDecode(options.user.id),
                name: options.user.name,
                displayName: options.user.displayName,
            },
            pubKeyCredParams: options.pubKeyCredParams,
            timeout: options.timeout,
            authenticatorSelection: options.authenticatorSelection,
            attestation: options.attestation,
        };

        const credential = await navigator.credentials.create({
            publicKey: publicKeyOptions,
        }) as PublicKeyCredential | null;

        if (!credential) {
            throw new Error("憑證創建失敗");
        }

        const attestationResponse = credential.response as AuthenticatorAttestationResponse;

        const credentialData = {
            id: credential.id,
            rawId: base64UrlEncode(credential.rawId),
            response: {
                clientDataJSON: base64UrlEncode(attestationResponse.clientDataJSON),
                attestationObject: base64UrlEncode(attestationResponse.attestationObject),
            },
            type: credential.type,
            authenticatorAttachment: (credential as PublicKeyCredential & { authenticatorAttachment?: string }).authenticatorAttachment,
            clientExtensionResults: credential.getClientExtensionResults(),
        };

        const finishRes = await fetch("/api/webauthn/finish-registration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                shareId,
                credential: credentialData,
                deviceLabel,
                userId,
            }),
        });

        if (!finishRes.ok) {
            const errorData = await finishRes.json();
            throw new Error(errorData.error || "註冊驗證失敗");
        }

        const result = await finishRes.json();
        return result;
    } catch (error) {
        console.error("註冊認證器失敗:", error);

        let errorMessage = "註冊失敗";
        if (error instanceof Error) {
            if (error.name === "NotAllowedError") {
                errorMessage = "使用者取消或裝置不支援";
            } else if (error.name === "InvalidStateError") {
                errorMessage = "此認證器已被註冊";
            } else if (error.name === "NotSupportedError") {
                errorMessage = "此裝置不支援所需的認證器類型";
            } else if (error.name === "SecurityError") {
                errorMessage = "發生安全性問題";
            } else if (error.name === "AbortError") {
                errorMessage = "操作已取消";
            } else if (error.name === "TimeoutError") {
                errorMessage = "操作逾時";
            } else {
                errorMessage = error.message;
            }
        }

        return {
            success: false,
            error: errorMessage,
        };
    }
};

// device authenticator verification
export const verifyAuthenticator = async (
    shareId: string,
    userId: string
): Promise<{
    success: boolean;
    verified?: boolean;
    sessionToken?: string;
    error?: string;
}> => {
    try {
        const support = checkWebAuthnSupport();
        if (!support.supported) {
            return {
                success: false,
                verified: false,
                error: support.error || "您的裝置不支援 WebAuthn",
            };
        }

        if (!navigator.credentials || !navigator.credentials.get) {
            return {
                success: false,
                verified: false,
                error: "您的瀏覽器不支援 Credential Management API",
            };
        }

        const startRes = await fetch("/api/webauthn/start-assertion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shareId, userId }),
        });

        if (!startRes.ok) {
            const errorData = await startRes.json();
            throw new Error(errorData.error || "cannot fetch assertion options");
        }

        const { options } = await startRes.json();

        const publicKeyOptions: PublicKeyCredentialRequestOptions = {
            challenge: base64UrlDecode(options.challenge),
            rpId: options.rpId,
            timeout: options.timeout,
            allowCredentials: options.allowCredentials.map((cred: { id: string; type: string; transports?: string[] }) => ({
                id: base64UrlDecode(cred.id),
                type: cred.type as PublicKeyCredentialType,
                transports: cred.transports as AuthenticatorTransport[] | undefined,
            })),
            userVerification: options.userVerification as UserVerificationRequirement,
        };

        const credential = await navigator.credentials.get({
            publicKey: publicKeyOptions,
        }) as PublicKeyCredential | null;

        if (!credential) {
            throw new Error("驗證失敗!");
        }

        const assertionResponse = credential.response as AuthenticatorAssertionResponse;

        const credentialData = {
            id: credential.id,
            rawId: base64UrlEncode(credential.rawId),
            response: {
                clientDataJSON: base64UrlEncode(assertionResponse.clientDataJSON),
                authenticatorData: base64UrlEncode(assertionResponse.authenticatorData),
                signature: base64UrlEncode(assertionResponse.signature),
                userHandle: assertionResponse.userHandle
                    ? base64UrlEncode(assertionResponse.userHandle)
                    : undefined,
            },
            type: credential.type,
            authenticatorAttachment: (credential as PublicKeyCredential & { authenticatorAttachment?: string }).authenticatorAttachment,
            clientExtensionResults: credential.getClientExtensionResults(),
        };

        const finishRes = await fetch("/api/webauthn/finish-assertion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                shareId,
                credential: credentialData,
            }),
        });

        if (!finishRes.ok) {
            const errorData = await finishRes.json();
            throw new Error(errorData.error || "驗證失敗");
        }

        const result = await finishRes.json();
        return result;
    } catch (error) {
        console.error("金鑰驗證失敗:", error);

        let errorMessage = "金鑰驗證失敗";
        if (error instanceof Error) {
            if (error.name === "NotAllowedError") {
                errorMessage = "使用者取消或驗證逾時";
            } else if (error.name === "InvalidStateError") {
                errorMessage = "找不到可用的認證器";
            } else if (error.name === "NotSupportedError") {
                errorMessage = "此裝置不支援所需的認證器類型";
            } else if (error.name === "SecurityError") {
                errorMessage = "發生安全性問題";
            } else if (error.name === "AbortError") {
                errorMessage = "操作已取消";
            } else if (error.name === "TimeoutError") {
                errorMessage = "操作逾時";
            } else {
                errorMessage = error.message;
            }
        }

        return {
            success: false,
            verified: false,
            error: errorMessage,
        };
    }
};

export const getWebAuthnErrorMessage = (errorName: string): string => {
    switch (errorName) {
        case "NotAllowedError":
            return "使用者取消操作或瀏覽器不支援";
        case "InvalidStateError":
            return "認證器已註冊或無法使用";
        case "NotSupportedError":
            return "此裝置不支援所需的認證器類型";
        case "SecurityError":
            return "發生安全性問題";
        case "AbortError":
            return "操作已取消";
        case "TimeoutError":
            return "操作逾時";
        case "UnknownError":
            return "未知錯誤";
        default:
            return "金鑰驗證失敗";
    }
};
