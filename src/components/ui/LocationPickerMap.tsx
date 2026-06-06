import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix broken marker icon in Vite/Webpack by using standard CDN links
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component to recenter map when lat/lng props change from outside
function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (center[0] && center[1]) {
            map.flyTo(center, map.getZoom());
        }
    }, [center, map]);
    return null;
}

interface LocationPickerMapProps {
    lat: number;
    lng: number;
    onLocationChange: (lat: number, lng: number) => void;
}

export default function LocationPickerMap({ lat, lng, onLocationChange }: LocationPickerMapProps) {
    const [position, setPosition] = useState<[number, number]>([lat || 10.7769, lng || 106.7009]);
    const markerRef = useRef<L.Marker>(null);

    // Sync position with props when props change (e.g. user selects a different district)
    useEffect(() => {
        if (lat && lng && (lat !== position[0] || lng !== position[1])) {
            setPosition([lat, lng]);
        }
    }, [lat, lng]);

    const eventHandlers = React.useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const newPos = marker.getLatLng();
                    setPosition([newPos.lat, newPos.lng]);
                    onLocationChange(newPos.lat, newPos.lng);
                }
            },
        }),
        [onLocationChange]
    );

    return (
        <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker
                    draggable={true}
                    eventHandlers={eventHandlers}
                    position={position}
                    ref={markerRef}
                >
                    <Popup minWidth={90}>
                        <span>Kéo ghim để thay đổi tọa độ</span>
                    </Popup>
                </Marker>
                <ChangeView center={position} />
            </MapContainer>
        </div>
    );
}
