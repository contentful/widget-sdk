import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { merge } from 'lodash';
import assetUrl from 'assetUrlFilter';

import EChart from './EChart.es6';
import { organizationResourceUsagePropType, periodPropType } from './propTypes.es6';
import periodToDates from './periodToDates.es6';
import EmptyChartPlaceholder from './EmptyChartPlaceholder.es6';
import baseFormatting, { seriesBaseFormatting } from './chartsBaseFormatting.es6';

const symbols = ['circle', 'diamond', 'triangle'];

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
    const options = merge({}, baseFormatting, {
      xAxis: {
        data: periodToDates(period)
      },
      tooltip: {
        padding: 0,
        formatter: series =>
          `
            <div class="usage-page__api-chart-tooltip">
              <div class="date">${series[0].name}</div>
              ${series
                .map(
                  ({ value }, index) => `
                  <div class="value">
                    <img class="icon" src="${assetUrl(
                      `/app/images/chart-symbol-${symbols[index]}.svg`
                    )}"" />
                    <span> ${value.toLocaleString('en-US')}</span>
                  </div>
                `
                )
                .join('')}
            </div>
          `
      },
      series: usage.map(({ usage, sys: { space: { sys: { id: spaceId } } } }, index) =>
        merge({}, seriesBaseFormatting, {
          name: spaceNames[spaceId] || 'deleted space',
          data: usage,
          symbol: symbols[index],
          symbolSize: 8,
          itemStyle: {
            color: colors[index]
          }
        })
      )
    });
    return (
      <EChart
        options={options}
        isEmpty={endDate === null && moment().diff(startDate, 'days') < 3}
        EmptyPlaceholder={EmptyChartPlaceholder}
        isLoading={isLoading}
        additionalClassnames="usage-page__api-chart"
      />
    );
  }
}
