import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const BackButton = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 100, 
        damping: 15 
      }}
    >
      <Link 
        to="/"
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
      >
        <motion.div
          initial={{ x: 0 }}
          whileHover={{ x: -3 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 10 
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
        </motion.div>
        <motion.span
          whileHover={{ color: "#374151" }}
          transition={{ duration: 0.2 }}
        >
          Back to Home
        </motion.span>
      </Link>
    </motion.div>
  );
};

export default BackButton;
