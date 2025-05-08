import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, User, Send, ArrowLeft } from "lucide-react";
import { handleerror, handlesuccess } from "../pages/toast";
import { generateRSAKeyPair } from "../utils/crypto";
import BackButton from "./BackButton";

export default function DoctorRecordRequest() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // In a real app, fetch patients from your backend
    // For demo purposes, we'll use mock data
    const mockPatients = [
      { id: "1", name: "John Doe", email: "john@example.com" },
      { id: "2", name: "Jane Smith", email: "jane@example.com" },
      { id: "3", name: "Robert Johnson", email: "robert@example.com" },
    ];
    setPatients(mockPatients);
    setLoading(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPatient || !reason) {
      handleerror(
        "Please select a patient and provide a reason for your request"
      );
      return;
    }

    setSubmitting(true);

    try {
      // Generate RSA key pair for secure file sharing
      const keyPair = await generateRSAKeyPair();

      // Store the private key securely (in a real app, this should be better secured)
      localStorage.setItem("doctorPrivateKey", keyPair.privateKey);

      // In a real app, send this request to your backend
      // For demo purposes, we'll simulate a successful request

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      handlesuccess("Access request submitted successfully");

      // In a real app, you might redirect to a confirmation page
      // or back to the doctor dashboard
      navigate("/doctor-dashboard");
    } catch (error) {
      console.error("Error submitting request:", error);
      handleerror("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <BackButton />
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-2">
            <FileText className="w-6 h-6" /> Request Medical Records Access
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Patient
              </label>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">-- Select a patient --</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} ({patient.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Request
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Please explain why you need access to this patient's medical records..."
                required
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 ${
                  submitting
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
