import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { h } from 'utils/legacy-html-hyperscript';
import { shorten } from 'utils/NumberUtils';
import { sortBy } from 'lodash';

import { organizationResourceUsagePropType, periodPropType } from '../propTypes';
import periodToDates from './periodToDates';
import EmptyChartPlaceholder from './EmptyChartPlaceholder';
import LineChart from './LineChart';
import { seriesStyles } from './chartsUtil';

const ApiUsageChart = ({ usage, period, spaceNames, isLoading }) => {
  const { startDate, endDate } = period;
  const options = {
    xAxis: {
      data: periodToDates(period)
    },
    tooltip: {
      padding: 0,
      // This should not normally be used on the client, but LineCharts needs an html string here
      formatter: series => renderTooltip(series)
    },
    yAxis: {
      axisLabel: {
        formatter: shorten
      }
    },
    series: usage.map(({ usage, sys: { space: { sys: { id: spaceId } } } }, index) => ({
      name: spaceNames[spaceId] || 'deleted space',
      data: usage,
      symbol: seriesStyles[index]['symbol'],
      symbolSize: 8,
      itemStyle: {
        color: seriesStyles[index]['color']
      }
    }))
  };

  return (
    <LineChart
      options={options}
      empty={endDate === null && moment().diff(startDate, 'days') < 3}
      EmptyPlaceholder={EmptyChartPlaceholder}
      loading={isLoading}
      width={700}
      height={300}
    />
  );
};

ApiUsageChart.propTypes = {
  usage: PropTypes.arrayOf(organizationResourceUsagePropType).isRequired,
  colors: PropTypes.arrayOf(PropTypes.string).isRequired,
  period: periodPropType.isRequired,
  spaceNames: PropTypes.objectOf(PropTypes.string).isRequired,
  isLoading: PropTypes.bool.isRequired
};

function renderTooltip(series) {
  const tooltipChildren = [h('.date', [series[0].name])];
  // Show highest value first
  const sortSeriesByValue = sortBy(series, 'value').reverse();

  sortSeriesByValue.forEach(({ value, color }) => {
    const tipIcon = seriesStyles.filter(item => item.color === color);
    tooltipChildren.push(
      h('.value', [
        h(`span.icon.${tipIcon[0]['icon']}`),
        h('span', [value.toLocaleString('en-US')])
      ])
    );
  });

  return h('.usage-page__api-chart-tooltip', tooltipChildren);
}

export default ApiUsageChart;
