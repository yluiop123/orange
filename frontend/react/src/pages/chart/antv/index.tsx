import { Area, AreaConfig, PlotEvent } from '@ant-design/plots';
import React from 'react';
import localData from './data.json';
const Chart = React.memo(
  ({ onReady }: ChartProps) => {
    const config = {
      data:localData,
      xField: 'date',
      yField: 'value',
      colorField: 'country',
      shapeField: 'smooth',
      stack: true,
      onReady,
    };
    return <Area {...config} />;
  },
  () => true,
);
interface Data {
  date: string;
  value: number;
  country: string;
}
interface ChartProps {
  onReady?: AreaConfig['onReady'];
}
export default function Index() {
  const [data, setData] = React.useState<Data[]>([]);
  return (
    <div style={{ height: '100%' }}>
      {data.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            zIndex: 10,
            background: '#ccc',
            padding: '10px',
            borderRadius: '6px',
          }}
        >
          {data.map((d, i) => (
            <div key={i}>
              {d.country} : {d.value}
            </div>
          ))}
        </div>
      )}
      <Chart
        onReady={({ chart }) => {
          chart.on('plot:click', (e: PlotEvent) => {
            const { x, y } = e;
            setData(chart.getDataByXY({ x, y }, { shared: true }));
          });
        }}
      />
    </div>
  );
};
