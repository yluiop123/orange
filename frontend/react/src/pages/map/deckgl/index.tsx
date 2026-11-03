import type { PickingInfo } from '@deck.gl/core';
import { ColumnLayer } from '@deck.gl/layers';
import { DeckGL } from '@deck.gl/react';

type DataType = {
  value: number;
  centroid: [longitude: number, latitude: number];
};

export default function Index() {
  const layer = new ColumnLayer<DataType>({
    id: 'ColumnLayer',
    data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/hexagons.json',
    diskResolution: 12,
    extruded: true,
    radius: 250,
    elevationScale: 5000,
    getElevation: (d: DataType) => d.value,
    getFillColor: (d: DataType) => [48, 128, d.value * 255, 255],
    getPosition: (d: DataType) => d.centroid,
    pickable: true
  });

  return <DeckGL
    initialViewState={{
      longitude: -122.4,
      latitude: 37.74,
      zoom: 11
    }}
    controller
    getTooltip={({ object }: PickingInfo<DataType>) => {
      // 确保返回的是字符串类型，而不是 undefined
      return object ? `height: ${object.value * 5000}m` : '';
    }}
    layers={[layer]}
  />;
}