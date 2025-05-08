from flask import Flask, request, jsonify
import os
import base64
import cv2
import numpy as np
from io import BytesIO
from PIL import Image
import uuid
import requests
import json
from flask_cors import CORS

app = Flask(__name__)
# Enable CORS for all routes and origins
CORS(app)

# Configure Roboflow
ROBOFLOW_API_KEY = "27VJjAb7BFSdfNcnjYWt"

# Create upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Since we don't have a specific pain detection model in Roboflow,
# we'll simulate the pain detection using facial analysis
def analyze_facial_expression(image_path):
    """
    Simulate facial pain analysis
    In a real implementation, this would call a trained model
    """
    # For demo purposes, we'll return simulated pain detection results
    # In a real implementation, this would use a trained model
    
    # Simulate detection with OpenCV face detection
    try:
        # Load the image
        image = cv2.imread(image_path)
        if image is None:
            return {"error": "Failed to load image"}
            
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Load face detector
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        # If no faces detected, return empty result
        if len(faces) == 0:
            return {
                "predictions": [],
                "pain_regions": {}
            }
        
        # For each detected face, simulate pain detection
        predictions = []
        for (x, y, w, h) in faces:
            # Calculate face center
            center_x = x + w/2
            center_y = y + h/2
            
            # Simulate different pain levels based on face position
            # This is just for demonstration - in a real system, this would use a trained model
            pain_class = "pain_moderate"
            confidence = 0.7 + (np.random.random() * 0.2)  # Random confidence between 0.7-0.9
            
            predictions.append({
                "class": pain_class,
                "confidence": confidence,
                "x": float(center_x),
                "y": float(center_y),
                "width": float(w),
                "height": float(h)
            })
        
        return {
            "predictions": predictions
        }
        
    except Exception as e:
        print(f"Error in facial analysis: {str(e)}")
        return {"error": str(e)}

# Create upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "roboflow-pain-detection"})

@app.route("/infer", methods=["POST"])
def infer_image():
    """
    Process an image and return pain predictions
    
    Accepts:
    - Image file in multipart/form-data with key 'image'
    - Base64 encoded image in JSON with key 'image_base64'
    
    Returns:
    - JSON with pain predictions
    """
    try:
        file_path = None
        
        # Handle file upload
        if 'image' in request.files:
            file = request.files['image']
            # Generate a unique filename to avoid collisions
            filename = f"{uuid.uuid4()}.jpg"
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)
            
        # Handle base64 encoded image
        elif request.json and 'image_base64' in request.json:
            base64_data = request.json['image_base64']
            # Remove data URL prefix if present
            if ',' in base64_data:
                base64_data = base64_data.split(',')[1]
            
            # Decode base64 to image
            image_bytes = base64.b64decode(base64_data)
            image = Image.open(BytesIO(image_bytes))
            
            # Generate a unique filename
            filename = f"{uuid.uuid4()}.jpg"
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            image.save(file_path)
        else:
            return jsonify({"error": "No image provided. Send an image file with key 'image' or base64 encoded image with key 'image_base64'"}), 400
        
        # Process the image with our facial analysis function
        prediction_result = analyze_facial_expression(file_path)
        
        # Clean up the temporary file
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
        
        # If there was an error in analysis, return it
        if 'error' in prediction_result:
            return jsonify({"error": prediction_result['error']}), 500
            
        # Get predictions from the result
        predictions = prediction_result.get('predictions', [])
        
        # Map predictions to pain regions
        pain_regions = map_predictions_to_pain_regions(predictions)
        
        return jsonify({
            "predictions": predictions,
            "pain_regions": pain_regions
        })
        
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return jsonify({"error": str(e)}), 500

def map_predictions_to_pain_regions(predictions):
    """
    Map model predictions to pain regions on the body
    
    This function takes the raw predictions from the model and maps them
    to specific pain regions that can be displayed on the body map in the UI.
    
    The mapping logic should be customized based on your specific model's output.
    """
    pain_regions = {}
    
    # Example mapping logic - customize based on your model's output
    pain_classes = {
        "pain_severe": 0.9,
        "pain_moderate": 0.6,
        "pain_mild": 0.3,
        "discomfort": 0.2,
        "neutral": 0.0
    }
    
    # Default to no pain
    max_pain_level = 0.0
    
    # Find the highest pain level in predictions
    for pred in predictions:
        class_name = pred['class'].lower()
        confidence = pred['confidence']
        
        if class_name in pain_classes:
            pain_level = pain_classes[class_name] * confidence
            if pain_level > max_pain_level:
                max_pain_level = pain_level
    
    # Map to facial regions based on pain level
    if max_pain_level > 0:
        # For simplicity, we're mapping any detected pain to the face
        # In a real implementation, you would use more sophisticated mapping
        pain_regions = {
            "face": max_pain_level,
            "head": max_pain_level * 0.8,  # Assuming head pain correlates with facial expressions
        }
    
    # For testing purposes, always return some pain data
    if not pain_regions:
        # Simulate some pain data for testing
        pain_regions = {
            "face": 0.7,
            "head": 0.5
        }
    
    return pain_regions

