'use client';

import { X, Info, Code, Satellite, Users, Cloud, Map, BarChart3, Calendar } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto border border-white/20">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md p-6 border-b border-gray-200/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Info className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">About Atmora</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Project Overview */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Satellite className="w-6 h-6 text-purple-600" />
              <h3 className="text-2xl font-bold text-gray-800">Project Overview</h3>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
              <p className="text-gray-800 leading-relaxed text-lg mb-4">
                <strong>Atmora</strong> is an interactive atmospheric analysis platform developed for the <strong>NASA Space Apps Challenge 2025</strong>. 
                This application enables users to assess the likelihood of adverse weather conditions for specific locations and times, 
                helping plan outdoor activities with confidence.
              </p>
              <div className="bg-white/60 rounded-lg p-4 mt-4">
                <p className="text-sm text-gray-700 italic">
                  🎯 <strong>Challenge:</strong> "Tell Me About the Weather... Months from Now!"
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Providing personalized weather probability insights based on historical NASA Earth observation data 
                  to help users make informed decisions about future outdoor events.
                </p>
              </div>
            </div>
          </section>

          {/* Key Features */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Cloud className="w-6 h-6 text-blue-600" />
              <h3 className="text-2xl font-bold text-gray-800">Core Features</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50/50 rounded-lg p-4 border-l-4 border-blue-500">
                <div className="flex items-center gap-2 mb-2">
                  <Map className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-800">Interactive Location Selection</h4>
                </div>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Pin-point marker placement</li>
                  <li>• Circle, square, and rectangle area selection</li>
                  <li>• Real-time coordinate display</li>
                  <li>• Esri World Imagery base map</li>
                </ul>
              </div>

              <div className="bg-green-50/50 rounded-lg p-4 border-l-4 border-green-500">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-gray-800">Weather Analysis</h4>
                </div>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Historical weather data visualization</li>
                  <li>• Temperature, precipitation, wind speed</li>
                  <li>• Statistical probability calculations</li>
                  <li>• Multi-year trend analysis</li>
                </ul>
              </div>

              <div className="bg-purple-50/50 rounded-lg p-4 border-l-4 border-purple-500">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-800">Climate Insights</h4>
                </div>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Long-term climate pattern analysis</li>
                  <li>• Seasonal weather predictions</li>
                  <li>• Extreme weather probability</li>
                  <li>• Climate change indicators</li>
                </ul>
              </div>

              <div className="bg-orange-50/50 rounded-lg p-4 border-l-4 border-orange-500">
                <div className="flex items-center gap-2 mb-2">
                  <Satellite className="w-5 h-5 text-orange-600" />
                  <h4 className="font-semibold text-gray-800">ML Predictions</h4>
                </div>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Machine learning forecasts</li>
                  <li>• Multi-variable prediction models</li>
                  <li>• Confidence interval display</li>
                  <li>• Export predictions as CSV/JSON</li>
                </ul>
              </div>
            </div>
          </section>

          {/* NASA Challenge Objectives */}
          <section>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">How Atmora Addresses NASA Challenge Goals</h3>
            <div className="space-y-3">
              <div className="bg-indigo-50/50 rounded-lg p-4 border-l-4 border-indigo-500">
                <h4 className="font-semibold text-indigo-900 mb-2">✓ Personalized Dashboard</h4>
                <p className="text-sm text-gray-700">
                  Users can create custom queries by selecting locations via map interaction (pin drop or area drawing), 
                  choosing specific dates, and selecting relevant weather variables.
                </p>
              </div>

              <div className="bg-teal-50/50 rounded-lg p-4 border-l-4 border-teal-500">
                <h4 className="font-semibold text-teal-900 mb-2">✓ NASA Earth Observation Data</h4>
                <p className="text-sm text-gray-700">
                  Integrates NASA POWER API for historical weather data including temperature, precipitation, 
                  wind speed, humidity, and solar radiation across decades of satellite observations.
                </p>
              </div>

              <div className="bg-pink-50/50 rounded-lg p-4 border-l-4 border-pink-500">
                <h4 className="font-semibold text-pink-900 mb-2">✓ Probability & Statistical Analysis</h4>
                <p className="text-sm text-gray-700">
                  Calculates probabilities of extreme conditions (very hot, very cold, very wet) based on historical trends, 
                  providing users with confidence levels for planning purposes.
                </p>
              </div>

              <div className="bg-amber-50/50 rounded-lg p-4 border-l-4 border-amber-500">
                <h4 className="font-semibold text-amber-900 mb-2">✓ Visual Representation & Downloads</h4>
                <p className="text-sm text-gray-700">
                  Interactive charts display time series, statistical distributions, and trends. 
                  Users can export data in CSV/JSON formats with metadata for external analysis.
                </p>
              </div>

              <div className="bg-cyan-50/50 rounded-lg p-4 border-l-4 border-cyan-500">
                <h4 className="font-semibold text-cyan-900 mb-2">✓ Population Analysis (Bonus)</h4>
                <p className="text-sm text-gray-700">
                  Additional feature analyzing population density in selected areas, useful for 
                  event planning and understanding human exposure to weather conditions.
                </p>
              </div>
            </div>
          </section>

          {/* Technical Implementation */}
          <section>
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Code className="w-6 h-6 text-green-600" />
              Technical Architecture
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Frontend Stack</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• <strong>Next.js 15.5.4</strong> - React framework with App Router</li>
                  <li>• <strong>TypeScript</strong> - Type-safe development</li>
                  <li>• <strong>Leaflet & React-Leaflet</strong> - Interactive maps</li>
                  <li>• <strong>Tailwind CSS</strong> - Modern styling</li>
                  <li>• <strong>Lucide Icons</strong> - UI iconography</li>
                  <li>• <strong>date-fns</strong> - Date manipulation</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Backend Stack</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• <strong>Flask 2.3+</strong> - Python REST API</li>
                  <li>• <strong>NASA POWER API</strong> - Weather data source</li>
                  <li>• <strong>scikit-learn</strong> - ML predictions</li>
                  <li>• <strong>pandas & numpy</strong> - Data processing</li>
                  <li>• <strong>matplotlib</strong> - Chart generation</li>
                  <li>• <strong>Flask-CORS</strong> - Cross-origin support</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Original Contributions */}
          <section>
            <h3 className="text-2xl font-bold text-green-700 mb-4">Original Contributions</h3>
            <div className="bg-green-50/50 rounded-lg p-5 border-l-4 border-green-500">
              <ul className="grid md:grid-cols-2 gap-3 text-sm text-gray-700">
                <li>• Custom geometry selection algorithms (circle, square, rectangle)</li>
                <li>• Dynamic coordinate center calculation system</li>
                <li>• Adaptive NASA API rate limiting with caching</li>
                <li>• Historical gradient boosting prediction model</li>
                <li>• Interactive time-series visualization dashboard</li>
                <li>• Population density analysis integration</li>
                <li>• Glassmorphism UI design system</li>
                <li>• SSR-compatible Leaflet implementation</li>
                <li>• Multi-variable weather correlation analysis</li>
                <li>• CSV/JSON export with comprehensive metadata</li>
              </ul>
            </div>
          </section>

          {/* AI Assistance */}
          <section>
            <h3 className="text-2xl font-bold text-orange-700 mb-4 flex items-center gap-2">
              <Users className="w-6 h-6" />
              AI-Assisted Development
            </h3>
            <div className="bg-orange-50/50 rounded-lg p-5 border-l-4 border-orange-500">
              <p className="text-gray-700 mb-3">
                <strong>GitHub Copilot</strong> was utilized as a <strong>development accelerator tool</strong> for:
              </p>
              <ul className="space-y-2 text-sm text-gray-700 mb-4">
                <li>• Code optimization and debugging assistance</li>
                <li>• TypeScript type definition suggestions</li>
                <li>• Algorithm implementation guidance</li>
                <li>• Documentation and inline comments</li>
                <li>• API integration best practices</li>
              </ul>
              <div className="bg-orange-100/50 rounded p-3 border border-orange-300">
                <p className="text-sm text-orange-900 italic">
                  💡 <strong>Philosophy:</strong> AI tools enhance developer productivity and code quality, 
                  but architectural decisions, problem-solving, and creative solutions remain human-driven.
                </p>
              </div>
            </div>
          </section>

          {/* Data Sources */}
          <section>
            <h3 className="text-2xl font-bold text-blue-700 mb-4">Data Sources & APIs</h3>
            <div className="bg-blue-50/50 rounded-lg p-5 border-l-4 border-blue-500">
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• <strong>NASA POWER API</strong> - Prediction of Worldwide Energy Resources (decades of weather data)</li>
                <li>• <strong>Esri World Imagery</strong> - Satellite base map tiles</li>
                <li>• <strong>OpenStreetMap</strong> - Alternative map layer (Humanitarian style)</li>
                <li>• <strong>NASA Earthdata Harmony</strong> - Population and climate datasets (future integration)</li>
              </ul>
            </div>
          </section>

          {/* License & Attribution */}
          <section>
            <h3 className="text-2xl font-bold text-purple-700 mb-4">Open Source & Attribution</h3>
            <div className="bg-purple-50/50 rounded-lg p-5 border-l-4 border-purple-500">
              <p className="text-gray-700 mb-3">
                This project is developed for the <strong>NASA Space Apps Challenge 2025</strong> and will be 
                published as open source. All third-party resources, libraries, and data sources are properly 
                attributed in accordance with their respective licenses.
              </p>
              <p className="text-sm text-purple-800 font-semibold">
                📜 License: MIT (pending) | 🌐 Repository: GitHub (to be published)
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center pt-6 border-t border-gray-200/50">
            <p className="text-lg font-semibold text-gray-800 mb-2">
              🚀 Atmora - Weather Intelligence for Tomorrow's Decisions
            </p>
            <p className="text-sm text-gray-600">
              Developed by <strong>Atmora Team</strong> for NASA Space Apps Challenge {new Date().getFullYear()}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Built with NASA data, open source technologies, and a passion for solving real-world problems.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}