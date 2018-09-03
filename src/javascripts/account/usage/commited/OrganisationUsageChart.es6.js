import React from 'react';
import PropTypes from 'prop-types';
import { last } from 'lodash';
import moment from 'moment';

import EChart from './EChart';
import formatNumber from './formatNumber';
import { periodPropType, organizationUsagePropType } from './propTypes';
import periodToDates from './periodToDates';
import EmptyChartPlaceholder from './EmptyChartPlaceholder';

const accumulateUsage = usage =>
  usage.reduce((acc, value) => acc.concat(value + (last(acc) || 0)), []);

export default class OrganisationUsageChart extends React.Component {
  static propTypes = {
    usage: organizationUsagePropType.isRequired,
    includedLimit: PropTypes.number.isRequired,
    period: periodPropType.isRequired,
    isLoading: PropTypes.bool.isRequired
  };

  render() {
    const {
      includedLimit,
      usage: { usage },
      period,
      isLoading
    } = this.props;
    const { startDate, endDate } = period;
    const accumulatedUsage = accumulateUsage(usage);
    const maxValue = last(accumulatedUsage);
    const options = {
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        data: periodToDates(period)
      },
      yAxis: {
        splitLine: {
          show: false
        },
        position: 'right',
        min: 0,
        max: Math.max(maxValue, includedLimit),
        axisLabel: {
          formatter: formatNumber
        }
      },
      visualMap: {
        show: false,
        pieces: [
          {
            gt: 0,
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
      series: {
        name: 'API requests',
        type: 'line',
        data: accumulatedUsage,
        markLine: {
          silent: false,
          data: [{ yAxis: includedLimit, label: { show: false } }],
          lineStyle: {
            color: '#354351',
            width: 2
          },
          symbol: []
        },
        showSymbol: false
      }
    };

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
