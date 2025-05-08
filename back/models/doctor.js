const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    publicKey: { type: String },
    specialization: { type: String },
    location: String,
    lat: Number,
    lng: Number,
    verified: { type: Boolean, default: false }
}, { timestamps: true });

// ✅ Safe model registration
module.exports = mongoose.models.Doctor || mongoose.model('Doctor', doctorSchema);
