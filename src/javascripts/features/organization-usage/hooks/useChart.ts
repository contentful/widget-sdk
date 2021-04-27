import { useEffect, useState, useRef } from 'react';

import * as echarts from 'echarts';

export const useChart = (props) => {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [chart, setChart] = useState(null);

  useEffect(() => {
    if (chartRef.current) {
      setChart(echarts.init(chartRef.current));
    }
  }, []);

  useEffect(() => {
    if (chart) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      chart.setOption(props);
    }
  });

  return chartRef;
};
