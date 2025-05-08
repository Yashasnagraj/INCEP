import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { handleerror, handlesuccess } from "../pages/toast";
import { Search, User, FileText, Send, Check, ArrowLeft } from 'lucide-react';

export default function RequestAccess() {
    const navigate = useNavigate();
    const location = useLocation();
    const isDoctorRoute = location.pathname.includes('/doctor/');
    
    // Check if doctor is logged in when accessing from doctor route
    useEffect(() => {
        if (isDoctorRoute) {
            const token = localStorage.getItem('doctorToken');
            if (!token) {
                handleerror('Please login to request access to patient records');
                navigate('/doctor/login');
            }
        }
    }, [isDoctorRoute, navigate]);
    const [patients, setPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientFiles, setPatientFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Search patients by email
    const searchPatients = async () => {
        if (!searchTerm) return;
        
        try {
            const response = await axios.get(`/api/doctor/search-patients?email=${searchTerm}`);
            setPatients(response.data);
        } catch (error) {
            console.error('Error searching patients:', error);
        }
    };

    // Get patient's files when selected
    useEffect(() => {
        if (selectedPatient) {
            fetchPatientFiles();
        }
    }, [selectedPatient]);

    const fetchPatientFiles = async () => {
        try {
            const response = await axios.get(`/api/doctor/patient-files/${selectedPatient._id}`);
            setPatientFiles(response.data);
        } catch (error) {
            console.error('Error fetching patient files:', error);
        }
    };

    // Request access to a file
    const requestAccess = async (fileId) => {
        setLoading(true);
        setMessage('');

        try {
            await axios.post('/api/doctor/request-access', {
                patientId: selectedPatient._id,
                fileId,
                message: 'Requesting access to medical file'
            });
            setMessage('Access request sent successfully');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to send access request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto mt-10 p-6">
            <h2 className="text-2xl font-bold mb-6">Request Patient File Access</h2>

            {/* Patient Search */}
            <div className="mb-8">
                <div className="flex gap-4">
                    <input
                        type="email"
                        placeholder="Search patient by email"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 p-2 border rounded"
                    />
                    <button
                        onClick={searchPatients}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Search
                    </button>
                </div>

                {/* Patient List */}
                {patients.length > 0 && (
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-2">Search Results:</h3>
                        <div className="space-y-2">
                            {patients.map(patient => (
                                <div
                                    key={patient._id}
                                    onClick={() => setSelectedPatient(patient)}
                                    className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                                        selectedPatient?._id === patient._id ? 'bg-blue-50 border-blue-500' : ''
                                    }`}
                                >
                                    <p className="font-medium">{patient.name}</p>
                                    <p className="text-sm text-gray-600">{patient.email}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Patient Files */}
            {selectedPatient && (
                <div>
                    <h3 className="text-xl font-semibold mb-4">
                        Files for {selectedPatient.name}
                    </h3>

                    {message && (
                        <div className={`p-4 rounded mb-4 ${
                            message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                            {message}
                        </div>
                    )}

                    {patientFiles.length === 0 ? (
                        <p>No files available</p>
                    ) : (
                        <div className="space-y-4">
                            {patientFiles.map(file => (
                                <div key={file.id} className="p-4 border rounded">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium">{file.name}</p>
                                            <p className="text-sm text-gray-600">
                                                Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => requestAccess(file.id)}
                                            disabled={loading}
                                            className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
                                                loading ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                        >
                                            {loading ? 'Requesting...' : 'Request Access'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 