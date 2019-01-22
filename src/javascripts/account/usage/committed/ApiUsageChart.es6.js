import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { h } from 'utils/legacy-html-hyperscript/index.es6';
import { LineChart } from '@contentful/forma-36-react-components';
import { shorten } from 'utils/NumberUtils.es6';

import { organizationResourceUsagePropType, periodPropType } from './propTypes.es6';
import periodToDates from './periodToDates.es6';
import EmptyChartPlaceholder from './EmptyChartPlaceholder.es6';

const seriesLineSymbol = ['circle', 'diamond', 'triangle'];
const tooltipIcon = ['chart-symbol-circle', 'chart-symbol-diamond', 'chart-symbol-triangle'];

export default class ApiUsageChart extends React.Component {
  static propTypes = {
    usage: PropTypes.arrayOf(organizationResourceUsagePropType).isRequired,
    colors: PropTypes.arrayOf(PropTypes.string).isRequired,
    period: periodPropType.isRequired,
    spaceNames: PropTypes.objectOf(PropTypes.string).isRequired,
    isLoading: PropTypes.bool.isRequired
  };

  render() {
    const { usage, colors, period, spaceNames, isLoading } = this.props;
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
        symbol: seriesLineSymbol[index],
        symbolSize: 8,
        itemStyle: {
          color: colors[index]
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
  }
}

function renderTooltip(series) {
  const tooltipChildren = [h('.date', [series[0].name])];

  series.forEach(({ value }, index) => {
    tooltipChildren.push(
      h('.value', [
        h(`span.icon.${tooltipIcon[index]}`),
        h('span', [value.toLocaleString('en-US')])
      ])
    );
  });

  return h('.usage-page__api-chart-tooltip', tooltipChildren);
}
