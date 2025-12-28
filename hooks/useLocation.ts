import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  nearestAirport?: string;
}

export const useLocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Location permission denied');
        setLoading(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode to get location details
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses.length > 0) {
        const address = addresses[0];
        
        // Estimate nearest major airport (simplified logic)
        const nearestAirport = estimateNearestAirport(latitude, longitude, address.city);

        setLocation({
          latitude,
          longitude,
          city: address.city || undefined,
          country: address.country || undefined,
          nearestAirport,
        });
      } else {
        setLocation({ latitude, longitude });
      }

      setLoading(false);
    } catch (err) {
      setError('Failed to get location');
      setLoading(false);
    }
  };

  return {
    location,
    loading,
    error,
    refresh: getCurrentLocation,
  };
};

// Simplified airport estimation - in production, use proper airport database
const estimateNearestAirport = (lat: number, lon: number, city?: string): string => {
  // Major US cities mapping (expand this in production)
  const cityAirports: Record<string, string> = {
    'San Francisco': 'SFO',
    'Los Angeles': 'LAX',
    'New York': 'JFK',
    'Chicago': 'ORD',
    'Miami': 'MIA',
    'Seattle': 'SEA',
    'Boston': 'BOS',
    'Atlanta': 'ATL',
    'Dallas': 'DFW',
    'Houston': 'IAH',
    'Denver': 'DEN',
    'Las Vegas': 'LAS',
    'Phoenix': 'PHX',
    'Washington': 'DCA',
  };

  if (city && cityAirports[city]) {
    return cityAirports[city];
  }

  // Default fallback - in production, calculate distance to nearest airport
  return 'UNKNOWN';
};
