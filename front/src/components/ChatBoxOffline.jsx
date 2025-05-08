import React, { useState, useRef, useEffect } from "react";
import { Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

function ChatBoxOffline({ onClose }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      type: "bot",
      content: "Hello! I'm Sakhi, your offline AI assistant powered by GPT4All Falcon. I can help you with health-related questions even when you're offline. How can I assist you today?"
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    // Focus the input field when the component mounts
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage = input;
    setInput("");

    // Add user message to chat
    setMessages((prev) => [...prev, { type: "user", content: userMessage }]);

    try {
      // Call GPT4All API
      const response = await axios.post("http://localhost:5000/chat", {
        prompt: `You are Sakhi, a caring and supportive AI assistant specialized in pregnancy care. The user has asked: "${userMessage}". Please respond with empathy, accurate information, and helpful advice related to pregnancy care. If the question involves medical conditions or diagnosis, kindly remind the user to consult a healthcare provider for professional guidance. Keep your tone warm and friendly, and your response concise and easy to understand.`
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setMessages((prev) => [
        ...prev,
        { type: "bot", content: response.data.response },
      ]);
    } catch (error) {
      console.error("Error:", error.message);
      setMessages((prev) => [
        ...prev,
        {
          type: "error",
          content: "I apologize, but I'm having trouble processing your request. Please try again or check if the offline model is properly loaded.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
      boxShadow: "0 0 0 3px rgba(75, 85, 99, 0.3)",
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
      className="w-96 bg-white rounded-lg shadow-xl border border-gray-200"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <div className="bg-gray-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <h3 className="font-semibold">Offline Assistant (GPT4All Falcon)</h3>
        <button onClick={onClose} className="hover:text-gray-200">
          <X size={20} />
        </button>
      </div>

      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={messageVariants}
              custom={index}
            >
              <motion.div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-gray-600 text-white'
                    : message.type === 'error'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {message.content}
              </motion.div>
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div
              className="flex justify-start"
              variants={typingIndicatorVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <motion.div
                className="bg-gray-100 text-gray-800 rounded-lg p-3"
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

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <motion.input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none"
            disabled={isLoading}
            variants={inputVariants}
            whileFocus="focus"
          />
          <motion.button
            onClick={sendMessage}
            disabled={isLoading}
            className={`bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700 focus:outline-none ${
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
      </div>
    </motion.div>
  );
}

export default ChatBoxOffline;