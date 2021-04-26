import React from 'react';
import { last } from 'lodash';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { shorten } from 'utils/NumberUtils';
import { useChart } from '../hooks/useChart';
import { useUsageState } from '../hooks/usageContext';

const styles = {
  chartWrapper: css({
    height: '512px',
    width: '100%',
  }),
};

const accumulation = (acc, value) => acc.concat(value + (last(acc) || 0));

export const accumulate = (data) => data.reduce(accumulation, []);

export const applyBorderStyle = (value) => ({
  value,
  itemStyle: { borderWidth: value > 0 ? 2 : 0 },
});

const propsToChartOption = ({ period, usage, includedLimit }) => {
  const dataWithStyle = accumulate(usage).map(applyBorderStyle);

  const markLine = {
    symbol: ['none', 'circle'],
    data: [{ yAxis: includedLimit }],
    lineStyle: {
      color: '#CC3C52',
    },
    label: {
      show: false,
    },
  };

  return {
    xAxis: {
      data: period,
      type: 'category',
      axisLabel: {
        color: '#6A7889',
        fontFamily: tokens.fontStackPrimary,
        fontSize: 14,
      },
      axisLine: {
        lineStyle: {
          color: '#B4C3CA',
        },
      },
    },
    yAxis: {
      scale: false,
      min: 0,
      position: 'right',
      splitLine: {
        lineStyle: {
          color: '#D3DCE0',
          type: 'dashed',
        },
      },
      axisLabel: {
        color: '#536171',
        fontFamily: tokens.fontStackPrimary,
        fontSize: 14,
        formatter: shorten,
      },
      axisLine: {
        lineStyle: {
          color: '#B4C3CA',
        },
      },
    },
    series: [
      {
        data: dataWithStyle,
        name: 'API Requests',
        type: 'bar',
        itemStyle: {
          color: '#2E75D4',
          borderColor: '#2E75D4',
          opacity: 0.5,
        },
        markLine: includedLimit ? markLine : undefined,
      },
    ],
    grid: {
      left: '50px',
      right: '50px',
      bottom: 70,
    },
    dataZoom: [
      {
        id: 'dataZoomX',
        type: 'slider',
      },
      {
        type: 'inside',
        throttle: 50,
        filterMode: 'filter',
      },
    ],
    tooltip: {
      show: true,
      trigger: 'axis',
      backgroundColor: '#192532',
    },
    toolbox: {
      show: true,
      feature: {
        saveAsImage: {
          show: true,
          type: 'png',
          name: `Organization-Usage-${new Date().toDateString()}`,
          title: 'Save as an image',
        },
        magicType: {
          type: ['line', 'bar'],
          title: {
            line: 'Line Chart',
            bar: 'Bar Chart',
          },
        },
      },
    },
  };
};

export const OrganizationBarChart = () => {
  const { periodDates, periodicUsage, apiRequestIncludedLimit, isLoading } = useUsageState();

  const usage = isLoading ? [] : periodicUsage?.org.usage;
  const chartRef = useChart(
    propsToChartOption({
      period: periodDates,
      usage,
      includedLimit: apiRequestIncludedLimit,
    })
  );
  return (
    <div
      ref={chartRef}
      className={styles.chartWrapper}
      data-test-id="organization-usage-bar-chart"
    />
  );
};
