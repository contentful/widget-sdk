import React from 'react';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { shorten } from 'utils/NumberUtils';
import { useChart } from './hooks/useChart';

const styles = {
  chartWrapper: css({
    height: '450px',
    width: '853px'
  })
};

const propsToChartOption = ({ period, usage }) => {
  return {
    xAxis: {
      data: period,
      type: 'category',
      axisLabel: {
        color: '#6A7889',
        fontFamily: tokens.fontStackPrimary,
        fontSize: 14
      },
      axisLine: {
        lineStyle: {
          color: '#B4C3CA'
        }
      }
    },
    yAxis: {
      scale: false,
      position: 'right',
      axisLabel: {
        color: '#536171',
        fontFamily: tokens.fontStackPrimary,
        fontSize: 14,
        formatter: value => shorten(value)
      },
      axisLine: {
        lineStyle: {
          color: '#B4C3CA'
        }
      }
    },
    series: [
      {
        name: 'API Requests',
        type: 'bar',
        itemStyle: {
          color: '#2E75D4',
          borderColor: '#2E75D4',
          opacity: 0.5
        },
        data: usage.map(val => ({
          value: val,
          itemStyle: {
            borderWidth: val > 0 ? 2 : 0
          }
        })),
        areaStyle: {},
        markLine: {
          symbol: ['none', 'circle'],
          data: [
            {
              type: 'max'
            }
          ],
          lineStyle: {
            color: '#CC3C52'
          },
          label: {
            show: false
          }
        }
      }
    ],
    grid: {
      left: '5%',
      right: '5%',
      bottom: 70
    },
    dataZoom: [
      {
        id: 'dataZoomX',
        type: 'slider'
      },
      {
        type: 'inside',
        throttle: 50,
        filterMode: 'filter'
      }
    ],
    tooltip: {
      show: true,
      trigger: 'axis',
      backgroundColor: '#192532'
    },
    toolbox: {
      show: true,
      feature: {
        saveAsImage: {
          show: true,
          type: 'png',
          name: `Organization-Usage-${new Date().toDateString()}`,
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
    }
  };
};

const OrganizationBarChart = props => {
  const chartRef = useChart(propsToChartOption(props));
  return <div ref={chartRef} className={styles.chartWrapper}></div>;
};

OrganizationBarChart.propTypes = {
  period: PropTypes.arrayOf(PropTypes.string).isRequired,
  usage: PropTypes.array
};

export default OrganizationBarChart;
