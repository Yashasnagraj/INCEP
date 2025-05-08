/**
 * RoboflowPainDetection.js
 * Utility for sending video frames to the Roboflow pain detection microservice
 */

class RoboflowPainDetector {
  constructor() {
    this.isRunning = false;
    this.videoElement = null;
    this.canvasElement = null;
    this.canvasCtx = null;
    this.captureInterval = null;
    this.frameRate = 1; // Capture 1 frame per second by default
    this.apiUrl = 'http://localhost:5001'; // Default URL for the microservice
    this.onPainDetected = null;
    this.roomId = null;
    this.socket = null;
  }

  /**
   * Initialize the pain detector
   * @param {Object} options Configuration options
   * @param {HTMLVideoElement} options.videoElement Video element to analyze
   * @param {HTMLCanvasElement} options.canvasElement Optional canvas for visualization
   * @param {WebSocket|Object} options.socket WebSocket or Socket.io instance
   * @param {string} options.roomId Room ID for the consultation
   * @param {Function} options.onPainDetected Callback when pain is detected
   * @param {number} options.frameRate Number of frames to capture per second
   * @param {string} options.apiUrl URL of the Roboflow microservice
   */
  initialize(options) {
    this.videoElement = options.videoElement;
    this.canvasElement = options.canvasElement;
    this.socket = options.socket;
    this.roomId = options.roomId;
    this.onPainDetected = options.onPainDetected;
    this.frameRate = options.frameRate || this.frameRate;
    this.apiUrl = options.apiUrl || this.apiUrl;

    if (!this.videoElement) {
      console.error('Video element is required');
      return false;
    }

    if (this.canvasElement) {
      this.canvasCtx = this.canvasElement.getContext('2d');
    } else {
      // Create a hidden canvas for frame extraction
      this.canvasElement = document.createElement('canvas');
      this.canvasCtx = this.canvasElement.getContext('2d');
    }

    console.log('Roboflow Pain Detector initialized');
    return true;
  }

  /**
   * Start capturing and analyzing frames
   */
  start() {
    if (!this.videoElement || !this.canvasElement) {
      console.error('Video or canvas element not initialized');
      return false;
    }

    if (this.isRunning) {
      console.warn('Pain detector is already running');
      return false;
    }

    this.isRunning = true;

    // Set canvas dimensions to match video
    this.canvasElement.width = this.videoElement.videoWidth;
    this.canvasElement.height = this.videoElement.videoHeight;

    // Calculate interval in milliseconds
    const intervalMs = 1000 / this.frameRate;

    // Start capturing frames
    this.captureInterval = setInterval(() => {
      this.captureAndAnalyzeFrame();
    }, intervalMs);

    console.log(`Roboflow Pain Detector started (capturing ${this.frameRate} frame(s) per second)`);
    return true;
  }

  /**
   * Stop capturing and analyzing frames
   */
  stop() {
    if (!this.isRunning) {
      return false;
    }

    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }

    this.isRunning = false;
    console.log('Roboflow Pain Detector stopped');
    return true;
  }

  /**
   * Capture a frame from the video and send it for analysis
   */
  captureAndAnalyzeFrame() {
    if (!this.isRunning || !this.videoElement.videoWidth) {
      return;
    }

    try {
      // Draw the current video frame to the canvas
      this.canvasCtx.drawImage(
        this.videoElement,
        0, 0,
        this.canvasElement.width,
        this.canvasElement.height
      );

      // Convert canvas to base64 image
      const base64Image = this.canvasElement.toDataURL('image/jpeg', 0.8);

      // Send to Roboflow microservice
      this.sendFrameToRoboflow(base64Image);
    } catch (error) {
      console.error('Error capturing frame:', error);
    }
  }

  /**
   * Send a frame to the Roboflow microservice
   * @param {string} base64Image Base64 encoded image
   */
  async sendFrameToRoboflow(base64Image) {
    try {
      // Extract the base64 data part (remove the data URL prefix)
      const base64Data = base64Image.split(',')[1];

      // Send to Roboflow microservice
      const response = await fetch(`${this.apiUrl}/infer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: base64Data,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Process the results
      this.handlePainDetectionResult(result);
    } catch (error) {
      console.error('Error sending frame to Roboflow:', error);
    }
  }

  /**
   * Handle the pain detection result
   * @param {Object} result Pain detection result from Roboflow
   */
  handlePainDetectionResult(result) {
    // Check if we have pain regions in the result
    if (result.pain_regions && Object.keys(result.pain_regions).length > 0) {
      console.log('Pain detected:', result.pain_regions);
      
      // Add room ID to the result
      const painData = {
        roomId: this.roomId,
        timestamp: new Date().toISOString(),
        painRegions: result.pain_regions,
        predictions: result.predictions || []
      };
      
      // Call the callback if provided
      if (this.onPainDetected && typeof this.onPainDetected === 'function') {
        this.onPainDetected(painData);
      }
      
      // Send to socket if available
      if (this.socket) {
        // Try multiple event names for compatibility
        this.socket.emit('facial_pain_data', painData);
        this.socket.emit('pain_data', painData);
        this.socket.emit('facial-pain-update', painData);
        
        console.log('Pain data sent to socket:', painData);
      }
    }
  }

  /**
   * Process a video file and extract frames for analysis
   * @param {File} videoFile Video file to process
   * @param {number} frameInterval Interval between frames in seconds
   * @returns {Promise<Object>} Analysis results
   */
  async processVideoFile(videoFile, frameInterval = 1.0) {
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('frame_interval', frameInterval.toString());
      
      const response = await fetch(`${this.apiUrl}/extract-frames`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error processing video file:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const roboflowPainDetector = new RoboflowPainDetector();

export default roboflowPainDetector;