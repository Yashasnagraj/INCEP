import { Navigate } from 'react-router-dom';

const DoctorRoute = ({ children }) => {
  const token = localStorage.getItem('doctorToken');
  const userType = localStorage.getItem('userType');

  if (!token || userType !== 'doctor') {
    return <Navigate to="/doctor/login" />;
  }

  return children;
};

export default DoctorRoute; 