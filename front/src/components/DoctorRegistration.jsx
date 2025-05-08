import React, { useState } from 'react';
import { generateRSAKeyPair } from '../utils/crypto';
import { useNavigate } from 'react-router-dom';
import { handleerror, handlesuccess } from '../pages/toast';

export default function DoctorRegistration() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        specialty: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Generate RSA key pair
            const keyPair = await generateRSAKeyPair();
            
            // Store private key in localStorage
            localStorage.setItem('doctorPrivateKey', keyPair.privateKey);

            // Register doctor with public key
            const response = await fetch('https://advaya-maatrcare-node.onrender.com/doctor/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    publicKey: keyPair.publicKey
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            handlesuccess('Registration successful! Redirecting to login...');
            setTimeout(() => navigate('/doctor/login'), 2000);
        } catch (error) {
            handleerror(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 to-green-200 py-8">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-6 text-green-700">Doctor Registration</h2>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Specialty
                        </label>
                        <input
                            type="text"
                            name="specialty"
                            value={formData.specialty}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full px-6 py-3 rounded-xl bg-orange-600 text-white text-lg font-medium shadow-lg relative overflow-hidden group ${
                            loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        <span className="absolute inset-0 bg-green-700 scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></span>
                        <span className="relative z-10 group-hover:text-white transition-colors duration-300">
                            {loading ? 'Registering...' : 'Register as Doctor'}
                        </span>
                    </button>
                </form>
            </div>
        </div>
    );
} 