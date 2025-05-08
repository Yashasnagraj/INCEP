import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  Upload,
  FileText,
  Download,
  Shield,
  Server,
  User,
  LogIn,
  Share2,
  Check,
  X,
  Bell,
} from "lucide-react";
import axios from "axios";
import { ethers } from "ethers";
import IPFSStorageABI from "../contracts/IPFSStorageABI.json";
import BackButton from "./BackButton";
import { handleerror, handlesuccess } from "../pages/toast";

const CONTRACT_ADDRESS = "0x5e4eF91Fc8061B04815d35c582eAe944603c9bFe";

const generateRSAKeyPair = async () => {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const [publicKey, privateKey] = await Promise.all([
    crypto.subtle.exportKey("spki", keyPair.publicKey),
    crypto.subtle.exportKey("pkcs8", keyPair.privateKey),
  ]);

  return {
    publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKey))),
    privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKey))),
  };
};

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [isDoctorMode, setIsDoctorMode] = useState(false);
  const [doctorPrivateKey, setDoctorPrivateKey] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchAccessRequests();

    const initDoctors = async () => {
      const demoDoctors = await Promise.all(
        Array.from({ length: 2 }, async (_, i) => ({
          ...(await generateRSAKeyPair()),
          id: i + 1,
          name: `Dr. ${String.fromCharCode(65 + i)}`,
        }))
      );
      setDoctors(demoDoctors);
    };
    initDoctors();
  }, []);

  const fetchAccessRequests = async () => {
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
        throw new Error("Failed to fetch access requests");
      }

      const data = await response.json();
      setAccessRequests(data);
    } catch (error) {
      handleerror(error.message);
    } finally {
      setLoading(false);
    }
  };

  const encryptWithRSA = async (publicKey, data) => {
    const importedKey = await crypto.subtle.importKey(
      "spki",
      Uint8Array.from(atob(publicKey), (c) => c.charCodeAt(0)),
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["encrypt"]
    );

    const encrypted = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      importedKey,
      data
    );

    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  };

  const decryptWithRSA = async (privateKey, encryptedData) => {
    const importedKey = await crypto.subtle.importKey(
      "pkcs8",
      Uint8Array.from(atob(privateKey), (c) => c.charCodeAt(0)),
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      importedKey,
      Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0))
    );

    return new Uint8Array(decrypted);
  };

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
        ipfsHash: ipfsHash, // Make sure ipfsHash is stored
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
      handlesuccess("File encrypted and shared!");
    } catch (err) {
      console.error("Error:", err);
      handleerror("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDoctorSelect = (doctorId) => {
    const selectedDoctor = doctors.find((d) => d.id === doctorId);
    if (selectedDoctor) {
      setSelectedDoctorId(doctorId);
      setDoctorPrivateKey(selectedDoctor.privateKey);
    }
  };

  const handleDoctorDecrypt = async (file) => {
    try {
      const doctor = doctors.find((d) => d.id === Number(selectedDoctorId));
      if (!doctor) throw new Error("Doctor not found");

      const keyEntry = file.encryptedKeys?.find(
        (k) => k.doctorId === doctor.id
      );
      if (!keyEntry) throw new Error("No access to this file");

      // Decrypt the AES key
      const decryptedAESKey = await decryptWithRSA(
        doctor.privateKey,
        keyEntry.encryptedKey
      );

      // Get the file content
      const res = await fetch(file.url);
      const buffer = await (await res.blob()).arrayBuffer();

      // Convert IV from base64 to Uint8Array
      const iv = Uint8Array.from(atob(file.iv), (c) => c.charCodeAt(0));

      // Import the decrypted AES key
      const aesKey = await crypto.subtle.importKey(
        "raw",
        decryptedAESKey,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
      );

      // Decrypt the file content
      const encryptedData = buffer.slice(12 + 32); // Skip IV and key in the stored file
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        aesKey,
        encryptedData
      );

      // Create download link
      const blob = new Blob([decrypted]);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = file.name;
      link.click();

      handlesuccess("File decrypted successfully!");
    } catch (err) {
      console.error("Decryption failed:", err);
      handleerror("Decryption failed. Please check your access permissions.");
    }
  };

  const handleFileSelection = (requestId, fileId) => {
    if (!requestId || !fileId) {
      console.error("Invalid requestId or fileId:", { requestId, fileId });
      return;
    }

    console.log("Handling file selection:", { requestId, fileId }); // Debug log

    setSelectedFiles((prev) => {
      const newState = {
        ...prev,
        [requestId]: {
          ...(prev[requestId] || {}),
          [fileId]: !prev[requestId]?.[fileId],
        },
      };
      console.log("Updated selection state:", newState); // Debug log
      return newState;
    });
  };

  const handleAccessRequest = async (requestId, status) => {
    try {
      if (status === "approved") {
        console.log("Current selectedFiles state:", selectedFiles); // Debug log

        // Get selected files for this request
        const selectedFileIds = Object.entries(selectedFiles[requestId] || {})
          .filter(([_, isSelected]) => isSelected)
          .map(([fileId]) => fileId)
          .filter((fileId) => fileId && fileId !== "undefined"); // Filter out undefined or invalid fileIds

        console.log("Selected file IDs:", selectedFileIds); // Debug log

        if (selectedFileIds.length === 0) {
          throw new Error("Please select at least one file to share");
        }

        const request = accessRequests.find((r) => r._id === requestId);
        if (!request || !request.doctorId?.publicKey) {
          throw new Error("Doctor's public key not found");
        }

        // For each selected file
        const encryptedKeys = await Promise.all(
          selectedFileIds.map(async (fileId) => {
            const file = uploadedFiles.find((f) => f.ipfsHash === fileId);
            if (!file) {
              console.error("File not found:", {
                fileId,
                availableFiles: uploadedFiles.map((f) => f.ipfsHash),
              });
              throw new Error(`File not found: ${fileId}`);
            }

            const fileKeyStr = localStorage.getItem(`fileKey_${file.ipfsHash}`);
            if (!fileKeyStr) {
              throw new Error(
                `Encryption key not found for file: ${file.name}`
              );
            }

            const fileKey = JSON.parse(fileKeyStr);
            if (!fileKey.key || !fileKey.iv) {
              throw new Error(`Missing key or IV for file: ${file.name}`);
            }

            // Convert array back to Uint8Array for encryption
            const keyArray = new Uint8Array(fileKey.key);

            try {
              // Encrypt AES key with doctor's public key
              const encryptedKey = await encryptWithRSA(
                request.doctorId.publicKey,
                keyArray
              );

              return {
                fileId: file.ipfsHash,
                encryptedKey,
                iv: fileKey.iv,
              };
            } catch (encryptError) {
              console.error("Encryption error:", encryptError);
              throw new Error(`Failed to encrypt key for file: ${file.name}`);
            }
          })
        );

        console.log("Encrypted keys:", encryptedKeys); // Debug log

        // Send approval with encrypted keys
        const token = localStorage.getItem("token");
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
              encryptedKeys: encryptedKeys.map(
                ({ fileId, encryptedKey, iv }) => ({
                  fileId,
                  encryptedKey,
                  iv,
                })
              ),
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to approve request");
        }

        // Update the uploadedFiles state to reflect the new access
        setUploadedFiles((prev) => {
          const updated = prev.map((file) => {
            if (selectedFileIds.includes(file.ipfsHash)) {
              const encryptedKeyData = encryptedKeys.find(
                (k) => k.fileId === file.ipfsHash
              );
              if (encryptedKeyData) {
                const newKey = {
                  doctorId: request.doctorId._id,
                  encryptedKey: encryptedKeyData.encryptedKey,
                  iv: encryptedKeyData.iv,
                };

                // Check if this doctor already has access
                const existingKeyIndex = file.encryptedKeys?.findIndex(
                  (k) => k.doctorId === request.doctorId._id
                );
                let updatedEncryptedKeys = [...(file.encryptedKeys || [])];

                if (existingKeyIndex >= 0) {
                  // Update existing key
                  updatedEncryptedKeys[existingKeyIndex] = newKey;
                } else {
                  // Add new key
                  updatedEncryptedKeys.push(newKey);
                }

                return {
                  ...file,
                  encryptedKeys: updatedEncryptedKeys,
                };
              }
            }
            return file;
          });
          localStorage.setItem("uploadedFiles", JSON.stringify(updated));
          return updated;
        });

        handlesuccess(`Access granted successfully`);
      } else {
        // Handle rejection
        const token = localStorage.getItem("token");
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
        handlesuccess(`Request rejected successfully`);
      }

      // Remove the handled request from the list
      setAccessRequests((prev) => prev.filter((r) => r._id !== requestId));
      // Clear selected files for this request
      setSelectedFiles((prev) => {
        const newState = { ...prev };
        delete newState[requestId];
        return newState;
      });
    } catch (error) {
      console.error("Access request error:", error);
      handleerror(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-4xl">
        <div className="mb-6 flex justify-between items-center">
          <BackButton />
          <button
            onClick={() => setIsDoctorMode(!isDoctorMode)}
            className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg"
          >
            {isDoctorMode ? (
              <User className="w-5 h-5" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            {isDoctorMode ? "Patient Mode" : "Doctor Mode"}
          </button>
        </div>

        {isDoctorMode ? (
          <div className="bg-white shadow-xl rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-pink-700 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" /> Doctor Access
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {doctors.map((doctor) => (
                  <button
                    key={doctor.id}
                    onClick={() => handleDoctorSelect(doctor.id)}
                    className={`p-3 rounded-lg border ${
                      selectedDoctorId === doctor.id
                        ? "border-pink-500 bg-pink-50"
                        : "border-pink-200 hover:border-pink-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{doctor.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(doctor.privateKey);
                          alert(`${doctor.name}'s private key copied!`);
                        }}
                        className="text-pink-400 hover:text-pink-600"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <input
                  type="password"
                  placeholder="Private key auto-filled"
                  className="w-full p-2 border border-pink-200 rounded-lg"
                  value={doctorPrivateKey}
                  readOnly
                />
                <p className="text-xs text-pink-400 mt-1">
                  Private key automatically filled for selected doctor
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-xl rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-pink-700 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" /> Patient Upload
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border-2 border-dashed border-pink-200 rounded-xl p-6 hover:border-pink-400 transition-colors cursor-pointer bg-pink-50">
                <input
                  type="file"
                  id="fileInput"
                  onChange={(e) => {
                    setFile(e.target.files[0]);
                    setFileName(e.target.files[0]?.name || "");
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="fileInput"
                  className="flex flex-col items-center cursor-pointer"
                >
                  <Upload className="w-10 h-10 text-pink-500 mb-2" />
                  <span className="text-pink-700 font-medium text-lg">
                    {fileName || "Choose a file"}
                  </span>
                </label>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-pink-700">
                  Share with Doctors:
                </label>
                <select
                  multiple
                  className="w-full p-2 border border-pink-200 rounded-lg h-32"
                  onChange={(e) =>
                    setSelectedDoctors(
                      [...e.target.selectedOptions].map((o) => o.value)
                    )
                  }
                >
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!file || isUploading}
                className={`w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 ${
                  !file || isUploading
                    ? "bg-pink-300 cursor-not-allowed"
                    : "bg-pink-600 hover:bg-pink-700"
                }`}
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Encrypting...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Secure Upload
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Access Requests Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-green-700 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" /> Access Requests
          </h2>
          {accessRequests.length === 0 ? (
            <p className="text-gray-500">No pending access requests</p>
          ) : (
            <div className="space-y-6">
              {accessRequests.map((request) => (
                <div key={request._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium text-lg">
                        Dr. {request.doctorId?.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {request.doctorId?.email}
                      </p>
                      <p className="text-sm text-gray-600">
                        Specialization: {request.doctorId?.specialization}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Requested:{" "}
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-700 mb-2">
                      Select files to share:
                    </h4>
                    <div className="space-y-2">
                      {uploadedFiles.map((file) => {
                        console.log("Rendering file:", {
                          name: file.name,
                          ipfsHash: file.ipfsHash,
                        }); // Debug log
                        return (
                          <label
                            key={`${request._id}-${file.ipfsHash}`}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              checked={
                                selectedFiles[request._id]?.[file.ipfsHash] ||
                                false
                              }
                              onChange={() => {
                                console.log("File selected:", {
                                  requestId: request._id,
                                  fileId: file.ipfsHash,
                                  fileName: file.name,
                                });
                                handleFileSelection(request._id, file.ipfsHash);
                              }}
                              className="rounded text-green-600 focus:ring-green-500"
                            />
                            <span className="text-gray-700">{file.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-4 pt-4 border-t">
                    <button
                      onClick={() =>
                        handleAccessRequest(request._id, "approved")
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      <Check className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() =>
                        handleAccessRequest(request._id, "rejected")
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-6">
          <h2 className="text-xl font-bold text-pink-700 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />{" "}
            {isDoctorMode ? "Shared Files" : "Your Files"}
          </h2>
          <div className="space-y-3">
            {uploadedFiles
              ?.filter((file) =>
                isDoctorMode
                  ? file?.encryptedKeys?.some(
                      (k) => k.doctorId === Number(selectedDoctorId)
                    )
                  : true
              )
              ?.map((file, i) => (
                <div
                  key={i}
                  className="bg-pink-50 rounded-lg p-4 border border-pink-100"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-pink-600" />
                      <span className="font-medium text-pink-700 truncate">
                        {file.name}
                      </span>
                    </div>
                    <span className="text-xs text-pink-400">{file.date}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-pink-600 hover:text-pink-800 flex items-center gap-1"
                    >
                      <Server className="w-3 h-3" /> IPFS Link
                    </a>
                    <button
                      onClick={() =>
                        isDoctorMode
                          ? handleDoctorDecrypt(file)
                          : (() => {
                              const link = document.createElement("a");
                              link.href = file.url;
                              link.download = file.name;
                              link.click();
                            })()
                      }
                      className="bg-pink-500 hover:bg-pink-600 text-white text-xs py-1 px-3 rounded-md flex items-center gap-1"
                    >
                      {isDoctorMode ? (
                        <>
                          <Lock className="w-3 h-3" /> Decrypt
                        </>
                      ) : (
                        <>
                          <Download className="w-3 h-3" /> Download
                        </>
                      )}
                    </button>
                  </div>
                  {!isDoctorMode && (
                    <div className="mt-2">
                      <span className="text-xs text-pink-500">
                        Authorized Doctors:
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {file.encryptedKeys?.map((k, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs"
                          >
                            {doctors.find((d) => d.id === k.doctorId)?.name ||
                              "Unknown"}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
