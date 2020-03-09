import { useEffect, useState, useRef } from 'react';

import * as echarts from 'echarts';

export const useChart = props => {
  const chartRef = useRef();
  const [chart, setChart] = useState(null);

  useEffect(() => {
    if (chartRef.current) {
      setChart(echarts.init(chartRef.current));
    }
  }, []);

  useEffect(() => {
    if (chart) {
      chart.setOption(props);
    }
  });

  return chartRef;
};
