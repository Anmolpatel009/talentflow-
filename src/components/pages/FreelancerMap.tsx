"use client";

import React, { useMemo } from 'react';
import { GoogleMap, useLoadScript, MarkerF } from '@react-google-maps/api';
import type { User } from '@/lib/users';
import { Skeleton } from '../ui/skeleton';

interface FreelancerMapProps {
  freelancers: User[];
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: 'var(--radius)',
};

const defaultCenter = {
  lat: 37.7749, // Default: San Francisco
  lng: -122.4194,
};

const libraries: ('places' | 'drawing' | 'geometry')[] = ['places'];

export function FreelancerMap({ freelancers }: FreelancerMapProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const mapCenter = useMemo(() => {
    if (freelancers.length > 0) {
      const totalLat = freelancers.reduce((sum, f) => sum + (f.latitude ?? defaultCenter.lat), 0);
      const totalLng = freelancers.reduce((sum, f) => sum + (f.longitude ?? defaultCenter.lng), 0);
      return {
        lat: totalLat / freelancers.length,
        lng: totalLng / freelancers.length
      };
    }
    return defaultCenter;
  }, [freelancers]);

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-destructive/10 text-destructive">
        Error loading maps. Please check the API key.
      </div>
    );
  }

  if (!isLoaded) {
    return <Skeleton className="w-full h-full" />;
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={mapCenter}
      zoom={12}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }}
    >
      {freelancers.map(freelancer =>
        freelancer.latitude && freelancer.longitude ? (
          <MarkerF
            key={freelancer.id}
            position={{
              lat: freelancer.latitude,
              lng: freelancer.longitude,
            }}
            title={freelancer.name}
          />
        ) : null
      )}
    </GoogleMap>
  );
}
