import React from 'react';
import tokens from '@contentful/forma-36-tokens';
import { shorten } from 'utils/NumberUtils';
import { css } from 'emotion';
import { useChart } from '../hooks/useChart';
import { useUsageState, colours } from '../hooks/usageContext';

const styles = {
  chartWrapper: css({
    height: '512px',
    width: '100%',
  }),
};

const propsToChartOptions = ({ spaceNames, data, period }) => {
  const series = data.map((item, index) => ({
    name: item.sys.space.sys.id,
    type: 'bar',
    data: item.usage.map((val) => ({
      value: val,
      itemStyle: {
        borderWidth: val > 0 ? 2 : 0,
      },
    })),
    itemStyle: {
      color: colours[index],
      borderColor: colours[index],
      opacity: 0.5,
    },
  }));

  return {
    legend: {
      type: 'scroll',
      show: true,
      icon: 'rect',
      left: '50px',
      right: '100px',
      formatter: (spaceId) => spaceNames[spaceId] || 'Deleted space',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (args) => {
        let tooltip = `${args[0].axisValue}</br>`;
        args.forEach(({ marker, seriesName, value }) => {
          tooltip += `${marker} ${spaceNames[seriesName] || 'Deleted space'}: ${value}</br>`;
        });
        return tooltip;
      },
    },
    toolbox: {
      feature: {
        saveAsImage: {
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
    grid: {
      left: '50px',
      right: '50px',
      bottom: 70,
    },
    xAxis: {
      type: 'category',
      axisLabel: {
        textStyle: {
          color: '#6A7889',
          fontFamily: tokens.fontStackPrimary,
          fontSize: 14,
        },
      },
      splitLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLine: {
        lineStyle: {
          color: '#B4C3CA',
        },
      },
      data: period,
    },
    yAxis: {
      type: 'value',
      position: 'right',
      splitLine: {
        lineStyle: {
          color: '#D3DCE0',
          type: 'dashed',
        },
      },
      axisLabel: {
        textStyle: {
          color: '#536171',
          fontFamily: tokens.fontStackPrimary,
          fontSize: 14,
        },
        formatter: shorten,
      },
      axisLine: {
        lineStyle: {
          color: '#B4C3CA',
        },
      },
    },
    dataZoom: [
      {
        type: 'inside',
        throttle: 60,
      },
      {
        type: 'slider',
      },
    ],
    series: series,
  };
};

export const SpacesBarChart = () => {
  const { spaceNames, periodicUsage, selectedSpacesTab, periodDates, isLoading } = useUsageState();

  const data = isLoading ? [] : periodicUsage?.apis[selectedSpacesTab].items;

  const chartRef = useChart(
    propsToChartOptions({
      spaceNames,
      data,
      period: periodDates,
    })
  );
  return <div ref={chartRef} className={styles.chartWrapper} data-test-id="api-usage-bar-chart" />;
};
