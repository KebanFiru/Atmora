'use client';

import React, { useState } from 'react';
import EsriMap from '../components/EsriMap';
import SimpleMap from '../components/SimpleMap';
import DrawingToolbar from '../components/DrawingToolbar';
import MapControls from '../components/MapControls';
import HeaderButtons from '../components/HeaderButtons';
import WeatherForm from '../components/WeatherForm';
import ClimateForm from '../components/ClimateForm';
import TimeScroller from '../components/TimeScroller';

interface WeatherData {
  temperature: Array<{ date: string; value: number }>;
  windSpeed: Array<{ date: string; value: number }>;
  precipitation: Array<{ date: string; value: number }>;
  humidity: Array<{ date: string; value: number }>;
}

export default function Home() {
  const [selectedTool, setSelectedTool] = useState<'point' | 'circle' | 'rectangle' | 'polygon' | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ longitude: number; latitude: number } | null>(null);
  const [isWeatherFormOpen, setIsWeatherFormOpen] = useState(false);
  const [isClimateFormOpen, setIsClimateFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weatherData, setWeatherData] = useState<WeatherData | undefined>(undefined);
  const [zoomLevel, setZoomLevel] = useState(6);

  const handleLocationSelect = (longitude: number, latitude: number, geometry?: any) => {
    setSelectedLocation({ longitude, latitude });
    console.log('Selected location:', { longitude, latitude, geometry });
  };

  const handleWeatherAnalysis = async (params: any) => {
    if (!selectedLocation) return;

    try {
      const response = await fetch('/api/weather', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          longitude: selectedLocation.longitude,
          latitude: selectedLocation.latitude,
          startDate: params.startDate,
          endDate: params.endDate,
          parameters: params.parameters,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setWeatherData(result.data);
        console.log('Weather data received:', result);
      } else {
        console.error('Failed to fetch weather data');
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    console.log('Date changed:', date);
  };

  const handleDateConfirm = (date: Date) => {
    setSelectedDate(date);
    console.log('Date confirmed:', date);
    // Here you could trigger map updates based on the selected date
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 1, 18));
    console.log('Zoom in to level:', zoomLevel + 1);
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 1, 1));
    console.log('Zoom out to level:', zoomLevel - 1);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Full-screen Map Background */}
      <SimpleMap
        onLocationSelect={handleLocationSelect}
        drawingMode={selectedTool}
        isDarkMode={isDarkMode}
        zoom={zoomLevel}
        onZoomChange={setZoomLevel}
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
        }}
        onClimateClick={() => {
          setIsClimateFormOpen(true);
          setIsWeatherFormOpen(false);
        }}
      />

      <DrawingToolbar
        selectedTool={selectedTool}
        onToolSelect={setSelectedTool}
      />

      <TimeScroller
        onDateChange={handleDateChange}
        onConfirm={handleDateConfirm}
      />

      {/* Modal Forms */}
      <WeatherForm
        isOpen={isWeatherFormOpen}
        onClose={() => setIsWeatherFormOpen(false)}
        selectedLocation={selectedLocation}
        onAnalyze={handleWeatherAnalysis}
        weatherData={weatherData}
      />

      <ClimateForm
        isOpen={isClimateFormOpen}
        onClose={() => setIsClimateFormOpen(false)}
        selectedLocation={selectedLocation}
      />
    </div>
  );
}
