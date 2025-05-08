import requests
import base64
import json
import os
import sys

def test_health_check():
    """Test the health check endpoint"""
    response = requests.get("http://localhost:5001/health")
    print("Health Check Response:", response.json())
    return response.status_code == 200

def test_image_upload(image_path):
    """Test uploading an image file"""
    if not os.path.exists(image_path):
        print(f"Error: Image file not found at {image_path}")
        return False
    
    with open(image_path, "rb") as image_file:
        files = {"image": image_file}
        response = requests.post("http://localhost:5001/infer", files=files)
    
    print("Image Upload Response:", json.dumps(response.json(), indent=2))
    return response.status_code == 200

def test_base64_upload(image_path):
    """Test uploading a base64 encoded image"""
    if not os.path.exists(image_path):
        print(f"Error: Image file not found at {image_path}")
        return False
    
    with open(image_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode("utf-8")
    
    payload = {"image_base64": encoded_string}
    response = requests.post("http://localhost:5001/infer", json=payload)
    
    print("Base64 Upload Response:", json.dumps(response.json(), indent=2))
    return response.status_code == 200

def test_video_upload(video_path, frame_interval=1.0):
    """Test uploading a video file"""
    if not os.path.exists(video_path):
        print(f"Error: Video file not found at {video_path}")
        return False
    
    with open(video_path, "rb") as video_file:
        files = {"video": video_file}
        data = {"frame_interval": str(frame_interval)}
        response = requests.post("http://localhost:5001/extract-frames", files=files, data=data)
    
    print("Video Upload Response (Summary):", json.dumps(response.json().get("summary", {}), indent=2))
    print(f"Processed {len(response.json().get('frames', []))} frames")
    return response.status_code == 200

if __name__ == "__main__":
    print("Testing Roboflow Pain Detection Microservice")
    
    # Test health check
    print("\n1. Testing Health Check...")
    if test_health_check():
        print("✅ Health check successful")
    else:
        print("❌ Health check failed")
    
    # Test image upload if path provided
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        print(f"\n2. Testing Image Upload with {image_path}...")
        if test_image_upload(image_path):
            print("✅ Image upload successful")
        else:
            print("❌ Image upload failed")
        
        print(f"\n3. Testing Base64 Upload with {image_path}...")
        if test_base64_upload(image_path):
            print("✅ Base64 upload successful")
        else:
            print("❌ Base64 upload failed")
    else:
        print("\nSkipping image tests. Provide an image path as argument to test image uploads.")
    
    # Test video upload if path provided
    if len(sys.argv) > 2:
        video_path = sys.argv[2]
        print(f"\n4. Testing Video Upload with {video_path}...")
        if test_video_upload(video_path):
            print("✅ Video upload successful")
        else:
            print("❌ Video upload failed")
    else:
        print("\nSkipping video test. Provide a video path as second argument to test video uploads.")