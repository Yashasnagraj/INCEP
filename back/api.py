from gpt4all import GPT4All
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Path to your local Llama 2 model
model_path = "C:/Users/yashr/OneDrive/Desktop/OFFLINE/models/llama-2-7b-chat.gguf"

# Initialize Llama 2 model
try:
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}")
    
    # Initialize the model
    gpt_model = GPT4All(model_path, allow_download=False)
    logger.info(f"Successfully loaded Llama 2 model from {model_path}")
except Exception as e:
    logger.error(f"Error loading Llama 2 model: {str(e)}")
    gpt_model = None

def format_prompt(user_prompt):
    return f"""You are Sakhi, a caring and supportive AI assistant specialized in pregnancy care and general health advice. 
Your role is to provide helpful, accurate, and empathetic responses to health-related questions.

User Question: {user_prompt}

Guidelines for your response:
1. Be specific and detailed in your answer
2. If the question is about pregnancy, focus on pregnancy-related advice
3. If it's about general health, provide relevant health information
4. Always remind users to consult healthcare providers for medical conditions
5. Keep your tone warm and friendly
6. Be concise but informative

Your response:"""

@app.route('/chat', methods=['POST'])
def chat():
    if gpt_model is None:
        logger.error("Chat endpoint called but model is not loaded")
        return jsonify({"error": "AI model not loaded. Please check server logs."}), 500

    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        user_prompt = data.get("prompt", "")
        if not user_prompt:
            return jsonify({"error": "No prompt provided"}), 400

        # Format the prompt with context and guidelines
        formatted_prompt = format_prompt(user_prompt)
        logger.info(f"Processing prompt: {user_prompt[:100]}...")

        # Generate response with improved parameters
        response = gpt_model.generate(
            formatted_prompt,
            max_tokens=1000,
            temp=0.8,
            top_k=50,
            top_p=0.95,
            repeat_penalty=1.2,
            repeat_last_n=128,
            streaming=False
        )
        
        # Clean up the response
        cleaned_response = response.strip()
        if cleaned_response.startswith("Your response:"):
            cleaned_response = cleaned_response.replace("Your response:", "").strip()
        
        logger.info("Successfully generated response")
        return jsonify({"response": cleaned_response})
        
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        return jsonify({"error": "Failed to generate response. Please try again."}), 500

if __name__ == '__main__':
    if gpt_model is None:
        logger.warning("Starting server without Llama 2 model loaded")
    else:
        logger.info("Starting server with Llama 2 model loaded")
    app.run(port=5000, debug=True)