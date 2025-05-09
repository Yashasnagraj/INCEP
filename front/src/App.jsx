import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./styles/base.css";
import "./styles/chat.css";
import "./styles/medical.css";
import "./styles/effects.css";
import "./styles/components.css";
import "./styles/chat-components.css";
import "./styles/consultation.css";
import "./styles/dashboard.css";
import { Routes, Route, useLocation } from "react-router-dom";
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

// Page transition animation variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0
  },
  exit: {
    opacity: 0,
    y: -20
  }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.5
};

function App() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <h2 className="text-primary">Loading TeleHealth...</h2>
      </div>
    );
  }

  return (
    <div className="app-container">
      <SocketProvider>
        <PeerProvider>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <Routes location={location}>
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
            </motion.div>
          </AnimatePresence>
          <FloatingChatButton />
        </PeerProvider>
      </SocketProvider>
    </div>
  );
}

export default App;
