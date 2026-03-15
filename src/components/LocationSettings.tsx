"use client";

import { useEffect, useState } from "react";
import { MapPin, Loader2, Check } from "lucide-react";

interface LocationConfig {
  city: string;
  timezone: string;
  latitude: number;
  longitude: number;
}

const LOCATION_PRESETS = [
  { city: 'Pittsburgh', timezone: 'America/New_York', latitude: 40.4406, longitude: -79.9959 },
  { city: 'New York', timezone: 'America/New_York', latitude: 40.7128, longitude: -74.006 },
  { city: 'Los Angeles', timezone: 'America/Los_Angeles', latitude: 34.0522, longitude: -118.2437 },
  { city: 'Chicago', timezone: 'America/Chicago', latitude: 41.8781, longitude: -87.6298 },
  { city: 'London', timezone: 'Europe/London', latitude: 51.5074, longitude: -0.1278 },
  { city: 'Paris', timezone: 'Europe/Paris', latitude: 48.8566, longitude: 2.3522 },
  { city: 'Tokyo', timezone: 'Asia/Tokyo', latitude: 35.6762, longitude: 139.6503 },
  { city: 'Sydney', timezone: 'Australia/Sydney', latitude: -33.8688, longitude: 151.2093 },
  { city: 'Madrid', timezone: 'Europe/Madrid', latitude: 40.4168, longitude: -3.7038 },
  { city: 'Berlin', timezone: 'Europe/Berlin', latitude: 52.52, longitude: 13.405 },
  { city: 'Toronto', timezone: 'America/Toronto', latitude: 43.6532, longitude: -79.3832 },
  { city: 'Vancouver', timezone: 'America/Vancouver', latitude: 49.2827, longitude: -123.1207 },
];

interface LocationSettingsProps {
  location: LocationConfig | null;
  onLocationChange: (location: LocationConfig) => void;
}

export function LocationSettings({ location, onLocationChange }: LocationSettingsProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedCity, setSelectedCity] = useState(location?.city || 'Pittsburgh');

  useEffect(() => {
    if (location?.city) {
      setSelectedCity(location.city);
    }
  }, [location]);

  const handleCityChange = async (cityName: string) => {
    setSelectedCity(cityName);
    const preset = LOCATION_PRESETS.find(p => p.city === cityName);
    if (preset) {
      setSaving(true);
      try {
        const res = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_location',
            data: preset,
          }),
        });
        const data = await res.json();
        if (data.success) {
          onLocationChange(data.location);
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }
      } catch (error) {
        console.error('Failed to save location:', error);
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div 
      className="rounded-xl p-6"
      style={{ 
        backgroundColor: "var(--card)", 
        border: "1px solid var(--border)" 
      }}
    >
      <h2 
        className="text-xl font-semibold mb-6 flex items-center gap-2"
        style={{ color: "var(--text-primary)" }}
      >
        <MapPin className="w-5 h-5" style={{ color: "var(--accent)" }} />
        Location & Time
      </h2>

      <div className="space-y-4">
        <div>
          <label 
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            City
          </label>
          <select
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
            disabled={saving}
            className="w-full px-4 py-2.5 rounded-lg border transition-colors disabled:opacity-50"
            style={{ 
              backgroundColor: "var(--card-elevated)", 
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          >
            {LOCATION_PRESETS.map((preset) => (
              <option key={preset.city} value={preset.city}>
                {preset.city} ({preset.timezone})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--accent)" }} />}
          {saved && <Check className="w-4 h-4" style={{ color: "var(--success)" }} />}
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {saving ? 'Saving...' : saved ? 'Saved!' : location ? `Timezone: ${location.timezone}` : 'Loading...'}
          </span>
        </div>

        {location && (
          <div 
            className="mt-4 pt-4 text-sm"
            style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}
          >
            <p>Current location: {location.city}</p>
            <p>Coordinates: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
