import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { motion, AnimatePresence } from 'framer-motion';

const ChatBox = () => {
  const [messages, setMessages] = useState([
    {
      text: "Hello! I'm Sakhi, your pregnancy care assistant. How can I help you today?",
      isUser: false
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize Gemini API
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus the input field when the component mounts
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Prepare the prompt for Gemini
      const prompt = `You are Sakhi, a caring and supportive AI assistant specialized in pregnancy care.

The user has asked: "${userMessage}"

Please respond with empathy, accurate information, and helpful advice related to pregnancy care. 
If the question involves medical conditions or diagnosis, kindly remind the user to consult a healthcare provider for professional guidance.

Keep your tone warm and friendly, and your response concise and easy to understand.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      setMessages(prev => [...prev, { text, isUser: false }]);
    } catch (error) {
      console.error('Error getting response:', error);
      setMessages(prev => [...prev, { 
        text: "I'm sorry, I'm having trouble connecting right now. Please try again later.", 
        isUser: false 
      }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 100
      }
    }
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 200
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.2 }
    }
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: { scale: 0.95 }
  };

  const inputVariants = {
    focus: {
      boxShadow: "0 0 0 3px rgba(244, 63, 94, 0.3)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 10
      }
    }
  };

  const typingIndicatorVariants = {
    initial: {
      opacity: 0,
      y: 10
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    },
    exit: {
      opacity: 0,
      y: 10,
      transition: {
        duration: 0.3
      }
    }
  };

  const dotVariants = {
    initial: { y: 0 },
    animate: {
      y: [0, -5, 0],
      transition: {
        repeat: Infinity,
        repeatType: "loop",
        duration: 0.6,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div 
      className="max-w-4xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h2 className="text-3xl font-extrabold text-gray-900">
          Chat with Sakhi
        </h2>
        <p className="mt-2 text-lg text-gray-600">
          Your AI companion for pregnancy care
        </p>
      </motion.div>
      
      <motion.div 
        className="bg-white rounded-lg shadow-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
      >
        <div className="h-96 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-lg">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                className={`mb-4 ${
                  message.isUser ? 'text-right' : 'text-left'
                }`}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={messageVariants}
                custom={index}
              >
                <motion.div
                  className={`inline-block p-3 rounded-lg max-w-[80%] ${
                    message.isUser
                      ? 'bg-rose-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {message.text}
                </motion.div>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div
                className="mb-4 text-left"
                variants={typingIndicatorVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <motion.div
                  className="inline-block p-3 rounded-lg bg-gray-200 text-gray-800"
                >
                  <div className="flex space-x-1">
                    <motion.div 
                      className="w-2 h-2 bg-gray-600 rounded-full"
                      variants={dotVariants}
                      initial="initial"
                      animate="animate"
                      custom={0}
                    />
                    <motion.div 
                      className="w-2 h-2 bg-gray-600 rounded-full"
                      variants={dotVariants}
                      initial="initial"
                      animate="animate"
                      custom={1}
                      transition={{ delay: 0.1 }}
                    />
                    <motion.div 
                      className="w-2 h-2 bg-gray-600 rounded-full"
                      variants={dotVariants}
                      initial="initial"
                      animate="animate"
                      custom={2}
                      transition={{ delay: 0.2 }}
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
        <div className="flex">
          <motion.input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none"
            disabled={isLoading}
            variants={inputVariants}
            whileFocus="focus"
          />
          <motion.button
            onClick={handleSend}
            disabled={isLoading}
            className={`bg-rose-500 text-white p-2 rounded-r-lg hover:bg-rose-600 focus:outline-none ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            variants={buttonVariants}
            whileHover={!isLoading ? "hover" : undefined}
            whileTap={!isLoading ? "tap" : undefined}
          >
            {isLoading ? (
              <motion.div 
                className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ChatBox;