import { useEffect, useState, useRef } from 'react';
import * as echarts from 'echarts';

export const useChart = props => {
  const chartRef = useRef();
  const [myChart, setMyChart] = useState(null);

  useEffect(() => {
    if (chartRef.current) {
      const chart = echarts.init(chartRef.current);
      setMyChart(chart);
    }
  }, []);

  useEffect(() => {
    if (myChart) {
      myChart.setOption(props);
    }
  });

  return chartRef;
};
