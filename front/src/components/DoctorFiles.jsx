import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { decryptWithRSA, importPrivateKey } from '../utils/crypto';
import { handleerror, handlesuccess } from '../pages/toast';

// Helper to decode base64 if needed
function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * A React component that displays a list of files approved for the logged-in doctor.
 * The component fetches approved files from the server and allows the doctor to
 * download them. It manages state for loading, downloading, and the list of files.
 * 
 * The component utilizes the doctor's credentials to fetch and decrypt files securely.
 * It handles errors and displays appropriate messages using toast notifications.
 */

/*******  f2dfd8ba-1ee1-4145-9b0f-c8b7cc899f09  *******/export default function DoctorFiles() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const navigate = useNavigate();

    // Check if doctor is logged in
    useEffect(() => {
        const token = localStorage.getItem('doctorToken');
        if (!token) {
            handleerror('Please login to access patient files');
            navigate('/doctor/login');
        }
    }, [navigate]);

    useEffect(() => {
        fetchApprovedFiles();
    }, []);

    const fetchApprovedFiles = async () => {
        try {
            const token = localStorage.getItem('doctorToken');
            const response = await fetch('https://advaya-maatrcare-node.onrender.com/doctor/access-keys', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch approved files');
            }

            const data = await response.json();
            console.log('Fetched files:', data);
            setFiles(data);
        } catch (error) {
            console.error('Error fetching files:', error);
            handleerror(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (file) => {
        try {
            setDownloading(true);
            
            const doctorId = localStorage.getItem('doctorId');
            const doctorPrivateKeyStr = localStorage.getItem('doctorPrivateKey');

            if (!doctorId || !doctorPrivateKeyStr) {
                throw new Error('Doctor credentials not found. Please log in again.');
            }

            const privateKey = await importPrivateKey(doctorPrivateKeyStr);

            const keyEntry = file.allowedDoctors.find(d => d.doctorId === doctorId);
            if (!keyEntry) {
                throw new Error('No access to this file');
            }

            console.log('Encrypted key:', keyEntry.encryptedKey);
            console.log('Key type:', typeof keyEntry.encryptedKey);

            // Decrypt the AES key
            const decryptedKeyData = await decryptWithRSA(privateKey, keyEntry.encryptedKey);
            if (!decryptedKeyData) {
                throw new Error('Failed to decrypt the file key');
            }

            console.log('Decrypted key length:', decryptedKeyData.length);
            console.log('Key bytes:', Array.from(decryptedKeyData).map(b => b.toString(16).padStart(2, '0')).join(' '));

            // Import the key for AES decryption
            const aesKey = await crypto.subtle.importKey(
                "raw",
                decryptedKeyData,
                { name: "AES-GCM" },
                false,
                ["decrypt"]
            );

            // Get the file content
            const response = await fetch(`https://gateway.pinata.cloud/ipfs/${file.cid}`);
            if (!response.ok) {
                throw new Error('Failed to fetch file from IPFS');
            }

            const encryptedFile = await response.arrayBuffer();
            console.log('File size:', encryptedFile.byteLength);

            // The file structure is: [12 bytes IV][32 bytes AES key][rest is encrypted content]
            const fileIV = new Uint8Array(encryptedFile.slice(0, 12));
            // Skip the stored AES key since we have our own decrypted key
            const encryptedContent = new Uint8Array(encryptedFile.slice(12 + 32)); // Skip IV and stored key

            console.log('IV length:', fileIV.length);
            console.log('IV:', Array.from(fileIV).map(b => b.toString(16).padStart(2, '0')).join(' '));
            console.log('Content length:', encryptedContent.length);

            // Decrypt the file content
            const decryptedContent = await crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: fileIV,
                    tagLength: 128 // Standard AES-GCM tag length
                },
                aesKey,
                encryptedContent.buffer
            );

            // Create and trigger download
            const blob = new Blob([decryptedContent]);
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = file.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);

            handlesuccess('File downloaded successfully');
        } catch (error) {
            console.error('Download error:', error);
            handleerror(error.message);
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 to-green-200 p-8">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 text-green-700">My Approved Files</h2>
                
                {files.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <p className="text-gray-500">No approved files available</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {files.map(file => (
                            <div key={file.cid} className="bg-white rounded-lg shadow-lg p-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-medium text-lg">{file.fileName}</h3>
                                        <p className="text-sm text-gray-500">
                                            Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDownload(file)}
                                        disabled={downloading}
                                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                                    >
                                        {downloading ? 'Downloading...' : 'Download'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}