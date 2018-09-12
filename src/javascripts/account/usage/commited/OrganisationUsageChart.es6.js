import React from 'react';
import PropTypes from 'prop-types';
import { last, merge } from 'lodash';
import moment from 'moment';

import EChart from './EChart.es6';
import formatNumber from './formatNumber.es6';
import { periodPropType } from './propTypes.es6';
import periodToDates from './periodToDates.es6';
import EmptyChartPlaceholder from './EmptyChartPlaceholder.es6';
import baseFormatting, { seriesBaseFormatting } from './chartsBaseFormatting.es6';

const accumulateUsage = usage =>
  usage.reduce((acc, value) => acc.concat(value + (last(acc) || 0)), []);

export default class OrganisationUsageChart extends React.Component {
  static propTypes = {
    usage: PropTypes.arrayOf(PropTypes.number).isRequired,
    includedLimit: PropTypes.number.isRequired,
    period: periodPropType.isRequired,
    isLoading: PropTypes.bool.isRequired
  };

  render() {
    const { includedLimit, usage, period, isLoading } = this.props;
    const { startDate, endDate } = period;
    const accumulatedUsage = accumulateUsage(usage);
    const maxValue = last(accumulatedUsage);
    const options = merge({}, baseFormatting, {
      xAxis: {
        data: periodToDates(period)
      },
      yAxis: {
        min: 0,
        max: Math.max(maxValue, includedLimit)
      },
      tooltip: {
        padding: 0,
        formatter: ([{ name, value }]) =>
          `
            <div class="usage-page__org-chart-tooltip">
              <div class="date">${name}</div>
              <div class="value">${value.toLocaleString('en-US')}</div>
            </div>
          `
      },
      visualMap: {
        show: false,
        pieces: [
          {
            gte: 0,
            lt: includedLimit,
            color: '#354351',
            label: 'includedLimit usage'
          },
          {
            gt: includedLimit,
            color: '#fda41e',
            label: `exceeding ${formatNumber(includedLimit)} limit`
          }
        ]
      },
      series: merge({}, seriesBaseFormatting, {
        name: 'API requests',
        data: accumulatedUsage,
        symbol: 'circle',
        markLine: {
          silent: false,
          data: [{ yAxis: includedLimit, label: { show: false } }],
          lineStyle: {
            color: '#354351',
            width: 1.5
          },
          symbol: []
        }
      })
    });

    return (
      <EChart
        options={options}
        isEmpty={endDate === null && moment().diff(startDate, 'days') < 2}
        EmptyPlaceholder={EmptyChartPlaceholder}
        isLoading={isLoading}
      />
    );
  }
}
