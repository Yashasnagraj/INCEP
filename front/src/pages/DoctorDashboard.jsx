import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleerror, handlesuccess } from './toast';

const DoctorDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('doctorToken');
    if (!token) {
      navigate('/doctor/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('doctorToken');
      
      // Fetch access requests
      const requestsResponse = await fetch('https://advaya-maatrcare-node.onrender.com/doctor/requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!requestsResponse.ok) {
        const errorData = await requestsResponse.json();
        throw new Error(errorData.message || 'Failed to fetch requests');
      }
      
      const requestsData = await requestsResponse.json();
      setAccessRequests(requestsData);
      
      // Fetch patients
      const patientsResponse = await fetch('https://advaya-maatrcare-node.onrender.com/doctor/patients', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!patientsResponse.ok) {
        const errorData = await patientsResponse.json();
        throw new Error(errorData.message || 'Failed to fetch patients');
      }
      
      const patientsData = await patientsResponse.json();
      setPatients(patientsData);
      
      setLoading(false);
    } catch (error) {
      handleerror(error.message);
      setLoading(false);
      if (error.message.includes('jwt') || error.message.includes('token')) {
        // Token is invalid or expired
        localStorage.removeItem('doctorToken');
        localStorage.removeItem('doctorId');
        localStorage.removeItem('doctorName');
        localStorage.removeItem('doctorEmail');
        localStorage.removeItem('userType');
        navigate('/doctor/login');
      }
    }
  };

  const requestAccess = async (patientId) => {
    try {
      const token = localStorage.getItem('doctorToken');
      
      // Validate patientId
      if (!patientId) {
        throw new Error('Invalid patient ID');
      }

      const response = await fetch('https://advaya-maatrcare-node.onrender.com/doctor/request-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          patientId: patientId.toString(), // Ensure patientId is a string
          message: 'Requesting access to medical records',
          fileId: null // Add optional fileId parameter
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to request access');
      }

      handlesuccess('Access request sent successfully');
      fetchData(); // Refresh the data
    } catch (error) {
      handleerror(error.message);
      if (error.message.includes('jwt') || error.message.includes('token')) {
        navigate('/doctor/login');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-green-200 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-green-700">Doctor Dashboard</h1>
          <p className="text-orange-700">Welcome, {localStorage.getItem('doctorName')}</p>
          <div className="mt-4">
            <button
              onClick={() => navigate('/doctor/files')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors mr-4"
            >
              View Approved Files
            </button>
            <button
              onClick={() => navigate('/doctor/tele')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Telemedicine Dashboard
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Patients List */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-green-700 mb-4">Patients</h2>
            <div className="space-y-4">
              {patients.length === 0 ? (
                <p className="text-gray-500">No patients found</p>
              ) : (
                patients.map(patient => (
                  <div key={patient._id} className="border-b pb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{patient.name}</h3>
                        <p className="text-sm text-gray-600">{patient.email}</p>
                      </div>
                      <button
                        onClick={() => requestAccess(patient._id)}
                        className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        Request Access
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Access Requests */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-green-700 mb-4">Access Requests</h2>
            <div className="space-y-4">
              {accessRequests.length === 0 ? (
                <p className="text-gray-500">No access requests</p>
              ) : (
                accessRequests.map(request => (
                  <div key={request._id} className="border-b pb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{request.patientId?.name || 'Unknown Patient'}</h3>
                        <p className="text-sm text-gray-600">Status: {request.status}</p>
                        <p className="text-xs text-gray-500">
                          Requested: {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded ${
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard; 