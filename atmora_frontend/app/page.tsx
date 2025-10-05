'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import DrawingToolbar from '@/components/DrawingToolbar';
import MapControls from '@/components/MapControls';
import HeaderButtons from '@/components/HeaderButtons';
import WeatherForm from '@/components/WeatherForm';
import ClimateForm from '@/components/ClimateForm';
import PredictionForm from '@/components/PredictionForm';
import AboutModal from '@/components/AboutModal';
import WeatherLayersSidebar from '@/components/WeatherLayersSidebar';
import TimeScroller from '@/components/TimeScroller';
import PopulationResultModal from '@/components/PopulationResultModal';
import { PopulationAPI, PopulationData } from '@/lib/population-api';

// Dynamically import the map component to avoid SSR issues
const LeafletMapUpdated = dynamic(() => import('@/components/LeafletMapUpdated'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-blue-50 text-gray-800">
      <div className="text-center">
        <div className="text-xl font-semibold mb-2">Loading Interactive Map...</div>
        <div className="text-sm opacity-75">Initializing Esri World Map</div>
      </div>
    </div>
  )
}) as React.ComponentType<{
  onLocationSelect: (longitude: number, latitude: number, geometry?: any) => void;
  mode: 'marker' | 'square' | 'circle' | 'rectangle' | null;
  isDarkMode: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  rainLayerEnabled?: boolean;
  rainLayerOpacity?: number;
  populationDensityData?: Array<[number, number, number]> | null;
  showPopulationHeatMap?: boolean;
}>;

interface WeatherData {
  temperature: Array<{ date: string; value: number }>;
  windSpeed: Array<{ date: string; value: number }>;
  precipitation: Array<{ date: string; value: number }>;
  humidity: Array<{ date: string; value: number }>;
}

