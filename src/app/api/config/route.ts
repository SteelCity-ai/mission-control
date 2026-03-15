/**
 * Location Config API
 * GET/POST /api/config
 * Stores and retrieves user preferences including location
 */
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'data', 'config.json');

// Default config
const DEFAULT_CONFIG = {
  location: {
    city: 'Pittsburgh',
    timezone: 'America/New_York',
    // Pittsburgh coordinates
    latitude: 40.4406,
    longitude: -79.9959,
  },
};

function readConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch (error) {
    console.error('[config] Error reading config:', error);
  }
  return { ...DEFAULT_CONFIG };
}

function writeConfig(config: Record<string, unknown>) {
  try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('[config] Error writing config:', error);
    return false;
  }
}

// City/timezone presets
export const LOCATION_PRESETS = [
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

export async function GET() {
  const config = readConfig();
  return NextResponse.json(config);
}

export async function POST(request: Request) {
  try {
    const { action, data } = await request.json();
    const config = readConfig();
    
    if (action === 'update_location') {
      const { city, timezone, latitude, longitude } = data;
      
      config.location = {
        city: city || config.location?.city || 'Pittsburgh',
        timezone: timezone || config.location?.timezone || 'America/New_York',
        latitude: latitude ?? config.location?.latitude ?? 40.4406,
        longitude: longitude ?? config.location?.longitude ?? -79.9959,
      };
      
      if (writeConfig(config)) {
        return NextResponse.json({ success: true, location: config.location });
      }
      return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[config] Error:', error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
