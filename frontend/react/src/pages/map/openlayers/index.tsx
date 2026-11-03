
import { XYZ } from 'ol/source';
import { Map, TileLayer, View } from 'react-openlayers';
import 'react-openlayers/dist/index.css'; // for css

export default function Index() {
    return (
    <Map 
    // controls={[]} interactions={[]}
    style={{ width: '100%', height: '100%' }}>
      <TileLayer
        source={
          new XYZ({
            url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            crossOrigin: 'anonymous',
          })
        }
      />
      <View center={[-10997148, 4569099]} zoom={4} />
    </Map>
    )
}
// import Map from 'ol/Map'
// import View from 'ol/View'
// import TileLayer from 'ol/layer/Tile'
// import 'ol/ol.css'
// import XYZ from 'ol/source/XYZ'
// import { useEffect, useRef } from 'react'

// export default function Index() {
//   const mapRef = useRef<HTMLDivElement | null>(null)

//   useEffect(() => {
//     if (!mapRef.current) return

//     const map = new Map({
//       target: mapRef.current,
//       layers: [
//         new TileLayer({
//           source: new XYZ({
//             url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
//             crossOrigin: 'anonymous',
//           }),
//         }),
//       ],
//       view: new View({
//         center: [-10997148, 4569099],
//         zoom: 4,
//       }),
//     })

//     return () => {
//       map.setTarget(undefined)
//     }
//   }, [])

//   return (
//     <div
//       ref={mapRef}
//       style={{ width: '100%', height: '100%' }}
//     />
//   )
// }
