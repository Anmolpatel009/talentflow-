import React, { useState, useEffect, useMemo } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';

interface Freelancer {
  id: string;
  latitude: number;
  longitude: number;
  // Add any other freelancer properties you need
}

interface FreelancerMapProps {
  freelancers: Freelancer[];
}

const containerStyle = {
  width: '100%',
  height: '500px'
};

const defaultCenter = {
  lat: 40.7128, // Example: New York City latitude
  lng: -74.0060 // Example: New York City longitude
};

const libraries: ('places' | 'drawing' | 'geometry')[] = ['places'];

const FreelancerMap: React.FC<FreelancerMapProps> = ({ freelancers }) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string, // Use environment variable for API key
    libraries,
  });

  const onLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  };

  const onUnmount = () => {
    setMap(null);
  };

  const renderMap = useMemo(() => {
    if (loadError) return <div>Error loading maps</div>;
    if (!isLoaded) return <div>Loading Maps...</div>;

    return (
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={10}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {freelancers.map(freelancer => (
          <Marker
            key={freelancer.id}
            position={{
              lat: freelancer.latitude,
              lng: freelancer.longitude
            }}
            // You can customize marker icon here if needed
          />
        ))}
      </GoogleMap>
    );
  }, [isLoaded, loadError, freelancers]); // Re-render map when these dependencies change

  return (
    <div className="freelancer-map-container">
      {renderMap}
    </div>
  );
};

export default FreelancerMap;