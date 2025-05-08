import { ethers } from "ethers";
import IPFSStorageABI from "../contracts/IPFSStorageABI.json";
import FileAccessABI from "../contracts/FileAccessABI.json";

// Contract addresses
export const IPFS_STORAGE_CONTRACT_ADDRESS =
  "0x5e4eF91Fc8061B04815d35c582eAe944603c9bFe";
export const FILE_ACCESS_CONTRACT_ADDRESS =
  "0x0000000000000000000000000000000000000000"; // Replace with actual address when deployed

/**
 * Get an ethers provider
 * @returns {Promise<ethers.BrowserProvider>} The ethers provider
 */
export const getProvider = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }
  return new ethers.BrowserProvider(window.ethereum);
};

/**
 * Get a signer for transactions
 * @returns {Promise<ethers.Signer>} The ethers signer
 */
export const getSigner = async () => {
  const provider = await getProvider();
  await window.ethereum.request({ method: "eth_requestAccounts" });
  return provider.getSigner();
};

/**
 * Get the IPFS Storage contract instance
 * @returns {Promise<ethers.Contract>} The contract instance
 */
export const getIPFSStorageContract = async () => {
  const signer = await getSigner();
  return new ethers.Contract(
    IPFS_STORAGE_CONTRACT_ADDRESS,
    IPFSStorageABI,
    signer
  );
};

/**
 * Get the File Access contract instance
 * @returns {Promise<ethers.Contract>} The contract instance
 */
export const getFileAccessContract = async () => {
  const signer = await getSigner();
  return new ethers.Contract(
    FILE_ACCESS_CONTRACT_ADDRESS,
    FileAccessABI,
    signer
  );
};

/**
 * Store a file hash on the blockchain
 * @param {string} ipfsHash - The IPFS hash of the file
 * @param {string} fileName - The name of the file
 * @returns {Promise<ethers.TransactionResponse>} The transaction response
 */
export const storeFileOnBlockchain = async (ipfsHash, fileName) => {
  const contract = await getIPFSStorageContract();
  return contract.storeFile(ipfsHash, fileName);
};

/**
 * Get all files stored on the blockchain
 * @returns {Promise<Array>} Array of file objects
 */
export const getFilesFromBlockchain = async () => {
  const contract = await getIPFSStorageContract();
  return contract.getFiles();
};

/**
 * Add a file to the access control contract
 * @param {string} cid - The content ID (IPFS hash)
 * @returns {Promise<ethers.TransactionResponse>} The transaction response
 */
export const addFileToAccessControl = async (cid) => {
  const contract = await getFileAccessContract();
  return contract.addFile(cid);
};

/**
 * Grant access to a doctor for a specific file
 * @param {string} cid - The content ID (IPFS hash)
 * @param {string} doctorAddress - The doctor's Ethereum address
 * @returns {Promise<ethers.TransactionResponse>} The transaction response
 */
export const grantAccessToDoctor = async (cid, doctorAddress) => {
  const contract = await getFileAccessContract();
  return contract.grantAccess(cid, doctorAddress);
};

/**
 * Revoke access from a doctor for a specific file
 * @param {string} cid - The content ID (IPFS hash)
 * @param {string} doctorAddress - The doctor's Ethereum address
 * @returns {Promise<ethers.TransactionResponse>} The transaction response
 */
export const revokeAccessFromDoctor = async (cid, doctorAddress) => {
  const contract = await getFileAccessContract();
  return contract.revokeAccess(cid, doctorAddress);
};

/**
 * Check if a doctor has access to a specific file
 * @param {string} cid - The content ID (IPFS hash)
 * @param {string} doctorAddress - The doctor's Ethereum address
 * @returns {Promise<boolean>} Whether the doctor has access
 */
export const checkDoctorAccess = async (cid, doctorAddress) => {
  const contract = await getFileAccessContract();
  return contract.checkAccess(cid, doctorAddress);
};

/**
 * Verify a doctor (only contract owner can call this)
 * @param {string} doctorAddress - The doctor's Ethereum address
 * @returns {Promise<ethers.TransactionResponse>} The transaction response
 */
export const verifyDoctor = async (doctorAddress) => {
  const contract = await getFileAccessContract();
  return contract.verifyDoctor(doctorAddress);
};

/**
 * Check if an address is a verified doctor
 * @param {string} doctorAddress - The doctor's Ethereum address
 * @returns {Promise<boolean>} Whether the address is a verified doctor
 */
export const isVerifiedDoctor = async (doctorAddress) => {
  const contract = await getFileAccessContract();
  return contract.verifiedDoctors(doctorAddress);
};
