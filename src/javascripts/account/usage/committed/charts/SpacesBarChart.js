import React from 'react';
import PropTypes from 'prop-types';
import { organizationResourceUsagePropType } from '../propTypes';
import tokens from '@contentful/forma-36-tokens';
import { shorten } from 'utils/NumberUtils';
import { css } from 'emotion';
import { useChart } from './hooks/useChart';

const styles = {
  chartWrapper: css({
    height: '512px',
    width: '100%'
  })
};

const propsToChartOptions = ({ spaceNames, data, period, colours }) => {
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

  return {
    legend: {
      show: true,
      icon: 'rect',
      left: '50px'
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
      left: '50px',
      right: '50px',
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
        lineStyle: {
          color: '#D3DCE0',
          type: 'dashed'
        }
      },
      axisLabel: {
        textStyle: {
          color: '#536171',
          fontFamily: tokens.fontStackPrimary,
          fontSize: 14
        },
        formatter: shorten
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
        throttle: 60
      },
      {
        type: 'slider'
      }
    ],
    series: series
  };
};

const SpacesBarChart = props => {
  const chartRef = useChart(propsToChartOptions(props));
  return <div ref={chartRef} className={styles.chartWrapper} data-test-id="api-usage-bar-chart" />;
};

SpacesBarChart.propTypes = {
  data: PropTypes.arrayOf(organizationResourceUsagePropType).isRequired,
  period: PropTypes.arrayOf(PropTypes.string).isRequired,
  spaceNames: PropTypes.objectOf(PropTypes.string).isRequired,
  isLoading: PropTypes.bool,
  colours: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default SpacesBarChart;
