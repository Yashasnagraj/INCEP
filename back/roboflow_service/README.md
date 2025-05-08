# Roboflow Pain Detection Microservice

This microservice uses Roboflow to detect pain expressions in facial images during telemedicine consultations.

## Features

- Real-time pain detection from images
- Video frame extraction and analysis
- Support for both file uploads and base64 encoded images
- Integration with the main telemedicine application

## Setup

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Run the service:
   ```
   python app.py
   ```

The service will start on port 5001.

## API Endpoints

### Health Check
```
GET /health
```

### Process Single Image
```
POST /infer
```
- Send an image file with key 'image' in multipart/form-data
- Or send a base64 encoded image with key 'image_base64' in JSON

### Process Video
```
POST /extract-frames
```
- Send a video file with key 'video' in multipart/form-data
- Optional: specify 'frame_interval' parameter (in seconds) to control extraction frequency

## Integration with Main Application

To integrate with the main telemedicine application, you can send extracted video frames to this microservice and receive pain predictions in real-time or post-processing.

Example using axios in Node.js:
```javascript
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

async function sendImageToRoboflow(imagePath) {
  const form = new FormData();
  form.append("image", fs.createReadStream(imagePath));
  
  const res = await axios.post("http://localhost:5001/infer", form, {
    headers: form.getHeaders(),
  });
  
  return res.data;
}
```