export declare function decrypt(encryptedText: string, ivHex: string, authTagHex: string): string;
export declare function encrypt(text: string): {
    encryptedData: string;
    iv: string;
    authTag: string;
};