export default function Home() {
  const [selectedTool, setSelectedTool] = useState<'marker' | 'square' | 'circle' | 'rectangle' | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ longitude: number; latitude: number } | null>(null);
  const [isWeatherFormOpen, setIsWeatherFormOpen] = useState(false);
  const [isClimateFormOpen, setIsClimateFormOpen] = useState(false);
  const [isPredictionFormOpen, setIsPredictionFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weatherData, setWeatherData] = useState<WeatherData | undefined>(undefined);
  const [zoomLevel, setZoomLevel] = useState(6);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isWeatherLayersOpen, setIsWeatherLayersOpen] = useState(false);
  const [rainLayerEnabled, setRainLayerEnabled] = useState(false);
  const [rainLayerOpacity, setRainLayerOpacity] = useState(0.6);
  const [isPopulationModalOpen, setIsPopulationModalOpen] = useState(false);
  const [populationData, setPopulationData] = useState<PopulationData | null>(null);
  const [isLoadingPopulation, setIsLoadingPopulation] = useState(false);
  const [selectedGeometry, setSelectedGeometry] = useState<any>(null);

  const handleLocationSelect = (longitude: number, latitude: number, geometry?: any) => {
    setSelectedLocation({ longitude, latitude });
    
    // Store geometry information for population analysis
    if (geometry) {
      setSelectedGeometry(geometry);
    } else if (selectedTool === 'marker') {
      setSelectedGeometry({ type: 'marker', center: { lat: latitude, lon: longitude } });
    }
    
    console.log('Selected location:', { longitude, latitude, geometry });
  };

  const handlePopulationRequest = async (date: Date) => {
    if (!selectedGeometry || selectedGeometry.type === 'marker') {
      console.log('Population request requires area selection');
      return;
    }

    setIsLoadingPopulation(true);
    setIsPopulationModalOpen(true);
    setPopulationData(null);

    try {
      const api = new PopulationAPI();
      
      // Prepare geometry payload based on type
      let geometryPayload: any = {
        type: selectedGeometry.type
      };

      if (selectedGeometry.type === 'circle') {
        geometryPayload = {
          type: 'circle',
          center: {
            lat: selectedGeometry.center.lat,
            lon: selectedGeometry.center.lon
          },
          radius: selectedGeometry.radius || 50 // default 50km if not specified
        };
      } else if (selectedGeometry.type === 'square' || selectedGeometry.type === 'rectangle') {
        geometryPayload = {
          type: selectedGeometry.type,
          bounds: selectedGeometry.bounds
        };
      }

      console.log('Requesting population for:', geometryPayload);

      const response = await api.analyzePopulation({ geometry: geometryPayload });
      
      if (response.success) {
        setPopulationData(response.data);
        console.log('Population data received:', response.data);
      } else {
        console.error('Population analysis failed');
        alert('Failed to analyze population');
      }

    } catch (error) {
      console.error('Population request error:', error);
      alert(`Population analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingPopulation(false);
    }
  };

  const handleWeatherAnalysis = async (params: any) => {
    if (!selectedLocation) return;

    try {
      // Mock data for now
      const mockData = {
        temperature: Array.from({ length: 365 }, (_, i) => ({
          date: new Date(2025, 0, i + 1).toISOString().split('T')[0],
          value: 20 + Math.sin(i / 30) * 15 + Math.random() * 10
        })),
        windSpeed: Array.from({ length: 365 }, (_, i) => ({
          date: new Date(2025, 0, i + 1).toISOString().split('T')[0],
          value: 5 + Math.random() * 10
        })),
        precipitation: Array.from({ length: 365 }, (_, i) => ({
          date: new Date(2025, 0, i + 1).toISOString().split('T')[0],
          value: Math.random() * 20
        })),
        humidity: Array.from({ length: 365 }, (_, i) => ({
          date: new Date(2025, 0, i + 1).toISOString().split('T')[0],
          value: 40 + Math.random() * 40
        }))
      };
      
      setWeatherData(mockData);
      console.log('Weather data received:', mockData);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    console.log('Date changed:', date);
  };

  const handleDateConfirm = async (date: Date) => {
    setSelectedDate(date);
    console.log('Date confirmed:', date);
    // Date selection only - no heat map loading
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => {
      const newLevel = Math.min(prev + 1, 18);
      console.log('Zoom in from', prev, 'to', newLevel);
      return newLevel;
    });
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const newLevel = Math.max(prev - 1, 2); // Changed from 1 to 2 to match map minZoom
      console.log('Zoom out from', prev, 'to', newLevel);
      return newLevel;
    });
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Full-screen Map Background */}
      <LeafletMapUpdated
        onLocationSelect={handleLocationSelect}
        mode={selectedTool}
        isDarkMode={isDarkMode}
        zoom={zoomLevel}
        onZoomChange={setZoomLevel}
        rainLayerEnabled={rainLayerEnabled}
        rainLayerOpacity={rainLayerOpacity}
      />



      {/* UI Overlays */}
      <MapControls
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />

      <HeaderButtons
        onWeatherClick={() => {
          setIsWeatherFormOpen(true);
          setIsClimateFormOpen(false);
          setIsPredictionFormOpen(false);
        }}
        onClimateClick={() => {
          setIsClimateFormOpen(true);
          setIsWeatherFormOpen(false);
          setIsPredictionFormOpen(false);
        }}
        onPredictionClick={() => {
          setIsPredictionFormOpen(true);
          setIsWeatherFormOpen(false);
          setIsClimateFormOpen(false);
        }}
      />

      <DrawingToolbar
        selectedTool={selectedTool}
        onToolSelect={setSelectedTool}
      />

      <TimeScroller
        onDateChange={handleDateChange}
        onConfirm={handleDateConfirm}
        selectedGeometry={selectedGeometry}
        onPopulationRequest={handlePopulationRequest}
      />

      {/* Weather Layers Button */}
      <button
        onClick={() => setIsWeatherLayersOpen(true)}
        className={`fixed top-1/2 left-4 -translate-y-1/2 backdrop-blur-md hover:scale-105 p-3 rounded-xl shadow-lg transition-all duration-200 group z-[25] ${
          rainLayerEnabled 
            ? 'bg-blue-500 text-white animate-pulse' 
            : 'bg-white/90 hover:bg-white/95 text-gray-700'
        }`}
        title="Weather Layers"
      >
        <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
        </svg>
      </button>

      {/* About Button */}
      <button
        onClick={() => setIsAboutModalOpen(true)}
        className="fixed bottom-4 left-4 bg-white/90 backdrop-blur-md hover:bg-white/95 p-3 rounded-full shadow-lg transition-all duration-200 group z-[25]"
        title="About Atmora"
      >
        <svg className="w-5 h-5 text-gray-700 group-hover:text-blue-600 transition-colors" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Modal Forms */}
      <WeatherForm
        isOpen={isWeatherFormOpen}
        onClose={() => setIsWeatherFormOpen(false)}
        selectedLocation={selectedLocation}
        onAnalyze={handleWeatherAnalysis}
      />

      <ClimateForm
        isOpen={isClimateFormOpen}
        onClose={() => setIsClimateFormOpen(false)}
        selectedLocation={selectedLocation}
      />

      <PredictionForm
        isOpen={isPredictionFormOpen}
        onClose={() => setIsPredictionFormOpen(false)}
        selectedLocation={selectedLocation}
      />

      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />

      <WeatherLayersSidebar
        isOpen={isWeatherLayersOpen}
        onClose={() => setIsWeatherLayersOpen(false)}
        onRainLayerToggle={setRainLayerEnabled}
        onOpacityChange={setRainLayerOpacity}
        rainLayerEnabled={rainLayerEnabled}
      />

      <PopulationResultModal
        isOpen={isPopulationModalOpen}
        onClose={() => setIsPopulationModalOpen(false)}
        data={populationData}
        isLoading={isLoadingPopulation}
      />
    </div>
  );
}