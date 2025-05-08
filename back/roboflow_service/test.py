import requests
import base64
import json
import cv2
import numpy as np
import os

# Test health check
def test_health():
    response = requests.get("http://localhost:5001/health")
    print("Health check response:", response.json())

# Create a test image with a face
def create_test_image():
    # Create a blank image
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    img.fill(200)  # Light gray background
    
    # Draw a simple face
    # Face circle
    cv2.circle(img, (320, 240), 100, (255, 200, 200), -1)
    # Eyes
    cv2.circle(img, (280, 210), 20, (255, 255, 255), -1)
    cv2.circle(img, (360, 210), 20, (255, 255, 255), -1)
    cv2.circle(img, (280, 210), 10, (0, 0, 0), -1)
    cv2.circle(img, (360, 210), 10, (0, 0, 0), -1)
    # Mouth
    cv2.ellipse(img, (320, 280), (50, 20), 0, 0, 180, (0, 0, 0), 2)
    
    # Save the image
    test_image_path = "test_face.jpg"
    cv2.imwrite(test_image_path, img)
    return test_image_path

# Test image inference
def test_image_inference(image_path):
    with open(image_path, "rb") as img_file:
        files = {"image": img_file}
        response = requests.post("http://localhost:5001/infer", files=files)
    
    print("Image inference response:", json.dumps(response.json(), indent=2))

# Test base64 inference
def test_base64_inference(image_path):
    with open(image_path, "rb") as img_file:
        img_data = base64.b64encode(img_file.read()).decode('utf-8')
    
    payload = {"image_base64": img_data}
    response = requests.post("http://localhost:5001/infer", json=payload)
    
    print("Base64 inference response:", json.dumps(response.json(), indent=2))

if __name__ == "__main__":
    print("Testing Roboflow Pain Detection Service")
    print("-" * 50)
    
    # Test health check
    print("\nTesting health check...")
    test_health()
    
    # Create test image
    print("\nCreating test image...")
    test_image = create_test_image()
    
    # Test image inference
    print("\nTesting image inference...")
    test_image_inference(test_image)
    
    # Test base64 inference
    print("\nTesting base64 inference...")
    test_base64_inference(test_image)
    
    # Clean up
    if os.path.exists(test_image):
        os.remove(test_image)
    
    print("\nTests completed!")