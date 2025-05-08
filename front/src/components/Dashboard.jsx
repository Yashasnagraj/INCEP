import React from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "./Socket";

const Dashboard = () => {
  const navigate = useNavigate();
  const socket = useSocket();

  const handleRequestConsultation = () => {
    navigate("/request-consultation");
  };

  const handleDoctorLogin = () => {
    navigate("/doctor/login");
  };

  const handleJoinConsultation = () => {
    // You can implement a modal or form to enter room ID
    const roomId = prompt("Enter consultation room ID:");
    if (roomId) {
      navigate(`/consultation/${roomId}`);
    }
  };

  const handleMedicalRecords = () => {
    navigate("/medical-records");
  };

  const handleRequestAccess = () => {
    navigate("/request-access");
  };
  
  const handleManageAccess = () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      navigate("/manage-access");
    } else {
      // Store the intended destination for after login
      localStorage.setItem('redirectAfterLogin', '/manage-access');
      navigate("/patient/login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Tele-Mine Dashboard
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Welcome to your medical consultation platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Request Consultation Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Request Consultation
            </h2>
            <p className="text-gray-600 mb-6">
              Need medical advice? Request a consultation with our doctors.
            </p>
            <button
              onClick={handleRequestConsultation}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Request Now
            </button>
          </div>

          {/* Doctor Login Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Doctor Portal
            </h2>
            <p className="text-gray-600 mb-6">
              Are you a doctor? Login to access your dashboard and patient records.
            </p>
            <button
              onClick={handleDoctorLogin}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              Doctor Login
            </button>
          </div>

          {/* Join Consultation Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Join Consultation
            </h2>
            <p className="text-gray-600 mb-6">
              Have a consultation ID? Join your scheduled consultation.
            </p>
            <button
              onClick={handleJoinConsultation}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 transition-colors"
            >
              Join Now
            </button>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-6">
          Medical Records Management
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Patient Medical Records Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Patient Records
            </h2>
            <p className="text-gray-600 mb-6">
              Access and manage your blockchain-secured medical records. Upload
              new records and control who can access them.
            </p>
            <button
              onClick={handleMedicalRecords}
              className="w-full bg-teal-600 text-white py-3 px-4 rounded-md hover:bg-teal-700 transition-colors"
            >
              View Records
            </button>
          </div>

          {/* Request Access Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Request Patient Records
            </h2>
            <p className="text-gray-600 mb-6">
              Doctors can request access to patient medical records with proper
              authorization and consent.
            </p>
            <button
              onClick={handleRequestAccess}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Request Access
            </button>
          </div>
          
          {/* Manage Access Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Manage Access Requests
            </h2>
            <p className="text-gray-600 mb-6">
              Review and manage access requests to your medical records.
            </p>
            <button
              onClick={handleManageAccess}
              className="w-full bg-amber-600 text-white py-3 px-4 rounded-md hover:bg-amber-700 transition-colors"
            >
              Manage Access
            </button>
          </div>
        </div>

        {/* Quick Stats Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Quick Stats
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">
                Active Consultations
              </h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">
                Pending Requests
              </h3>
              <p className="text-3xl font-bold text-yellow-600 mt-2">0</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">
                Completed Today
              </h3>
              <p className="text-3xl font-bold text-green-600 mt-2">0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
