const mongoose = require('mongoose');

const fileAccessSchema = new mongoose.Schema({
    cid: { type: String, required: true, unique: true },
    fileName: String,
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    allowedDoctors: [{
        doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
        encryptedKey: String,
        grantedAt: { type: Date, default: Date.now }
    }],
    uploadedAt: { type: Date, default: Date.now },
    revoked: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('FileAccess', fileAccessSchema); 