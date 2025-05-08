import React, { useState, useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';
import ChatBox from './ChatBotOnline';
import ChatBoxOffline from './ChatBoxOffline';
import { motion, AnimatePresence } from 'framer-motion';

const FloatingChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Animation variants
  const buttonVariants = {
    initial: { scale: 0 },
    animate: { 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 15
      }
    },
    hover: { 
      scale: 1.1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: { scale: 0.95 }
  };

  const chatWindowVariants = {
    initial: { 
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    animate: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    },
    exit: { 
      opacity: 0,
      y: 20,
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-rose-500 text-white p-4 rounded-full shadow-lg hover:bg-rose-600 transition-colors z-50"
        variants={buttonVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap="tap"
      >
        <MessageSquare size={24} />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed bottom-20 right-4 z-50"
            variants={chatWindowVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {isOnline ? (
              <ChatBox onClose={() => setIsOpen(false)} />
            ) : (
              <ChatBoxOffline onClose={() => setIsOpen(false)} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChatButton; 