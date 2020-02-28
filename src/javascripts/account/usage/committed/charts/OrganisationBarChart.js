/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React, { Component } from 'react';
import * as echarts from 'echarts';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import periodToDates from './periodToDates';

const styles = {
  chartWrapper: css({
    height: '450px',
    width: '853px'
  })
};

const chartOptions = (period, usage) => {
  return {
    xAxis: {
      data: periodToDates(period),
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
        fontSize: 14
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
          borderWidth: 2,
          borderColor: '#2E75D4',
          opacity: 0.5
        },
        data: usage,
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
      left: '2%',
      right: '5%'
    },
    dataZoom: [
      {
        id: 'dataZoomX',
        type: 'inside',
        xAxisIndex: [0],
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
          name: `Organisation-Usage-${new Date().toDateString()}`,
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

export default class OrganisationBarChart extends Component {
  constructor(props) {
    super(props);
    this.options = chartOptions(props.period, props.usage);
  }

  componentDidUpdate() {
    const { period, usage } = this.props;
    this.options = chartOptions(period, usage);
    this.chartInstance.setOption(this.options);
  }

  componentDidMount() {
    this.chartInstance = echarts.init(this.ref);
    this.chartInstance.setOption(this.options);
  }

  render() {
    return (
      <div
        ref={ref => {
          this.ref = ref;
        }}
        className={styles.chartWrapper}></div>
    );
  }
}

OrganisationBarChart.propTypes = {
  period: PropTypes.object,
  usage: PropTypes.array
};
