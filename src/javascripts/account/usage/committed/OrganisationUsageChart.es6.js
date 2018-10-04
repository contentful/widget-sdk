import React from 'react';
import PropTypes from 'prop-types';
import { last } from 'lodash';
import moment from 'moment';

import { LineChart } from '@contentful/ui-component-library';
import { shorten } from 'utils/NumberUtils.es6';

import { periodPropType } from './propTypes.es6';
import periodToDates from './periodToDates.es6';
import EmptyChartPlaceholder from './EmptyChartPlaceholder.es6';

const accumulateUsage = usage =>
  usage.reduce((acc, value) => acc.concat(value + (last(acc) || 0)), []);

const belowLimitColor = '#263545';
const aboveLimitColor = '#FDA31A';

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
    const options = {
      xAxis: {
        data: periodToDates(period)
      },
      yAxis: {
        min: 0,
        max: Math.max(maxValue, includedLimit),
        axisLabel: {
          formatter: shorten
        }
      },
      tooltip: {
        padding: 0,
        formatter: ([{ name, value, color }]) =>
          `
            <div
            class="usage-page__org-chart-tooltip"
            style="background-color: ${color}; color: ${
            color === belowLimitColor ? '#fff' : belowLimitColor
          };"
            >
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
            color: belowLimitColor,
            label: 'includedLimit usage'
          },
          {
            gt: includedLimit,
            color: aboveLimitColor,
            label: `exceeding ${shorten(includedLimit)} limit`
          }
        ]
      },
      series: {
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
      }
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
