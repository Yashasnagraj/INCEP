import React, { useEffect, useState, useRef } from 'react';
import roboflowPainDetector from '../utils/RoboflowPainDetection';

const RoboflowPainPanel = ({ videoRef, socket, roomId, onPainDetected }) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState('Not running');
  const [lastPainData, setLastPainData] = useState(null);
  const canvasRef = useRef(null);
  
  // Handle pain detection results
  const handlePainDetected = (painData) => {
    setLastPainData(painData);
    
    // Call the parent callback if provided
    if (onPainDetected && typeof onPainDetected === 'function') {
      onPainDetected(painData);
    }
  };
  
  // Start pain detection
  const startDetection = () => {
    if (!videoRef.current) {
      setDetectionStatus('Error: Video element not available');
      return;
    }
    
    // Initialize the detector
    const initialized = roboflowPainDetector.initialize({
      videoElement: videoRef.current,
      canvasElement: canvasRef.current,
      socket: socket,
      roomId: roomId,
      onPainDetected: handlePainDetected,
      frameRate: 0.5, // Capture 1 frame every 2 seconds to reduce load
    });
    
    if (!initialized) {
      setDetectionStatus('Error: Failed to initialize detector');
      return;
    }
    
    // Start the detector
    const started = roboflowPainDetector.start();
    
    if (started) {
      setIsDetecting(true);
      setDetectionStatus('Running - Analyzing facial expressions');
    } else {
      setDetectionStatus('Error: Failed to start detector');
    }
  };
  
  // Stop pain detection
  const stopDetection = () => {
    roboflowPainDetector.stop();
    setIsDetecting(false);
    setDetectionStatus('Stopped');
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isDetecting) {
        roboflowPainDetector.stop();
      }
    };
  }, [isDetecting]);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h3 className="text-lg font-semibold mb-2">AI Pain Detection</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Status: <span className={isDetecting ? "text-green-600 font-medium" : "text-gray-600"}>{detectionStatus}</span>
        </p>
        
        <div className="flex space-x-2">
          {!isDetecting ? (
            <button
              onClick={startDetection}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
            >
              Start Detection
            </button>
          ) : (
            <button
              onClick={stopDetection}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              Stop Detection
            </button>
          )}
        </div>
      </div>
      
      {lastPainData && (
        <div className="border-t pt-3">
          <h4 className="text-md font-medium mb-2">Last Detection Results:</h4>
          <div className="text-sm">
            <p className="mb-1">Timestamp: {new Date(lastPainData.timestamp).toLocaleTimeString()}</p>
            <div className="mb-1">
              <p className="font-medium">Pain Regions:</p>
              <ul className="list-disc pl-5">
                {Object.entries(lastPainData.painRegions).map(([region, intensity]) => (
                  <li key={region}>
                    {region}: <span className="font-medium">{Math.round(intensity * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden canvas for frame extraction */}
      <canvas 
        ref={canvasRef} 
        style={{ display: 'none' }} 
        width="640" 
        height="480"
      />
    </div>
  );
};

export default RoboflowPainPanel;