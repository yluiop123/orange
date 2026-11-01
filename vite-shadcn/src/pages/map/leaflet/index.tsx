import 'leaflet/dist/leaflet.css'
import '@/lib/fixLeafletIcon'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

const center: [number, number] = [39.9042, 116.4074] // 北京

export default function MapView() {
  return (
    <MapContainer
      center={center}
      zoom={10}
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={center}>
        <Popup>
          北京 <br /> 天安门
        </Popup>
      </Marker>
    </MapContainer>
  )
}
