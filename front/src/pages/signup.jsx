import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { handleerror, handlesuccess } from "./toast";
import image from "../images/team.jpg";
const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name || !email || !password)
      return handleerror("Please fill all the fields");

    try {
      const response = await fetch("https://advaya-maatrcare-node.onrender.com/user/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Signup failed");

      handlesuccess("Signup successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      handleerror(error.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-orange-100 to-green-200">
      <div className="bg-orange-100 p-6 rounded-lg shadow-lg w-80">
        <header className="flex flex-col items-center">
          <img
            className="w-20 mx-auto mb-4"
            src={image}
            alt="Team Logo"
          />
          <h2 className="text-orange-700 text-xl font-bold">Decentra Solve</h2>
        </header>
        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            className="w-full p-2 border rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full px-6 py-3 rounded-xl bg-orange-600 text-white text-lg font-medium shadow-lg relative overflow-hidden group"
          >
            <span className="absolute inset-0 bg-green-700 scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></span>
            <span className="relative z-10 group-hover:text-white transition-colors duration-300">
              Sign Up
            </span>
          </button>
        </form>
        <p className="mt-4 text-center text-green-700">
          Already have an account?{" "}
          <Link to="/login" className="text-orange-700 hover:text-green-700">
            Login
          </Link>
        </p>
        <ToastContainer />
      </div>
    </div>
  );
};

export default Signup;
