const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Doctor = require('../models/doctor');
const AccessRequest = require('../models/accessRequest');
const FileAccess = require('../models/fileAccess');
const User = require('../models/user');
const mongoose = require('mongoose');

// Public routes (no auth required)
// Doctor registration
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, publicKey, specialty, location, lat, lng } = req.body;
        
        // Check if doctor already exists
        const existingDoctor = await Doctor.findOne({ email });
        if (existingDoctor) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new doctor
        const doctor = new Doctor({
            name,
            email,
            password: hashedPassword,
            publicKey,
            specialization: specialty,
            location,
            lat,
            lng
        });

        await doctor.save();
        res.status(201).json({ message: 'Doctor registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Doctor login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const doctor = await Doctor.findOne({ email });
        if (!doctor) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, doctor.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { 
                id: doctor._id, 
                email: doctor.email, 
                role: 'doctor',
                name: doctor.name
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ 
            token, 
            doctor: { 
                id: doctor._id, 
                name: doctor.name, 
                email: doctor.email,
                specialization: doctor.specialization
            } 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Authentication middleware for protected routes
const authenticateDoctor = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'doctor') {
            return res.status(403).json({ message: 'Not authorized as doctor' });
        }

        const doctor = await Doctor.findById(decoded.id);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

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

// Apply authentication middleware for protected routes
router.use(authenticateDoctor);

// Protected routes below this line
// Request access to patient file
router.post('/request-access', async (req, res) => {
    try {
        const { patientId, message, fileId } = req.body;
        const doctorId = req.user.id;

        // Validate patientId
        if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({ message: 'Invalid patient ID format' });
        }

        // Check if patient exists
        const patient = await User.findById(patientId);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Check if request already exists
        const existingRequest = await AccessRequest.findOne({
            doctorId,
            patientId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'Access request already pending for this patient' });
        }

        const request = new AccessRequest({
            doctorId,
            patientId,
            message: message || 'Requesting access to medical records',
            fileId: fileId || null, // Handle optional fileId
            status: 'pending'
        });

        await request.save();
        res.status(201).json({ message: 'Access request sent successfully' });
    } catch (error) {
        console.error('Request access error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get doctor's access requests
router.get('/requests', async (req, res) => {
    try {
        const doctorId = req.user.id;
        const requests = await AccessRequest.find({ doctorId })
            .populate('patientId', 'name email')
            .sort('-createdAt');
        
        res.json(requests);
    } catch (error) {
        console.error('Fetch requests error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get doctor's access keys
router.get('/access-keys', async (req, res) => {
    try {
        const doctorId = req.user.id;
        const files = await FileAccess.find({ 
            'allowedDoctors.doctorId': doctorId,
            revoked: { $ne: true }
        }).populate('patientId', 'name email');
        
        console.log('Found files:', files); // Debug log
        res.json(files);
    } catch (error) {
        console.error('Fetch access keys error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get doctor profile
router.get('/profile', async (req, res) => {
    try {
        const doctorId = req.user.id;
        const doctor = await Doctor.findById(doctorId).select('-password');
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        res.json(doctor);
    } catch (error) {
        console.error('Fetch profile error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update doctor's public key
router.post('/update-key', async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { publicKey } = req.body;

        if (!publicKey) {
            return res.status(400).json({ message: 'Public key is required' });
        }

        const doctor = await Doctor.findByIdAndUpdate(
            doctorId,
            { publicKey },
            { new: true }
        );

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        res.json({ message: 'Public key updated successfully' });
    } catch (error) {
        console.error('Update key error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all patients
router.get('/patients', async (req, res) => {
    try {
        const patients = await User.find({})
            .select('name email')
            .sort('name');
        res.json(patients);
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router; 