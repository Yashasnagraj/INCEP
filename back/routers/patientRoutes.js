const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const AccessRequest = require('../models/accessRequest');
const FileAccess = require('../models/fileAccess');
const Doctor = require('../models/doctor');

// Authentication middleware
const authenticatePatient = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Apply authentication middleware
router.use(authenticatePatient);

// Get all access requests for the patient
router.get('/access-requests', async (req, res) => {
    try {
        const patientId = req.user.userId; // From your JWT token
        const requests = await AccessRequest.find({ 
            patientId,
            status: 'pending'
        }).populate('doctorId', 'name email specialization publicKey');

        // Validate that all doctors have public keys
        const validRequests = requests.filter(request => request.doctorId.publicKey);
        
        res.json(validRequests);
    } catch (error) {
        console.error('Error fetching access requests:', error);
        res.status(500).json({ message: 'Failed to fetch access requests', error: error.message });
    }
});

// Get patient's files
router.get('/files', async (req, res) => {
    try {
        const patientId = req.user.userId;
        const files = await FileAccess.find({ 
            patientId,
            revoked: { $ne: true }
        }).select('cid fileName uploadedAt');

        res.json(files);
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({ message: 'Failed to fetch files', error: error.message });
    }
});

// Register a new file
router.post('/register-file', async (req, res) => {
    try {
        const { cid, fileName } = req.body;
        const patientId = req.user.userId;

        // Check if file already exists
        const existingFile = await FileAccess.findOne({ cid });
        if (existingFile) {
            return res.status(400).json({ message: 'File already registered' });
        }

        // Create new file access record
        const fileAccess = new FileAccess({
            cid,
            fileName,
            patientId,
            allowedDoctors: []
        });

        await fileAccess.save();
        res.status(201).json({ message: 'File registered successfully', file: fileAccess });
    } catch (error) {
        console.error('Error registering file:', error);
        res.status(500).json({ message: 'Failed to register file', error: error.message });
    }
});

// Handle access request response (approve/reject)
router.post('/access-requests/:requestId/respond', async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status, encryptedKeys } = req.body;
        const patientId = req.user.userId;

        // Find the request
        const request = await AccessRequest.findOne({
            _id: requestId,
            patientId,
            status: 'pending'
        });

        if (!request) {
            return res.status(404).json({ message: 'Access request not found' });
        }

        // Update request status
        request.status = status;
        await request.save();

        if (status === 'approved' && encryptedKeys) {
            // Add encrypted keys to FileAccess documents
            await Promise.all(encryptedKeys.map(async ({ fileId, encryptedKey }) => {
                await FileAccess.findOneAndUpdate(
                    { cid: fileId, patientId },
                    { 
                        $push: { 
                            allowedDoctors: {
                                doctorId: request.doctorId,
                                encryptedKey
                            }
                        }
                    }
                );
            }));
        }

        res.json({ message: `Request ${status} successfully` });
    } catch (error) {
        console.error('Error handling access request:', error);
        res.status(500).json({ message: 'Failed to handle request', error: error.message });
    }
});

module.exports = router; 