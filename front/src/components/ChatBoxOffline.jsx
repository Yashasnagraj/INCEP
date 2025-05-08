import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./hi.css"; // Ensure hi.css contains your styles
import { motion, AnimatePresence } from "framer-motion";

function ChatBoxOffline() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    const userMessage = input;
    setInput("");

    // Add user message to chat
    setMessages((prev) => [...prev, { type: "user", content: userMessage }]);

    try {
      const res = await axios.post("https://advaya-maatrcare-node.onrender.com/chat", {
        prompt: userMessage,
      });
      setMessages((prev) => [
        ...prev,
        { type: "bot", content: res.data.response },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          type: "error",
          content: "Sorry, Sakhi couldn't process your request.",
        },
      ]);
      console.error("Error:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const headerVariants = {
    hidden: { y: -50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
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
        stiffness: 100,
        damping: 10
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.2 }
    }
  };

  const inputAreaVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        delay: 0.3
      }
    }
  };

  const emptyStateVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        delay: 0.2
      }
    }
  };

  const iconVariants = {
    hidden: { scale: 0 },
    visible: {
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15,
        delay: 0.4
      }
    },
    pulse: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        repeatType: "loop"
      }
    }
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      backgroundColor: "#0056b3",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: { scale: 0.95 },
    disabled: {
      opacity: 0.6,
      scale: 1
    }
  };

  const loadingDotsVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const dotVariants = {
    hidden: { y: 0, opacity: 0 },
    visible: {
      y: [0, -10, 0],
      opacity: 1,
      transition: {
        repeat: Infinity,
        duration: 0.8
      }
    }
  };

  return (
    <motion.div
      className="app-container"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.header className="app-header" variants={headerVariants}>
        <motion.h1 
          className="app-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Sakhi
        </motion.h1>
        <motion.p 
          className="app-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          Your Friendly Health Companion
        </motion.p>
      </motion.header>

      <motion.div 
        className="chat-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {messages.length === 0 ? (
          <motion.div 
            className="empty-state"
            variants={emptyStateVariants}
          >
            <motion.div 
              className="ai-icon"
              variants={iconVariants}
              initial="hidden"
              animate={["visible", "pulse"]}
            >
              <span>AI</span>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              Welcome to Sakhi. 
              Ask any health-related questions to begin your journey.
            </motion.p>
          </motion.div>
        ) : (
          <div className="messages-list">
            <AnimatePresence>
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  className={`message-wrapper ${
                    msg.type === "user" ? "user-message" : "bot-message"
                  }`}
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                >
                  <motion.div
                    className={`message ${
                      msg.type === "user"
                        ? "user"
                        : msg.type === "error"
                        ? "error"
                        : "bot"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {msg.content}
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            <AnimatePresence>
              {isLoading && (
                <motion.div 
                  className="message-wrapper bot-message"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="message bot loading">
                    <motion.div 
                      className="loading-dots"
                      variants={loadingDotsVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <motion.div className="dot" variants={dotVariants}></motion.div>
                      <motion.div className="dot" variants={dotVariants}></motion.div>
                      <motion.div className="dot" variants={dotVariants}></motion.div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </motion.div>

      <motion.div 
        className="input-area"
        variants={inputAreaVariants}
      >
        <div className="input-container">
          <motion.input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your health question..."
            className="message-input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            whileFocus={{ boxShadow: "0 0 0 2px rgba(0, 123, 255, 0.25)" }}
          />
          <motion.button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className={`send-button ${
              isLoading || !input.trim() ? "disabled" : ""
            }`}
            variants={buttonVariants}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            whileHover={!isLoading && input.trim() ? "hover" : "disabled"}
            whileTap={!isLoading && input.trim() ? "tap" : "disabled"}
          >
            {isLoading ? "Sending..." : "Send"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ChatBoxOffline;