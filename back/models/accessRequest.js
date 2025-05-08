const mongoose = require('mongoose');

const accessRequestSchema = new mongoose.Schema({
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileId: { type: String }, // Optional: IPFS hash of the file if requesting specific file
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    message: { type: String }, // Optional message from doctor
    expiresAt: { type: Date }, // Optional expiration date for access
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Compound index to ensure one active request per doctor-patient combination
accessRequestSchema.index(
    { doctorId: 1, patientId: 1 },
    { unique: true, partialFilterExpression: { status: 'pending' } }
);

module.exports = mongoose.model('AccessRequest', accessRequestSchema); 