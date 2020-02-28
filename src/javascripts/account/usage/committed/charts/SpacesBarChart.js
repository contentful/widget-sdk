import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { organizationResourceUsagePropType } from '../propTypes';
import tokens from '@contentful/forma-36-tokens';
import { shorten } from 'utils/NumberUtils';
import { css } from 'emotion';
import * as echarts from 'echarts';

const styles = {
  chartWrapper: css({
    height: '450px',
    width: '853px'
  })
};

const setOptions = (chart, spaceNames, data, period, colours) => {
  const series = data.map((item, index) => ({
    name: spaceNames[item.sys.space.sys.id] || 'Deleted space',
    type: 'bar',
    data: item.usage.map(val => ({
      value: val,
      itemStyle: {
        borderWidth: val > 0 ? 2 : 0
      }
    })),
    itemStyle: {
      color: colours[index],
      borderColor: colours[index],
      opacity: 0.5
    }
  }));

  const option = {
    legend: {
      show: true
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    toolbox: {
      feature: {
        saveAsImage: {
          title: 'Save as an image'
        },
        magicType: {
          type: ['line', 'bar'],
          title: {
            line: 'Line Chart',
            bar: 'Bar Chart'
          }
        }
      }
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: 70
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
      },
      {
        type: 'slider'
      }
    ],
    series: series
  };
  chart.setOption(option);
};

const SpacesBarChart = ({ spaceNames, data, period, colours }) => {
  const chartRef = useRef();

  const [myChart, setMyChart] = useState(null);

  // only initialise once
  useEffect(() => {
    if (chartRef.current) {
      const chart = echarts.init(chartRef.current);
      setMyChart(chart);
    }
  }, []);

  useEffect(() => {
    if (myChart) {
      setOptions(myChart, spaceNames, data, period, colours);
    }
  });

  return <div ref={chartRef} className={styles.chartWrapper} />;
};

SpacesBarChart.propTypes = {
  data: PropTypes.arrayOf(organizationResourceUsagePropType).isRequired,
  period: PropTypes.arrayOf(PropTypes.string).isRequired,
  spaceNames: PropTypes.objectOf(PropTypes.string).isRequired,
  isLoading: PropTypes.bool,
  colours: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default SpacesBarChart;
