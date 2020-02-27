import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { organizationResourceUsagePropType } from '../propTypes';
import tokens from '@contentful/forma-36-tokens';
import { shorten } from 'utils/NumberUtils';

const setOptions = (chart, spaceNames, data, period, colours) => {
  const series = data.map((item, index) => ({
    name: spaceNames[item.sys.space.sys.id],
    type: 'bar',
    data: item.usage,
    itemStyle: {
      color: colours[index]
    }
  }));

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    toolbox: {
      feature: {
        saveAsImage: {
          title: 'Save'
        }
      }
    },
    xAxis: {
      type: 'category',
      axisLabel: {
        textStyle: {
          color: '#6A7889',
          fontFamily: tokens.fontStackPrimary,
          fontSize: 14
        }
      },
      splitLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLine: {
        lineStyle: {
          color: '#B4C3CA'
        }
      },
      data: period
    },
    yAxis: {
      type: 'value',
      position: 'right',
      splitLine: {
        show: false
      },
      axisLabel: {
        textStyle: {
          color: '#536171',
          fontFamily: tokens.fontStackPrimary,
          fontSize: 14
        },
        formatter: value => shorten(value)
      },
      axisLine: {
        lineStyle: {
          color: '#B4C3CA'
        }
      }
    },
    dataZoom: [
      {
        type: 'inside',
        throttle: 50
      }
    ],
    series: series
  };
  chart.setOption(option);
};

const SpacesBarChart = ({ spaceNames, data, period, colours }) => {
  const chartRef = useRef();
  const echarts = require('echarts');

  const [myChart, setMyChart] = useState(null);

  // only initialise once
  useEffect(() => {
    if (chartRef.current) {
      const chart = echarts.init(chartRef.current);
      setMyChart(chart);
    }
  }, [echarts]);

  useEffect(() => {
    if (myChart) {
      setOptions(myChart, spaceNames, data, period, colours);
    }
  });

  return <div ref={chartRef} style={{ width: '853px', height: '450px' }} />;
};

SpacesBarChart.propTypes = {
  data: PropTypes.arrayOf(organizationResourceUsagePropType).isRequired,
  period: PropTypes.arrayOf(PropTypes.string).isRequired,
  spaceNames: PropTypes.objectOf(PropTypes.string).isRequired,
  isLoading: PropTypes.bool,
  colours: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default SpacesBarChart;