@app.route("/extract-frames", methods=["POST"])
def extract_frames():
    """
    Extract frames from a video file and process each for pain detection
    
    Accepts:
    - Video file in multipart/form-data with key 'video'
    - Optional 'frame_interval' parameter (in seconds) to control extraction frequency
    
    Returns:
    - JSON with pain predictions for each extracted frame
    """
    try:
        if 'video' not in request.files:
            return jsonify({"error": "No video file provided"}), 400
        
        video_file = request.files['video']
        frame_interval = float(request.form.get('frame_interval', 1.0))  # Default: extract 1 frame per second
        
        # Save video file temporarily
        video_filename = f"{uuid.uuid4()}.mp4"
        video_path = os.path.join(UPLOAD_FOLDER, video_filename)
        video_file.save(video_path)
        
        # Extract frames and analyze
        results = extract_and_analyze_frames(video_path, frame_interval)
        
        # Clean up
        if os.path.exists(video_path):
            os.remove(video_path)
            
        return jsonify(results)
        
    except Exception as e:
        print(f"Error processing video: {str(e)}")
        return jsonify({"error": str(e)}), 500

def extract_and_analyze_frames(video_path, frame_interval=1.0):
    """
    Extract frames from video and analyze each for pain
    
    Args:
        video_path: Path to the video file
        frame_interval: Interval between frames to extract (in seconds)
        
    Returns:
        Dictionary with pain analysis results for each frame
    """
    results = {
        "frames": [],
        "summary": {
            "max_pain_level": 0,
            "pain_timeline": []
        }
    }
    
    try:
        # Open the video
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise Exception("Could not open video file")
        
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps
        
        # Calculate frame extraction interval
        frame_step = int(fps * frame_interval)
        if frame_step < 1:
            frame_step = 1
        
        frame_count = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            # Process only at specified intervals
            if frame_count % frame_step == 0:
                # Save frame temporarily
                frame_filename = f"frame_{uuid.uuid4()}.jpg"
                frame_path = os.path.join(UPLOAD_FOLDER, frame_filename)
                cv2.imwrite(frame_path, frame)
                
                # Process with our facial analysis function
                try:
                    prediction_result = analyze_facial_expression(frame_path)
                    
                    # Process predictions
                    predictions = prediction_result.get('predictions', [])
                    
                    # Map to pain regions
                    pain_regions = map_predictions_to_pain_regions(predictions)
                    
                    # Calculate timestamp
                    timestamp = frame_count / fps
                    
                    # Add to results
                    frame_result = {
                        "frame_number": frame_count,
                        "timestamp": timestamp,
                        "predictions": predictions,
                        "pain_regions": pain_regions
                    }
                    
                    results["frames"].append(frame_result)
                    
                    # Update summary
                    max_pain = 0
                    for region, level in pain_regions.items():
                        if level > max_pain:
                            max_pain = level
                    
                    results["summary"]["pain_timeline"].append({
                        "timestamp": timestamp,
                        "pain_level": max_pain
                    })
                    
                    if max_pain > results["summary"]["max_pain_level"]:
                        results["summary"]["max_pain_level"] = max_pain
                        
                except Exception as e:
                    print(f"Error processing frame {frame_count}: {str(e)}")
                
                # Clean up
                if os.path.exists(frame_path):
                    os.remove(frame_path)
            
            frame_count += 1
        
        # Release video
        cap.release()
        
    except Exception as e:
        print(f"Error in frame extraction: {str(e)}")
        results["error"] = str(e)
    
    return results

if __name__ == "__main__":
    # Run the Flask app
    print("Starting Roboflow Pain Detection Service on port 5001...")
    app.run(host="127.0.0.1", port=5001, debug=True)