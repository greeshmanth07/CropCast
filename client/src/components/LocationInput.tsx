import React, { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Check, ChevronDown, Loader2 } from "lucide-react";
import {
  SOUTH_INDIA_LOCATIONS,
  SouthIndiaLocation,
  searchSouthIndiaLocations,
  formatLocationString,
  findNearestSouthIndiaLocation,
} from "@/lib/southIndiaLocations";

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  onSelectLocation?: (loc: SouthIndiaLocation) => void;
}

export function LocationInput({
  value,
  onChange,
  placeholder = "e.g. Guntur, Andhra Pradesh",
  id = "location-input",
  className = "",
  onSelectLocation,
}: LocationInputProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [isDetecting, setIsDetecting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredLocations = searchSouthIndiaLocations(query, 7);

  const handleSelect = (loc: SouthIndiaLocation) => {
    const formatted = formatLocationString(loc);
    setQuery(formatted);
    onChange(formatted);
    onSelectLocation?.(loc);
    setOpen(false);
  };

  const handleDetectLocation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsDetecting(false);
        const { latitude, longitude } = position.coords;
        const nearest = findNearestSouthIndiaLocation(latitude, longitude);
        const formatted = formatLocationString(nearest);
        setQuery(formatted);
        onChange(formatted);
        onSelectLocation?.(nearest);
        setOpen(false);
      },
      (error) => {
        setIsDetecting(false);
        console.warn("Geolocation permission denied or unavailable:", error);
        // Default to Guntur, Andhra Pradesh
        const defaultLoc = SOUTH_INDIA_LOCATIONS[0];
        const formatted = formatLocationString(defaultLoc);
        setQuery(formatted);
        onChange(formatted);
        onSelectLocation?.(defaultLoc);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <MapPin
          size={17}
          className="absolute left-3 text-[#2d6a4f] pointer-events-none"
        />
        <input
          id={id}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-24 py-2 text-sm bg-white border border-[#c3dbcd] rounded-lg text-[#1f2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent transition"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={isDetecting}
          className="absolute right-1.5 px-2.5 py-1 text-xs font-semibold bg-[#e8f5ed] hover:bg-[#d5edd9] text-[#1f6b45] rounded-md flex items-center gap-1 transition shadow-xs"
          title="Detect Current Location"
        >
          {isDetecting ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Navigation size={12} />
          )}
          <span>{isDetecting ? "Detecting..." : "Detect"}</span>
        </button>
      </div>

      {open && filteredLocations.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#c3dbcd] rounded-lg shadow-lg max-h-56 overflow-y-auto divide-y divide-gray-100">
          <div className="px-3 py-1.5 bg-[#f5faf7] text-[11px] font-bold text-[#2d6a4f] uppercase tracking-wider">
            South Indian Agricultural Hubs & Mandis
          </div>
          {filteredLocations.map((loc, idx) => {
            const formatted = formatLocationString(loc);
            const isSelected = value.toLowerCase() === formatted.toLowerCase();
            return (
              <button
                key={`${loc.city}-${loc.state}-${idx}`}
                type="button"
                onClick={() => handleSelect(loc)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-[#f0f9f3] transition ${
                  isSelected ? "bg-[#e8f5ee] font-semibold text-[#1b5e39]" : "text-gray-700"
                }`}
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {loc.city}, <span className="text-xs text-gray-500">{loc.district} District</span>
                  </div>
                  <div className="text-xs text-[#2d6a4f]">
                    {loc.state} {loc.marketHub ? `· ${loc.marketHub}` : ""}
                  </div>
                </div>
                {isSelected && <Check size={15} className="text-[#2d6a4f]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
