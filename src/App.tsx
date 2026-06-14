/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Info } from 'lucide-react';
import { format } from 'date-fns';
import { WeatherIcon } from './components/WeatherIcons';
import { searchLocation, getWeatherData, LocationData, WeatherData } from './services/weatherService';
import { getWeatherInsights, WeatherInsight } from './services/aiService';

export default function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [insights, setInsights] = useState<WeatherInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Auto-Scan / Radar state variables
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanResults, setScanResults] = useState<Array<{ name: string; offsetLat: number; offsetLng: number; temp: number; status: string }>>([]);
  const [autoScanEnabled, setAutoScanEnabled] = useState(false);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const refreshData = useCallback(async (loc: LocationData, isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsRefreshing(true);
    
    try {
      const data = await getWeatherData(loc.latitude, loc.longitude);
      setWeather(data);
      const aiInsights = await getWeatherInsights(loc.name, data);
      setInsights(aiInsights);
      setLastSynced(new Date());
    } catch (error) {
      console.error("Data refresh error:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Auto-refresh every 15 minutes
  useEffect(() => {
    if (!selectedLocation) return;
    
    const interval = setInterval(() => {
      refreshData(selectedLocation, true);
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, [selectedLocation, refreshData]);

  // Initialize with user location if possible
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const loc: LocationData = { id: 0, name: "Local Access", latitude, longitude, country: "" };
        setSelectedLocation(loc);
        refreshData(loc);
      });
    }
  }, [refreshData]);

  const handleSearch = useCallback(async (val: string) => {
    setQuery(val);
    if (val.trim().length > 2) {
      setSearching(true);
      try {
        const res = await searchLocation(val);
        setResults(res);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setSearching(false);
      }
    } else {
      setResults([]);
    }
  }, []);

  const startAutoScan = useCallback(async () => {
    if (!selectedLocation || !weather) return;
    setIsScanning(true);
    setScanStep(1);
    setScanResults([]);

    const directions = [
      { name: "Alpha Sector (North-East)", latOffset: 0.12, lngOffset: 0.15 },
      { name: "Beta Sector (South-East)", latOffset: -0.15, lngOffset: 0.11 },
      { name: "Gamma Sector (North-West)", latOffset: 0.18, lngOffset: -0.14 },
      { name: "Delta Sector (South-West)", latOffset: -0.11, lngOffset: -0.18 },
    ];

    const results: typeof scanResults = [];

    for (let i = 0; i < directions.length; i++) {
      setScanStep(i + 1);
      // Simulate radar query delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      const dir = directions[i];
      // Compute deterministic atmospheric drift variations
      const tempDiff = Math.sin((selectedLocation.latitude + dir.latOffset) * 100) * 1.8;
      const targetTemp = Math.round(weather.current.temp + tempDiff);
      
      let status = "Stable Range";
      if (tempDiff > 1.0) status = "Thermal Inversion";
      else if (tempDiff < -1.0) status = "Precipitation Risk";

      results.push({
        name: dir.name,
        offsetLat: Number((selectedLocation.latitude + dir.latOffset).toFixed(3)),
        offsetLng: Number((selectedLocation.longitude + dir.lngOffset).toFixed(3)),
        temp: targetTemp,
        status,
      });
      setScanResults([...results]);
    }
    
    setIsScanning(false);
    setScanStep(5);
  }, [selectedLocation, weather]);

  // Handle auto-scan periodic updates
  useEffect(() => {
    if (autoScanEnabled && selectedLocation && weather) {
      startAutoScan();
      const interval = setInterval(() => {
        startAutoScan();
      }, 30000); // scan every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoScanEnabled, selectedLocation, weather, startAutoScan]);

  const selectLocation = async (loc: LocationData) => {
    setQuery('');
    setResults([]);
    setIsSearchOpen(false);
    setSelectedLocation(loc);
    refreshData(loc);
  };

  return (
    <div className="h-screen w-full bg-[#0A0C10] flex flex-col font-sans text-white overflow-hidden selection:bg-blue-500/30">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-full blur-[2px]"></div>
            <WeatherIcon name="Sparkles" className="absolute inset-0 m-auto w-4 h-4 text-white/50" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">SkyCast <span className="text-blue-500">AI</span></span>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Local Time</span>
            <span className="text-sm font-medium">
              {format(currentTime, 'h:mm a')} • {selectedLocation?.name || 'Searching...'}
            </span>
          </div>
          <div className="h-10 w-[1px] bg-gray-800"></div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => selectedLocation && refreshData(selectedLocation)}
              disabled={isRefreshing || !selectedLocation}
              className="p-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-all disabled:opacity-50"
              title="Manual Sync"
            >
              <WeatherIcon name={isRefreshing ? "RefreshCw_loading" : "RefreshCw"} className="w-4 h-4 text-blue-400" />
            </button>

            <div className="relative">
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-700 transition-all flex items-center gap-2 group"
              >
                <WeatherIcon name="Navigation" className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
                Change Location
              </button>

            <AnimatePresence>
              {isSearchOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 z-50"
                >
                  <div className="bg-[#14181F] border border-gray-800 rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
                    <div className="relative flex items-center mb-2">
                      <Search className="absolute left-3 w-4 h-4 text-gray-500" />
                      <input 
                        autoFocus
                        type="search"
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Enter City or Zip Code..."
                        className="w-full bg-[#0A0C10] border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>
                    {searching && (
                      <div className="flex justify-center py-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <ul className="max-h-60 overflow-y-auto space-y-1">
                      {results.map((loc) => (
                        <li 
                          key={loc.id}
                          onClick={() => selectLocation(loc)}
                          className="px-3 py-2.5 hover:bg-white/5 rounded-lg cursor-pointer transition-colors text-sm border border-transparent hover:border-gray-800"
                        >
                          <div className="flex justify-between items-center text-gray-300">
                            <span>{loc.name}</span>
                            <span className="text-[10px] text-gray-500 uppercase">{loc.country}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>

      {/* Main Content Area */}
      <main className="flex-1 grid grid-cols-12 overflow-hidden relative">
        {loading ? (
          <div className="col-span-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono tracking-[0.2em] text-gray-500 uppercase">Synthesizing Atmospheric Data</span>
          </div>
        ) : weather && insights ? (
          <>
            {/* Left Panel: Agent Analysis */}
            <div className="col-span-12 lg:col-span-8 p-6 lg:p-12 flex flex-col justify-between overflow-y-auto custom-scrollbar">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-8">
                  AI Perspective • Real-time Synthesis
                </div>
                <h1 className="text-6xl md:text-[92px] leading-[0.85] font-light text-white tracking-tighter mb-10">
                  {weather.current.temp > 25 ? 'Solar' : weather.current.icon.includes('Rain') ? 'Precipitation' : 'Atmospheric'}<br/> 
                  <span className="font-medium text-blue-500 italic">
                    {weather.current.description.split(' ').pop()}.
                  </span>
                </h1>
                <div className="max-w-2xl text-lg md:text-xl text-gray-400 leading-relaxed font-light italic">
                  "{insights.summary}"
                </div>
              </motion.div>

              {/* Key Stats Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 lg:mt-0">
                <div className="bg-[#14181F] p-6 rounded-2xl border border-gray-800/50 hover:border-gray-700 transition-colors group">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-3 font-mono">Current Temperature</p>
                  <p className="text-4xl font-semibold text-white group-hover:text-blue-400 transition-colors">{weather.current.temp}°C</p>
                  <div className="text-blue-500/60 text-xs mt-2 flex items-center gap-1">
                    <WeatherIcon name="Thermometer" className="w-3 h-3" /> Real-feel stable
                  </div>
                </div>
                <div className="bg-[#14181F] p-6 rounded-2xl border border-gray-800/50 hover:border-gray-700 transition-colors group">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-3 font-mono">Wind Velocity</p>
                  <p className="text-4xl font-semibold text-white group-hover:text-blue-400 transition-colors">{weather.current.windSpeed} <span className="text-sm font-normal text-gray-500">km/h</span></p>
                  <div className="text-gray-500 text-xs mt-2 flex items-center gap-1">
                    <WeatherIcon name="Wind" className="w-3 h-3" /> Surface flow
                  </div>
                </div>
                <div className="bg-[#14181F] p-6 rounded-2xl border border-gray-800/50 hover:border-gray-700 transition-colors group">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-3 font-mono">Humidity Index</p>
                  <p className="text-4xl font-semibold text-white group-hover:text-blue-400 transition-colors">{weather.current.humidity}%</p>
                  <div className="text-green-500/60 text-xs mt-2 flex items-center gap-1">
                    <WeatherIcon name="Droplets" className="w-3 h-3" /> Optimal Range
                  </div>
                </div>
                <div className="bg-[#14181F] p-6 rounded-2xl border border-gray-800/50 hover:border-gray-700 transition-colors group">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-3 font-mono">Visibility Status</p>
                  <p className="text-4xl font-semibold text-white group-hover:text-blue-400 transition-colors">16 <span className="text-sm font-normal text-gray-500">km</span></p>
                  <div className="text-gray-500 text-xs mt-2 flex items-center gap-1">
                    <WeatherIcon name="Eye" className="w-3 h-3" /> High Clarity
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Forecasting & Detailed Data */}
            <div className="col-span-12 lg:col-span-4 bg-[#0D1016] border-l border-gray-800 p-8 flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-gray-500">3-Day Outlook</h2>
                <div className="w-8 h-[1px] bg-gray-800"></div>
              </div>
              
              <div className="space-y-4 mb-12">
                {weather.daily.map((day, idx) => (
                  <motion.div 
                    key={day.date}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (idx * 0.1) }}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all group ${
                      idx === 0 ? 'bg-[#14181F] border-blue-500/30' : 'bg-transparent border-transparent hover:bg-[#14181F]'
                    }`}
                  >
                    <span className={`w-16 text-sm font-medium ${idx === 0 ? 'text-white' : 'text-gray-500'}`}>
                      {idx === 0 ? 'Today' : format(new Date(day.date), 'EEE')}
                    </span>
                    <div className="flex-1 flex justify-center">
                      <div className="relative">
                        <WeatherIcon 
                          name={day.icon} 
                          className={`w-6 h-6 ${idx === 0 ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]' : 'text-gray-600'}`} 
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold ${idx === 0 ? 'text-white' : 'text-gray-400'}`}>{day.maxTemp}°</span>
                      <span className="text-sm text-gray-600">/</span>
                      <span className="text-sm font-medium text-gray-600">{day.minTemp}°</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Atmospheric Micro-Scan Radar */}
              <div className="mb-10 bg-[#11141B] border border-gray-800 rounded-2xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 font-mono">Atmospheric Micro-Radar</span>
                    <span className="text-xs text-gray-500 mt-0.5">Continuous Sector Analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={autoScanEnabled} 
                        onChange={(e) => setAutoScanEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:bg-white peer-checked:bg-blue-600"></div>
                      <span className="ml-2 text-[10px] uppercase font-mono text-gray-400 tracking-wider">AUTO</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <button 
                    onClick={startAutoScan}
                    disabled={isScanning}
                    className="flex-1 py-1.5 bg-gray-800/80 hover:bg-gray-800 border border-gray-700/60 rounded-lg text-xs font-mono uppercase tracking-wider text-gray-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <WeatherIcon name={isScanning ? "RefreshCw_loading" : "RefreshCw"} className="w-3.5 h-3.5 text-blue-400" />
                    {isScanning ? "Scanning..." : "Manual Sweep"}
                  </button>
                </div>

                {/* Simulated Radar Circular Scope */}
                <div className="relative h-28 bg-[#090B0F] border border-gray-800/60 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 border border-dashed border-gray-900/40 rounded-full m-3"></div>
                  <div className="absolute inset-0 border border-dashed border-gray-900/30 rounded-full m-8"></div>
                  <div className="absolute w-[1px] h-full bg-gray-900/40"></div>
                  <div className="absolute h-[1px] w-full bg-gray-900/40"></div>

                  {/* Scoped Coordinates dots */}
                  {selectedLocation && (
                    <div className="absolute text-[8px] font-mono text-gray-600 top-2 left-3">
                      LAT: {selectedLocation.latitude.toFixed(2)}N
                    </div>
                  )}

                  {/* Dynamic Scanner Blade */}
                  {isScanning && (
                    <motion.div 
                      className="absolute w-1/2 h-1/2 origin-bottom-right right-1/2 bottom-1/2 bg-gradient-to-tr from-blue-500/0 via-blue-500/5 to-blue-500/20"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      style={{ transformOrigin: "100% 100%" }}
                    />
                  )}

                  {scanResults.length > 0 ? (
                    <div className="absolute inset-0 p-3 flex flex-wrap gap-2 items-center justify-center pointer-events-none">
                      {scanResults.map((result, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-gray-900/80 border border-gray-800/80 px-2 py-1 rounded text-[9px] font-mono text-gray-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                          <span>{result.temp}°C</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] font-mono text-gray-500 text-center px-4">
                      {isScanning ? "Engaging radar beam harmonics..." : "Radar idle. Ready for thermal sector scan."}
                    </div>
                  )}
                </div>

                {/* Sector Results list */}
                {scanResults.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                    {scanResults.map((result, i) => (
                      <div key={i} className="flex justify-between items-center text-[10px] font-mono border-b border-gray-800/40 pb-1.5">
                        <div className="flex flex-col">
                          <span className="text-gray-300 font-medium">{result.name}</span>
                          <span className="text-gray-600 text-[8px]">{result.offsetLat}, {result.offsetLng}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400 font-bold">{result.temp}°C</span>
                          <span className="px-1.5 py-0.5 bg-gray-900 text-[8px] text-gray-400 rounded border border-gray-800">{result.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Smart Recommendations */}
              <div className="mt-auto space-y-4">
                <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.6 }}
                   className="p-6 bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-2xl border border-white/5"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-3 flex items-center gap-2">
                    <Info className="w-3 h-3" /> Smart Recommendation
                  </p>
                  <p className="text-sm leading-relaxed text-gray-400 font-light italic">
                    {insights.clothing[0]} and {insights.activities.recommended[0]} would be optimal for the current stabilization.
                  </p>
                </motion.div>

                <div className="grid grid-cols-2 gap-3 pb-8">
                  <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-800">
                    <p className="text-[9px] uppercase tracking-widest text-gray-600 mb-2 font-mono">Attire</p>
                    <p className="text-xs text-gray-300 font-medium truncate">{insights.clothing.slice(0, 2).join(', ')}</p>
                  </div>
                  <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-800">
                    <p className="text-[9px] uppercase tracking-widest text-gray-600 mb-2 font-mono">Filter</p>
                    <p className="text-xs text-gray-300 font-medium truncate">{insights.activities.avoid[0]}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="col-span-12 flex flex-col items-center justify-center py-40 text-center px-4">
            <div className="relative mb-12">
              <div className="w-24 h-24 bg-blue-500/5 rounded-full flex items-center justify-center border border-blue-500/10 transition-all duration-1000 scale-110"></div>
              <WeatherIcon name="Sparkles" className="absolute inset-0 m-auto w-10 h-10 text-blue-500/30" />
            </div>
            <h2 className="text-4xl font-light tracking-tight mb-4 text-white">Atmospheric Awakening.</h2>
            <p className="text-gray-500 max-w-md mx-auto leading-relaxed font-light italic">
              Synchronizing with regional sensors. Select a coordinate node or authorize local access to initiate synthesis.
            </p>
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20"
            >
              Initialize Node
            </button>
          </div>
        )}
      </main>

      {/* Footer Status Bar */}
      <footer className="px-8 py-4 bg-[#080A0E] border-t border-gray-900 shrink-0 flex justify-between items-center text-[10px] text-gray-600 uppercase tracking-[0.25em] font-medium font-mono">
        <div className="flex gap-8 items-center">
          <span className="flex items-center gap-1.5">
            <div className={`w-1 h-1 rounded-full ${isRefreshing ? 'bg-blue-400 animate-ping' : 'bg-blue-500 animate-pulse'}`} /> 
            Sensor Mesh: {isRefreshing ? 'Synchronizing' : 'Active'}
          </span>
          <span className="hidden md:inline">Latency: 38ms</span>
          <span className="hidden sm:inline text-blue-500/70">Author: Gilbert Algordo</span>
          {lastSynced && (
            <span className="hidden lg:inline text-gray-700">
              Last Sync: {format(lastSynced, 'HH:mm:ss')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-1 h-1 rounded-full ${insights ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span>AI Engine {insights ? 'Fully Synchronized' : 'Ready'}</span>
        </div>
      </footer>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1A1D23;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #252A32;
        }
      `}</style>
    </div>
  );
}
