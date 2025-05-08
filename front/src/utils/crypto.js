// Utility functions for cryptographic operations using Web Crypto API

// Generate RSA key pair
export const generateRSAKeyPair = async () => {
    try {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256",
            },
            true,
            ["encrypt", "decrypt"]
        );

        const publicKey = await window.crypto.subtle.exportKey(
            "spki",
            keyPair.publicKey
        );
        const privateKey = await window.crypto.subtle.exportKey(
            "pkcs8",
            keyPair.privateKey
        );

        return {
            publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKey))),
            privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKey)))
        };
    } catch (error) {
        console.error('Error generating RSA keys:', error);
        throw error;
    }
};

// Import public key from base64
export const importPublicKey = async (publicKeyStr) => {
    try {
        const binaryDer = str2ab(atob(publicKeyStr));
        
        return await window.crypto.subtle.importKey(
            "spki",
            binaryDer,
            {
                name: "RSA-OAEP",
                hash: "SHA-256"
            },
            true,
            ["encrypt"]
        );
    } catch (error) {
        console.error('Error importing public key:', error);
        throw error;
    }
};

// Import private key from base64
export const importPrivateKey = async (privateKeyStr) => {
    try {
        const binaryDer = str2ab(atob(privateKeyStr));
        
        return await window.crypto.subtle.importKey(
            "pkcs8",
            binaryDer,
            {
                name: "RSA-OAEP",
                hash: "SHA-256"
            },
            true,
            ["decrypt"]
        );
    } catch (error) {
        console.error('Error importing private key:', error);
        throw error;
    }
};

// Encrypt data using RSA public key
export const encryptWithRSA = async (publicKey, data) => {
    try {
        const encoded = new TextEncoder().encode(data);
        const encrypted = await window.crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            publicKey,
            encoded
        );
        return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    } catch (error) {
        console.error('Error encrypting with RSA:', error);
        throw error;
    }
};

// Decrypt data using RSA private key
export const decryptWithRSA = async (privateKey, encryptedData) => {
    try {
        let binaryDer;
        if (encryptedData instanceof ArrayBuffer) {
            binaryDer = encryptedData;
        } else if (typeof encryptedData === 'string') {
            binaryDer = str2ab(atob(encryptedData));
        } else if (encryptedData instanceof Uint8Array) {
            binaryDer = encryptedData.buffer;
        } else {
            throw new Error('Unsupported encrypted data format');
        }

        const decrypted = await window.crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            binaryDer
        );
        
        return new Uint8Array(decrypted);
    } catch (error) {
        console.error('Error decrypting with RSA:', error);
        throw error;
    }
};

// AES encryption
export const encryptWithAES = async (data, key, iv) => {
    try {
        const encodedData = new TextEncoder().encode(data);
        const importedKey = await window.crypto.subtle.importKey(
            "raw",
            key,
            { name: "AES-CBC" },
            false,
            ["encrypt"]
        );
        
        const encrypted = await window.crypto.subtle.encrypt(
            { name: "AES-CBC", iv },
            importedKey,
            encodedData
        );
        
        return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    } catch (error) {
        console.error('Error encrypting with AES:', error);
        throw error;
    }
};

// AES decryption
export const decryptWithAES = async (encryptedData, key, iv) => {
    try {
        const binaryData = str2ab(atob(encryptedData));
        const importedKey = await window.crypto.subtle.importKey(
            "raw",
            key,
            { name: "AES-CBC" },
            false,
            ["decrypt"]
        );
        
        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-CBC", iv },
            importedKey,
            binaryData
        );
        
        return new TextDecoder().decode(decrypted);
    } catch (error) {
        console.error('Error decrypting with AES:', error);
        throw error;
    }
};

// Generate random AES key and IV
export const generateAESKey = async () => {
    const key = await window.crypto.subtle.generateKey(
        { name: "AES-CBC", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
    
    const exportedKey = await window.crypto.subtle.exportKey("raw", key);
    const iv = window.crypto.getRandomValues(new Uint8Array(16));
    
    return {
        key: new Uint8Array(exportedKey),
        iv
    };
};

// Utility function to convert string to ArrayBuffer
function str2ab(str) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0; i < str.length; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
} 