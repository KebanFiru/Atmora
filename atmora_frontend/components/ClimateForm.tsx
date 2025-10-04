'use client';

import React from 'react';
import { X, BookOpen } from 'lucide-react';

interface ClimateFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation: { longitude: number; latitude: number } | null;
}

const ClimateForm: React.FC<ClimateFormProps> = ({ isOpen, onClose, selectedLocation }) => {
  // Mock climate data for demonstration


  const climateArticle = `
    # Understanding Regional Climate Patterns

    Climate change is one of the most pressing challenges of our time, fundamentally altering weather patterns across the globe. Through NASA's comprehensive Earth observation data, we can better understand these changes and their implications for outdoor activities and planning.

    ## Temperature Trends
    
    Over the past decades, global temperatures have risen significantly, with regional variations showing distinct patterns. The Mediterranean climate zone, for example, has experienced increased summer temperatures and altered precipitation patterns, affecting everything from agriculture to tourism.

    ## Precipitation Changes
    
    Rainfall patterns have become increasingly unpredictable, with some regions experiencing more intense storms while others face prolonged droughts. These changes directly impact outdoor event planning, as traditional seasonal patterns can no longer be relied upon.

    ## Extreme Weather Events
    
    The frequency and intensity of extreme weather events have increased dramatically. Heat waves, severe storms, and unexpected weather patterns now occur more frequently, making historical weather data less reliable for future planning.

    ## Implications for Outdoor Activities
    
    For outdoor enthusiasts and event planners, these climate changes mean:
    - Greater need for flexible planning and backup options
    - Increased importance of real-time weather monitoring
    - Need to consider broader date ranges when planning events
    - Importance of understanding local microclimates and variations

    ## NASA Earth Observation Data
    
    NASA's Earth observation satellites provide unprecedented insight into our changing climate. The POWER project (Prediction Of Worldwide Energy Resources) offers access to over 40 years of solar and meteorological data, enabling better understanding of long-term trends and patterns.

    This data is crucial for understanding not just what the weather will be like, but how climate patterns are evolving over time, helping us make more informed decisions about outdoor activities and long-term planning.
  `;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="bg-black/20 backdrop-blur-sm absolute inset-0" onClick={onClose} />
      
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 w-full max-w-6xl mx-4 relative max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Climate Overview</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="flex">
            {/* Climate Article */}
            <div className="flex-1 p-6 border-r border-gray-200">
              <div className="flex items-center mb-4">
                <BookOpen className="mr-2 text-blue-600" size={24} />
                <h3 className="text-xl font-semibold text-gray-800">Climate Insights</h3>
              </div>
              
              <div className="prose prose-gray max-w-none">
                {climateArticle.split('\n').map((line, index) => {
                  if (line.startsWith('# ')) {
                    return <h1 key={index} className="text-2xl font-bold text-gray-800 mt-6 mb-4">{line.slice(2)}</h1>;
                  } else if (line.startsWith('## ')) {
                    return <h2 key={index} className="text-xl font-semibold text-gray-700 mt-5 mb-3">{line.slice(3)}</h2>;
                  } else if (line.startsWith('- ')) {
                    return <li key={index} className="text-gray-600 ml-4">{line.slice(2)}</li>;
                  } else if (line.trim()) {
                    return <p key={index} className="text-gray-600 mb-3 leading-relaxed">{line}</p>;
                  }
                  return null;
                })}
              </div>
            </div>

            {/* Climate Chart */}
            <div className="w-96 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Regional Climate Data</h3>
              
              {selectedLocation && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600">Selected Location</div>
                  <div className="font-medium">
                    {selectedLocation.latitude.toFixed(2)}°, {selectedLocation.longitude.toFixed(2)}°
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-700 mb-3">Monthly Averages</h4>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="font-semibold text-red-800">Hottest Month</div>
                  <div className="text-red-700">July: 35°C average</div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="font-semibold text-blue-800">Wettest Month</div>
                  <div className="text-blue-700">December: 52mm average</div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="font-semibold text-green-800">Best Outdoor Conditions</div>
                  <div className="text-green-700">April-May, September-October</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClimateForm;