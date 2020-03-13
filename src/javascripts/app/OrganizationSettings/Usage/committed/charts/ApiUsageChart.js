import React from 'react';
import PropTypes from 'prop-types';
import { h } from 'utils/legacy-html-hyperscript';
import { shorten } from 'utils/NumberUtils';
import { orderBy } from 'lodash';

import { organizationResourceUsagePropType, periodPropType } from '../propTypes';
import periodToDates from './periodToDates';
import LineChart from './LineChart';
import { seriesAppearance } from './constants';

const ApiUsageChart = ({ usage, period, spaceNames, isLoading }) => {
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
      symbol: seriesAppearance[index]['symbol'],
      symbolSize: 8,
      itemStyle: {
        color: seriesAppearance[index]['color']
      }
    }))
  };
  return <LineChart options={options} loading={isLoading} width={700} height={300} />;
};

ApiUsageChart.propTypes = {
  usage: PropTypes.arrayOf(organizationResourceUsagePropType).isRequired,
  period: periodPropType.isRequired,
  spaceNames: PropTypes.objectOf(PropTypes.string).isRequired,
  isLoading: PropTypes.bool.isRequired
};

function renderTooltip(series) {
  const tooltipChildren = [h('.date', [series[0].name])];
  // Show highest value first
  const sortSeriesByValue = orderBy(series, 'value', 'desc');

  sortSeriesByValue.forEach(({ value, color }) => {
    const tipIcon = seriesAppearance.filter(item => item.color === color);
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
