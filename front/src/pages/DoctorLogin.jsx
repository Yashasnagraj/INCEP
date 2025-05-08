import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { handleerror, handlesuccess } from './toast';
import { generateRSAKeyPair } from '../utils/crypto';
import image from '../public/team.jpg';

const DoctorLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      return handleerror('Please fill all the fields');
    }

    try {
      const response = await fetch('https://advaya-maatrcare-node.onrender.com/doctor/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      const { token, doctor } = result;
      if (!token) {
        throw new Error('Invalid response from server');
      }

      // Store doctor's credentials with proper role
      localStorage.setItem('doctorToken', token);
      localStorage.setItem('doctorId', doctor.id);
      localStorage.setItem('doctorName', doctor.name);
      localStorage.setItem('doctorEmail', doctor.email);
      localStorage.setItem('userType', 'doctor');
      localStorage.setItem('role', 'doctor');
      
      // Generate or retrieve RSA key pair
      const keyPair = await generateRSAKeyPair();
      localStorage.setItem('doctorPrivateKey', keyPair.privateKey);
      
      // Update doctor's public key in the backend
      const updateResponse = await fetch(`https://advaya-maatrcare-node.onrender.com/doctor/update-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ publicKey: keyPair.publicKey })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update public key');
      }

      handlesuccess('Login successful! Redirecting...');
      setTimeout(() => navigate('/doctor/dashboard'), 1500);
    } catch (error) {
      handleerror(error.message);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-orange-100 to-green-200 justify-center items-center">
      <div className="w-full max-w-xs bg-orange-100 rounded p-5 shadow-lg">
        <header className="flex flex-col items-center">
          <img className="w-20 mx-auto mb-5" src={image} alt="Team Logo" />
          <h2 className="text-orange-700 text-xl font-bold">Doctor Login</h2>
        </header>

        <form onSubmit={handleSubmit}>
          <div>
            <label className="block mb-2 text-green-700">Email</label>
            <input
              className="w-full p-2 mb-6 text-green-700 border-b-2 border-green-700 outline-none focus:bg-gray-300"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-green-700">Password</label>
            <input
              className="w-full p-2 mb-6 text-green-700 border-b-2 border-green-700 outline-none focus:bg-gray-300"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full px-6 py-3 rounded-xl bg-orange-600 text-white text-lg font-medium shadow-lg relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-green-700 scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></span>
              <span className="relative z-10 group-hover:text-white transition-colors duration-300">
                Login as Doctor
              </span>
            </button>
          </div>
        </form>

        <footer className="flex flex-col items-center text-sm mt-4 space-y-2">
          <Link to="/doctor/register" className="text-green-700 hover:text-orange-700">
            Register as Doctor
          </Link>
          <Link to="/login" className="text-green-700 hover:text-orange-700">
            Patient Login
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default DoctorLogin; 