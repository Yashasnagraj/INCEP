import { useState } from "react";
import "./App.css";
import { Routes, Route } from "react-router-dom";
import { SocketProvider } from "./components/Socket";
import { PeerProvider } from "./components/peer";
import ConsultationRequest from "./components/ConsultationRequest";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorConsultationRoom from "./components/DoctorConsultationRoom";
import PatientConsultationRoom from "./components/PatientConsultationRoom";
import Dashboard from "./components/Dashboard";
import WaitingRoom from "./components/WaitingRoom";
import TestMediaPipe from "./components/TestMediaPipe";
import Records from "./components/Records";
import RequestAccess from "./components/RequestAccess";
import ManageAccess from "./components/ManageAccess";
import DoctorFiles from "./components/DoctorFiles";
import DoctorLogin from "./pages/DoctorLogin";
import PatientLogin from "./pages/Login";
import DoctorDashboardtele from "./components/DoctorDashboardtele";
import FloatingChatButton from "./components/FloatingChatButton";

function App() {
  return (
    <div className="container">
      <SocketProvider>
        <PeerProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/patient/login" element={<PatientLogin />} />
            
            {/* Patient Routes */}
            <Route path="/request-consultation" element={<ConsultationRequest />} />
            <Route path="/patient/consultation/:roomId" element={<PatientConsultationRoom />} />
            <Route path="/waiting-room/:roomId" element={<WaitingRoom />} />
            <Route path="/medical-records" element={<Records />} />
            <Route path="/manage-access" element={<ManageAccess />} />

            {/* Doctor Routes */}
            <Route path="/doctor/login" element={<DoctorLogin />} />
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/tele" element={<DoctorDashboardtele />} />
            <Route
              path="/doctor/consultation/:roomId"
              element={<DoctorConsultationRoom />}
            />
            <Route path="/doctor/request-access" element={<RequestAccess />} />
            <Route path="/doctor/files" element={<DoctorFiles />} />

            {/* Testing Routes */}
            <Route path="/test-mediapipe" element={<TestMediaPipe />} />
          </Routes>
          <FloatingChatButton />
        </PeerProvider>
      </SocketProvider>
    </div>
  );
}

export default App;
