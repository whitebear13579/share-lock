import CryptoJS from "crypto-js";

// pin hash
export const hashPin = (pin: string): string => {
    return CryptoJS.SHA256(pin).toString();
};

// pin verify
export const verifyPin = (pin: string, hashedPin: string): boolean => {
    const inputHash = hashPin(pin);
    return inputHash === hashedPin;
};

// generate 6-digit pin
export const generatePin = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// hash the pin with salt
export const hashPassword = (password: string, salt?: string): string => {
    const saltToUse = salt || CryptoJS.lib.WordArray.random(128 / 8).toString();
    const hash = CryptoJS.SHA256(password + saltToUse).toString();
    return `${hash}:${saltToUse}`;
};

// verify the password
export const verifyPassword = (password: string, hashedPassword: string): boolean => {
    const [hash, salt] = hashedPassword.split(":");
    if (!salt) return false;
    const newHash = CryptoJS.SHA256(password + salt).toString();
    return hash === newHash;
};

export const encryptAES = (data: string, key: string): string => {
    return CryptoJS.AES.encrypt(data, key).toString();
};

export const decryptAES = (encryptedData: string, key: string): string => {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return bytes.toString(CryptoJS.enc.Utf8);
};

// generate random access token
export const generateRandomToken = (length: number = 32): string => {
    return CryptoJS.lib.WordArray.random(length).toString();
};

// HMAC-SHA256 signature
export const signHMAC = (data: string, secret: string): string => {
    return CryptoJS.HmacSHA256(data, secret).toString();
};

// verify HMAC signature
export const verifyHMAC = (data: string, signature: string, secret: string): boolean => {
    const expectedSignature = signHMAC(data, secret);
    return signature === expectedSignature;
};
