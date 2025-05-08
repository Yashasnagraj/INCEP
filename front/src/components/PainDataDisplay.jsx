import React, { useState, useEffect } from 'react';
import { useSocket } from './Socket';

const PainDataDisplay = ({ roomId }) => {
  const [painData, setPainData] = useState(null);
  const { socket } = useSocket();

  // For debugging - add a test button to simulate pain data
  const simulatePainData = () => {
    const testData = {
      type: 'facial_pain',
      roomId: roomId,
      regions: [
        { region: 'head', intensity: 0.8, description: 'Headache' },
        { region: 'jaw', intensity: 0.6, description: 'Jaw pain' }
      ]
    };
    console.log('Simulating pain data:', testData);
    setPainData(testData);
  };

  useEffect(() => {
    if (!socket) return;

    const handlePainData = (data) => {
      console.log('Pain data received in PainDataDisplay:', data);
      
      // Normalize the data format
      if (data.regions && Array.isArray(data.regions)) {
        // Already in the expected format
        setPainData(data);
      } else if (data.regions && typeof data.regions === 'object') {
        // Convert from SimplePainDetection format (object to array)
        const normalizedData = {
          type: 'facial_pain',
          roomId: roomId,
          regions: Object.entries(data.regions).map(([region, intensity]) => ({
            region,
            intensity,
            description: `${region} pain`
          }))
        };
        setPainData(normalizedData);
      } else if (data.level !== undefined) {
        // Simple pain level without regions
        const normalizedData = {
          type: 'facial_pain',
          roomId: roomId,
          regions: [
            { region: 'general', intensity: data.level / 10, description: 'General pain' }
          ]
        };
        setPainData(normalizedData);
      }
    };

    // Listen for pain data events with all possible event names
    socket.on('receive_pain_data', handlePainData);
    socket.on('facial-pain-update', handlePainData);
    socket.on('pain_data', handlePainData);
    
    // Also listen for direct test events from the UI
    const handleTestEvent = (event) => {
      console.log('Test pain data received:', event.detail);
      setPainData(event.detail);
    };
    window.addEventListener('test-pain-data', handleTestEvent);

    // Log connection status for debugging
    console.log('PainDataDisplay connected to socket:', socket.id);
    
    return () => {
      socket.off('receive_pain_data', handlePainData);
      socket.off('facial-pain-update', handlePainData);
      socket.off('pain_data', handlePainData);
      window.removeEventListener('test-pain-data', handleTestEvent);
    };
  }, [socket, roomId]);

  if (!painData) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-medium mb-2">Patient Pain Analysis</h3>
        <p className="text-gray-400">No pain data available yet</p>
      </div>
    );
  }

  // Handle different data formats
  let painLevel = 0;
  let painRegions = [];
  
  if (Array.isArray(painData.regions)) {
    // Format from facial pain detection
    painRegions = painData.regions;
    const maxPain = Math.max(...painData.regions.map(region => region.intensity));
    painLevel = Math.round(maxPain * 10);
  } else if (typeof painData.regions === 'object') {
    // Format from SimplePainDetection
    painRegions = Object.entries(painData.regions).map(([region, intensity]) => ({
      region,
      intensity,
      description: `${region} pain`
    }));
    const maxPain = Math.max(...Object.values(painData.regions));
    painLevel = Math.round(maxPain * 10);
  } else if (painData.level !== undefined) {
    // Direct pain level
    painLevel = painData.level;
    painRegions = [];
  }
  
  const painColor = painLevel > 7 ? 'red' : painLevel > 4 ? 'orange' : 'green';

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Patient Pain Analysis</h3>
        
        {/* Test button for debugging */}
        <button 
          onClick={simulatePainData}
          className="bg-purple-600 text-white text-xs px-2 py-1 rounded"
        >
          Test Data
        </button>
      </div>
      
      {/* Pain Level Indicator */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium">Pain Level</span>
          <span className="text-sm font-medium">{painLevel}/10</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div 
            className="h-2.5 rounded-full" 
            style={{ 
              width: `${painLevel * 10}%`, 
              backgroundColor: painColor 
            }}
          ></div>
        </div>
      </div>
      
      {/* Pain Regions */}
      <div>
        <h4 className="text-sm font-medium mb-2">Affected Regions</h4>
        {painRegions.length === 0 ? (
          <p className="text-sm text-gray-400">No specific regions detected</p>
        ) : (
          <ul className="space-y-2">
            {painRegions.map((region, index) => (
              <li key={index} className="flex justify-between items-center">
                <span className="capitalize">{region.region}</span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-700 rounded-full h-2 mr-2">
                    <div 
                      className="h-2 rounded-full bg-blue-500" 
                      style={{ width: `${region.intensity * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs">{Math.round(region.intensity * 100)}%</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Last Updated */}
      <div className="mt-4 text-xs text-gray-400">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default PainDataDisplay;