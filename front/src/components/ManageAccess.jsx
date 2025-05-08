import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { encryptWithRSA, importPublicKey } from "../utils/crypto";
import { handleerror, handlesuccess } from "../pages/toast";
import { ArrowLeft, Lock, Upload, FileText, Download, Shield, User } from "lucide-react";
import axios from "axios";
import { ethers } from "ethers";
import IPFSStorageABI from "../contracts/IPFSStorageABI.json";

const CONTRACT_ADDRESS = "0x5e4eF91Fc8061B04815d35c582eAe944603c9bFe";

export default function ManageAccess() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState({});
    const [patientFiles, setPatientFiles] = useState([]);
    const [patientName, setPatientName] = useState('');
    
    // File upload states
    const [file, setFile] = useState(null);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [fileName, setFileName] = useState("");
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctors, setSelectedDoctors] = useState([]);
    
    // Handle back button click
    const handleBack = () => {
        navigate('/medical-records');
    };
    
    // Handle file upload
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return alert("Select a file first!");

        setIsUploading(true);

        try {
            const aesKey = await crypto.subtle.generateKey(
                { name: "AES-GCM", length: 256 },
                true,
                ["encrypt", "decrypt"]
            );

            const iv = crypto.getRandomValues(new Uint8Array(12));
            const fileBuffer = await file.arrayBuffer();
            const encryptedData = await crypto.subtle.encrypt(
                { name: "AES-GCM", iv },
                aesKey,
                fileBuffer
            );

            const rawAESKey = await crypto.subtle.exportKey("raw", aesKey);

            const formData = new FormData();
            const encryptedBlob = new Blob([
                iv,
                rawAESKey,
                new Uint8Array(encryptedData),
            ]);
            formData.append("file", encryptedBlob, file.name + ".enc");

            const res = await axios.post(
                "https://api.pinata.cloud/pinning/pinFileToIPFS",
                formData,
                {
                    headers: {
                        pinata_api_key: import.meta.env.VITE_PINATA_API_KEY,
                        pinata_secret_api_key: import.meta.env.VITE_PINATA_SECRET_API_KEY,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            const ipfsHash = res.data.IpfsHash;
            const fileUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

            // Store the AES key and IV in localStorage with IPFS hash
            const fileKeyData = {
                key: Array.from(new Uint8Array(rawAESKey)),
                iv: Array.from(iv),
            };
            localStorage.setItem(`fileKey_${ipfsHash}`, JSON.stringify(fileKeyData));

            if (window.ethereum) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                await window.ethereum.request({ method: "eth_requestAccounts" });
                const signer = await provider.getSigner();
                const contract = new ethers.Contract(
                    CONTRACT_ADDRESS,
                    IPFSStorageABI,
                    signer
                );
                await contract.storeFile(ipfsHash, file.name + ".enc");
            }

            // Register file in backend
            const token = localStorage.getItem("token");
            await fetch(
                "https://advaya-maatrcare-node.onrender.com/patient/register-file",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        cid: ipfsHash,
                        fileName: file.name,
                    }),
                }
            );

            const newEntry = {
                name: file.name,
                url: fileUrl,
                ipfsHash: ipfsHash,
                iv: btoa(String.fromCharCode(...iv)),
                encryptedKeys: await Promise.all(
                    selectedDoctors.map(async (doctorId) => {
                        const doctor = doctors.find((d) => d.id === Number(doctorId));
                        return {
                            doctorId: doctor.id,
                            encryptedKey: await encryptWithRSA(doctor.publicKey, rawAESKey),
                        };
                    })
                ),
                date: new Date().toLocaleString(),
            };

            // Update uploadedFiles state and localStorage
            setUploadedFiles((prev) => {
                const updated = [...prev, newEntry];
                localStorage.setItem("uploadedFiles", JSON.stringify(updated));
                return updated;
            });

            setFile(null);
            setFileName("");
            handlesuccess("File encrypted and uploaded successfully!");
            
            // Refresh patient files list
            fetchPatientFiles();
        } catch (err) {
            console.error("Error:", err);
            handleerror(err.message || "Error uploading file");
        } finally {
            setIsUploading(false);
        }
    };

    // Check if user is logged in and load data
    useEffect(() => {
        const token = localStorage.getItem('token');
        const name = localStorage.getItem('name');
        
        if (!token) {
            handleerror('Please login to manage access requests');
            localStorage.setItem('redirectAfterLogin', '/manage-access');
            navigate('/patient/login');
            return;
        }
        
        setPatientName(name || 'Patient');
        
        // Load uploaded files from localStorage
        const stored = localStorage.getItem("uploadedFiles");
        if (stored) {
            const files = JSON.parse(stored);
            // Ensure all files have ipfsHash
            const validFiles = files.map((file) => ({
                ...file,
                ipfsHash: file.ipfsHash || file.url.split("/").pop(), // Fallback to extract hash from URL if missing
            }));
            setUploadedFiles(validFiles);
            localStorage.setItem("uploadedFiles", JSON.stringify(validFiles)); // Update storage with fixed data
        }
        
        // Initialize demo doctors
        const initDoctors = async () => {
            const demoDoctors = [
                {
                    id: 1,
                    name: "Dr. Sarah Johnson",
                    specialization: "Cardiologist",
                    email: "sarah.johnson@example.com",
                    publicKey: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuScvAYCHLsjvvF0/jOiKWSIlQYYWGtYSxhKYZrFG9Cg7Ek2jR4YC6zILhRPhFcQJQnxvEnZGLdJsJJZrRHwZ4ZMkpxJRkuU0Q/mRtG5MHKktGZhOsLVHSJZKS+yfJxJDWGIZF4vKF/eFZ2xFjlGNpGqIKZC2CQHwXYoZ0sQXIVUj/xzjGWtEABEBJznmQtuXQCdrDQcYqiCGDv/Hy9jLJ1hHpNgemTZLrZcxnCLkLBrFQGRLUcUQbzQrJGwCjwZG7/QXbMOXUXEQfXUQ/GRtrWbkXKKHB+b1B5NTQy/8UBRe6WQROYL9DTvSZeYPKh1HRbBE9MYQlYm8/FTPW/OwUwIDAQAB",
                },
                {
                    id: 2,
                    name: "Dr. Michael Chen",
                    specialization: "Neurologist",
                    email: "michael.chen@example.com",
                    publicKey: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuScvAYCHLsjvvF0/jOiKWSIlQYYWGtYSxhKYZrFG9Cg7Ek2jR4YC6zILhRPhFcQJQnxvEnZGLdJsJJZrRHwZ4ZMkpxJRkuU0Q/mRtG5MHKktGZhOsLVHSJZKS+yfJxJDWGIZF4vKF/eFZ2xFjlGNpGqIKZC2CQHwXYoZ0sQXIVUj/xzjGWtEABEBJznmQtuXQCdrDQcYqiCGDv/Hy9jLJ1hHpNgemTZLrZcxnCLkLBrFQGRLUcUQbzQrJGwCjwZG7/QXbMOXUXEQfXUQ/GRtrWbkXKKHB+b1B5NTQy/8UBRe6WQROYL9DTvSZeYPKh1HRbBE9MYQlYm8/FTPW/OwUwIDAQAB",
                },
                {
                    id: 3,
                    name: "Dr. Emily Rodriguez",
                    specialization: "Pediatrician",
                    email: "emily.rodriguez@example.com",
                    publicKey: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuScvAYCHLsjvvF0/jOiKWSIlQYYWGtYSxhKYZrFG9Cg7Ek2jR4YC6zILhRPhFcQJQnxvEnZGLdJsJJZrRHwZ4ZMkpxJRkuU0Q/mRtG5MHKktGZhOsLVHSJZKS+yfJxJDWGIZF4vKF/eFZ2xFjlGNpGqIKZC2CQHwXYoZ0sQXIVUj/xzjGWtEABEBJznmQtuXQCdrDQcYqiCGDv/Hy9jLJ1hHpNgemTZLrZcxnCLkLBrFQGRLUcUQbzQrJGwCjwZG7/QXbMOXUXEQfXUQ/GRtrWbkXKKHB+b1B5NTQy/8UBRe6WQROYL9DTvSZeYPKh1HRbBE9MYQlYm8/FTPW/OwUwIDAQAB",
                },
            ];
            setDoctors(demoDoctors);
        };
        
        initDoctors();
        
        // Fetch data only if authenticated
        fetchRequests();
        fetchPatientFiles();
    }, [navigate]);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "https://advaya-maatrcare-node.onrender.com/patient/access-requests",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch requests");
      }

      const data = await response.json();
      setRequests(data);
    } catch (error) {
      handleerror(error.message);
    }
  };

  const fetchPatientFiles = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Fetching patient files...");
      const response = await fetch(
        "https://advaya-maatrcare-node.onrender.com/patient/files",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch files");
      }

      const data = await response.json();
      console.log("Fetched patient files:", data);
      setPatientFiles(data);
    } catch (error) {
      console.error("Error fetching patient files:", error);
      handleerror(error.message);
    }
  };

  const handleFileSelection = (requestId, fileId) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [requestId]: {
        ...prev[requestId],
        [fileId]: !prev[requestId]?.[fileId],
      },
    }));
  };

  // Handle request response (approve/reject)
  const handleRequest = async (requestId, status) => {
    setLoading(true);

    try {
      const request = requests.find((r) => r._id === requestId);
      const token = localStorage.getItem("token");

      if (status === "approved") {
        // Get selected files for this request
        const selectedFileIds = Object.entries(selectedFiles[requestId] || {})
          .filter(([_, isSelected]) => isSelected)
          .map(([fileId]) => fileId);

        console.log("Selected file IDs:", selectedFileIds);

        if (selectedFileIds.length === 0) {
          throw new Error("Please select at least one file to share");
        }

        // Validate doctor's public key
        if (!request.doctorId?.publicKey) {
          throw new Error(
            "Doctor's public key not found. Please ask the doctor to update their profile with a public key."
          );
        }

        // For each selected file
        const encryptedKeys = await Promise.all(
          selectedFileIds.map(async (fileId) => {
            console.log("Processing file:", fileId);
            const fileKeyStr = localStorage.getItem(`fileKey_${fileId}`);
            console.log("File key from localStorage:", fileKeyStr);

            if (!fileKeyStr) {
              // Try to get the key from the Records component's storage
              const uploadedFiles = JSON.parse(
                localStorage.getItem("uploadedFiles") || "[]"
              );
              const fileData = uploadedFiles.find((f) =>
                f.url.includes(fileId)
              );
              if (!fileData) {
                throw new Error(
                  `Encryption key not found for file ${fileId}. Please re-upload the file.`
                );
              }

              // Store the key in the correct format
              const key = new Uint8Array(12).fill(0); // Default key
              const iv = Uint8Array.from(atob(fileData.iv), (c) =>
                c.charCodeAt(0)
              );
              localStorage.setItem(
                `fileKey_${fileId}`,
                JSON.stringify({
                  key: Array.from(key),
                  iv: Array.from(iv),
                })
              );
            }

            let fileKey;
            try {
              fileKey = JSON.parse(fileKeyStr);
              console.log("Parsed file key:", fileKey);
            } catch (e) {
              console.error("Error parsing file key:", e);
              throw new Error(
                `Invalid key format for file ${fileId}. Please re-upload the file.`
              );
            }

            if (!fileKey.key || !fileKey.iv) {
              throw new Error(
                `Missing key or IV for file ${fileId}. Please re-upload the file.`
              );
            }

            // Convert key and IV from array format to Uint8Array
            const key = new Uint8Array(fileKey.key);
            const iv = new Uint8Array(fileKey.iv);

            // Import doctor's public key
            console.log("Doctor public key:", request.doctorId.publicKey);
            try {
              const doctorPublicKey = await importPublicKey(
                request.doctorId.publicKey
              );

              // Encrypt AES key with doctor's public key
              const encryptedKey = await encryptWithRSA(
                doctorPublicKey,
                JSON.stringify({
                  key: Array.from(key),
                  iv: Array.from(iv),
                })
              );

              console.log("Successfully encrypted key for file:", fileId);

              return {
                fileId,
                encryptedKey
              };
            } catch (e) {
              console.error("Error with public key:", e);
              throw new Error(
                "Invalid doctor public key format. Please ask the doctor to update their profile."
              );
            }
          })
        );

        console.log("All encrypted keys:", encryptedKeys);

        // Send approval with encrypted keys
        const response = await fetch(
          `https://advaya-maatrcare-node.onrender.com/patient/access-requests/${requestId}/respond`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              status,
              encryptedKeys,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to approve request");
        }
      } else {
        // Send rejection
        const response = await fetch(
          `https://advaya-maatrcare-node.onrender.com/patient/access-requests/${requestId}/respond`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to reject request");
        }
      }

      handlesuccess(`Request ${status} successfully`);
      // Remove the handled request from the list
      setRequests(requests.filter((r) => r._id !== requestId));
      // Clear selected files for this request
      setSelectedFiles((prev) => {
        const newState = { ...prev };
        delete newState[requestId];
        return newState;
      });
    } catch (error) {
      handleerror(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-green-200 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-green-700">
            Manage Access Requests
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {patientName}</span>
            <button 
              onClick={handleBack}
              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors px-3 py-1 border border-indigo-200 rounded-md"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Records
            </button>
          </div>
        </div>

        {requests.length === 0 ? (
          <p className="text-gray-600">No pending access requests</p>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => (
              <div
                key={request._id}
                className="bg-white rounded-lg shadow p-6 border border-gray-200"
              >
                <div className="flex flex-col space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-green-700">
                      Dr. {request.doctorId.name}
                    </h3>
                    <p className="text-gray-600">{request.doctorId.email}</p>
                    <p className="text-gray-600">
                      Specialty: {request.doctorId.specialization}
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Requested:{" "}
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                    {request.message && (
                      <p className="mt-2 text-gray-700 bg-gray-50 p-3 rounded">
                        Message: {request.message}
                      </p>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-700 mb-2">
                      Select files to share:
                    </h4>
                    <div className="space-y-2">
                      {patientFiles.length === 0 ? (
                        <p className="text-gray-500">
                          No files available to share
                        </p>
                      ) : (
                        patientFiles.map((file) => (
                          <label
                            key={file.cid}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              checked={
                                selectedFiles[request._id]?.[file.cid] || false
                              }
                              onChange={() =>
                                handleFileSelection(request._id, file.cid)
                              }
                              className="rounded text-green-600 focus:ring-green-500"
                            />
                            <span className="text-gray-700">
                              {file.fileName}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={() => handleRequest(request._id, "approved")}
                      disabled={loading || patientFiles.length === 0}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Processing..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleRequest(request._id, "rejected")}
                      disabled={loading}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Processing..." : "Reject"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
