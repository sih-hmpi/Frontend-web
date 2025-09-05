"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

interface Well {
  _id: string;
  STATE: string;
  DISTRICT: string;
  LAT: number;
  LON: number;
  SITE_TYPE: string;
  WLCODE: string;
  measurements: Record<string, number | null>;
}

const defaultCenter: LatLngExpression = [20.5937, 78.9629]; // Center of India

function MapComponent() {
  const [wells, setWells] = useState<Well[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/welldata')
      .then(res => res.json())
      .then(data => {
        setWells(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching wells:', error);
        setLoading(false);
      });
  }, []);

  if (typeof window === 'undefined') {
    return null; // Return null during SSR
  }

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading well data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <MapContainer
        center={defaultCenter}
        zoom={5}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {wells.map((well) => (
          <CircleMarker
            key={well._id || well.WLCODE}
            center={[well.LAT, well.LON]}
            radius={6}
            pathOptions={{
              fillColor: "#3b82f6",
              color: "#2563eb",
              weight: 1,
              opacity: 0.8,
              fillOpacity: 0.6,
            }}
          >
            <Popup>
              <div className="space-y-2">
                <h3 className="font-semibold">{well.DISTRICT}, {well.STATE}</h3>
                <p><strong>Site Type:</strong> {well.SITE_TYPE}</p>
                <p><strong>Well Code:</strong> {well.WLCODE}</p>
                <div className="text-sm">
                  <p className="font-medium">Latest Measurements:</p>
                  <div className="max-h-40 overflow-y-auto">
                    {Object.entries(well.measurements || {}).slice(-5).map(([date, value]) => (
                      <div key={date} className="grid grid-cols-2 gap-2">
                        <span>{date}:</span>
                        <span>{value === null ? 'NA' : `${value}m`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

export default MapComponent;