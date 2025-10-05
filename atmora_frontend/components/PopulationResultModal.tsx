'use client';

import React from 'react';
import { X, Users, MapPin, Maximize2, TrendingUp } from 'lucide-react';
import { PopulationData, formatPopulation, getDensityDescription, getDensityColor } from '../lib/population-api';

interface PopulationResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PopulationData | null;
  isLoading?: boolean;
}

const PopulationResultModal: React.FC<PopulationResultModalProps> = ({
  isOpen,
  onClose,
  data,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      <div className="bg-black/20 backdrop-blur-sm absolute inset-0" onClick={onClose} />
      
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 w-full max-w-2xl mx-4 relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Users size={28} className="text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-800">Population Analysis</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-gray-600">Analyzing population data...</p>
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Main Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Population */}
                <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={20} className="text-purple-600" />
                    <span className="text-sm font-medium text-gray-600">Total Population</span>
                  </div>
                  <div className="text-3xl font-bold text-purple-600">
                    {formatPopulation(data.total_population)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {data.total_population.toLocaleString()} people
                  </div>
                </div>

                {/* Area */}
                <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Maximize2 size={20} className="text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">Area</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {data.area_km2.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">km²</div>
                </div>

                {/* Density */}
                <div className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={20} className="text-orange-600" />
                    <span className="text-sm font-medium text-gray-600">Density</span>
                  </div>
                  <div className={`text-3xl font-bold ${getDensityColor(data.density)}`}>
                    {data.density.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    people/km² • {getDensityDescription(data.density)}
                  </div>
                </div>
              </div>

              {/* Geometry Info */}
              <div className="p-6 bg-gray-50 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin size={20} />
                  Geographic Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Geometry Type:</span>
                    <span className="ml-2 capitalize text-gray-800 font-semibold">
                      {data.geometry_type}
                    </span>
                  </div>

                  {data.coordinates.center_lat !== undefined && (
                    <>
                      <div>
                        <span className="font-medium text-gray-600">Center Latitude:</span>
                        <span className="ml-2 text-gray-800">
                          {data.coordinates.center_lat.toFixed(6)}°
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Center Longitude:</span>
                        <span className="ml-2 text-gray-800">
                          {data.coordinates.center_lon?.toFixed(6)}°
                        </span>
                      </div>
                      {data.coordinates.radius_km && (
                        <div>
                          <span className="font-medium text-gray-600">Radius:</span>
                          <span className="ml-2 text-gray-800">
                            {data.coordinates.radius_km} km
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {data.coordinates.south_west && (
                    <>
                      <div>
                        <span className="font-medium text-gray-600">Southwest Corner:</span>
                        <span className="ml-2 text-gray-800">
                          {data.coordinates.south_west.lat.toFixed(4)}°, {data.coordinates.south_west.lon.toFixed(4)}°
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Northeast Corner:</span>
                        <span className="ml-2 text-gray-800">
                          {data.coordinates.north_east?.lat.toFixed(4)}°, {data.coordinates.north_east?.lon.toFixed(4)}°
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                <div className="text-sm text-blue-800">
                  <p className="mb-1">
                    <span className="font-semibold">📊 Data Source:</span> {data.data_source}
                  </p>
                  <p>
                    <span className="font-semibold">🕒 Analysis Time:</span> {data.timestamp}
                  </p>
                </div>
              </div>

              {/* Density Interpretation */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-gray-800 mb-2">Population Density Interpretation:</h4>
                <p className="text-sm text-gray-700">
                  {data.density < 10 && (
                    "This area has very low population density, typical of remote or wilderness regions."
                  )}
                  {data.density >= 10 && data.density < 50 && (
                    "This area has low population density, similar to rural or agricultural regions."
                  )}
                  {data.density >= 50 && data.density < 150 && (
                    "This area has moderate population density, typical of suburban or small town areas."
                  )}
                  {data.density >= 150 && data.density < 500 && (
                    "This area has high population density, characteristic of urban neighborhoods."
                  )}
                  {data.density >= 500 && data.density < 2000 && (
                    "This area has very high population density, typical of dense urban centers."
                  )}
                  {data.density >= 2000 && (
                    "This area has extremely high population density, characteristic of major metropolitan cores."
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No population data available
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2 px-4 rounded-lg transition-all duration-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PopulationResultModal;
