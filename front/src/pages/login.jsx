// src/pages/LoginPage.js
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { handleerror, handlesuccess } from '../pages/toast';
import image from '../public/team.jpg';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      return handleerror('Please fill all the fields');
    }

    try {
      const response = await fetch('https://advaya-maatrcare-node.onrender.com/user/login', {
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

      const { token, name } = result;
      if (!token) {
        throw new Error('Invalid response from server');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('email', email);
      localStorage.setItem('name', name);

      handlesuccess('Login successful! Redirecting to your medical records...');
      
      // Check if there was a previous path the user was trying to access
      const redirectPath = localStorage.getItem('redirectAfterLogin') || '/medical-records';
      localStorage.removeItem('redirectAfterLogin'); // Clear the redirect path
      
      setTimeout(() => navigate(redirectPath), 1500);
    } catch (error) {
      handleerror(error.message);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-orange-100 to-green-200 justify-center items-center">
      <div className="w-full max-w-xs bg-orange-100 rounded p-5 shadow-lg">
        <header className="flex flex-col items-center">
          <img className="w-20 mx-auto mb-5" src={image} alt="Team Logo" />
          <h2 className="text-orange-700 text-xl font-bold">Decentra Solve</h2>
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
                Login
              </span>
            </button>
          </div>
        </form>

        <footer className="flex justify-center text-sm mt-4">
          <div className="flex justify-center items-center">
            <Link to="/signup" className="text-green-700 hover:text-orange-700">
              Create Account
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
