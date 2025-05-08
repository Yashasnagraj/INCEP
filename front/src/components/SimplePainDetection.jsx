import { useState, useEffect, useRef } from 'react';

const SimplePainDetection = ({ videoRef, onPainDetected }) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [painLevel, setPainLevel] = useState(0);
  const [painRegions, setPainRegions] = useState({});
  const [error, setError] = useState(null);
  const detectionInterval = useRef(null);

  // Function to capture frame from video
  const captureFrame = () => {
    if (!videoRef.current || !videoRef.current.srcObject) {
      setError('No video stream available');
      return null;
    }

    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get base64 image data
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
  };

  // Function to analyze pain using our Roboflow service
  const analyzePain = async () => {
    try {
      const frameData = captureFrame();
      if (!frameData) return;

      console.log('Sending frame to Roboflow service...');
      const response = await fetch('http://localhost:5001/infer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: frameData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Received pain detection result:', result);
      
      // Process pain regions
      if (result.pain_regions) {
        setPainRegions(result.pain_regions);
        
        // Calculate overall pain level (0-10 scale)
        let maxPain = 0;
        Object.values(result.pain_regions).forEach(level => {
          if (level > maxPain) maxPain = level;
        });
        
        // Convert to 0-10 scale
        const painScore = Math.round(maxPain * 10);
        setPainLevel(painScore);
        
        // Always notify parent component with the data
        if (onPainDetected) {
          // Format the data for the doctor's UI
          const painData = {
            type: 'facial_pain',
            roomId: window.location.pathname.split('/').pop(), // Extract room ID from URL
            regions: Object.entries(result.pain_regions).map(([region, intensity]) => ({
              region,
              intensity,
              description: `${region} pain`
            }))
          };
          
          console.log('Sending pain data to doctor:', painData);
          onPainDetected(painData);
        }
      }
    } catch (err) {
      console.error('Error analyzing pain:', err);
      setError(err.message);
    }
  };

  // Start/stop pain detection
  useEffect(() => {
    if (isDetecting) {
      // Run detection every 2 seconds
      detectionInterval.current = setInterval(analyzePain, 2000);
    } else {
      // Clear interval when detection is stopped
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
        detectionInterval.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, [isDetecting]);

  // Render pain level indicator
  const renderPainLevel = () => {
    const color = painLevel > 7 ? 'red' : painLevel > 4 ? 'orange' : 'green';
    
    return (
      <div className="mt-2">
        <div className="text-sm font-medium">Pain Level: {painLevel}/10</div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="h-2.5 rounded-full" 
            style={{ 
              width: `${painLevel * 10}%`, 
              backgroundColor: color 
            }}
          ></div>
        </div>
      </div>
    );
  };

  // Render pain regions
  const renderPainRegions = () => {
    if (!painRegions || Object.keys(painRegions).length === 0) {
      return <div className="text-sm text-gray-500 mt-2">No pain detected</div>;
    }

    return (
      <div className="mt-2">
        <div className="text-sm font-medium">Detected Pain Regions:</div>
        <ul className="text-sm">
          {Object.entries(painRegions).map(([region, level]) => (
            <li key={region} className="flex justify-between">
              <span className="capitalize">{region}</span>
              <span>{Math.round(level * 100)}%</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h3 className="text-lg font-medium mb-2">AI Pain Detection</h3>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-2 text-sm">
          {error}
        </div>
      )}
      
      <button
        onClick={() => setIsDetecting(!isDetecting)}
        className={`px-4 py-2 rounded font-medium ${
          isDetecting 
            ? 'bg-red-500 hover:bg-red-600 text-white' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isDetecting ? 'Stop Detection' : 'Start Detection'}
      </button>
      
      {isDetecting && renderPainLevel()}
      {isDetecting && renderPainRegions()}
    </div>
  );
};

export default SimplePainDetection;