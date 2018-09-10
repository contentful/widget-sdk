import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { merge } from 'lodash';

import EChart from './EChart.es6';
import { organizationResourceUsagePropType, periodPropType } from './propTypes.es6';
import periodToDates from './periodToDates.es6';
import EmptyChartPlaceholder from './EmptyChartPlaceholder.es6';
import baseFormatting from './chartsBaseFormatting.es6';

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
      yAxis: {
        type: 'value'
      },
      series: usage.map(({ usage, sys: { space: { sys: { id: spaceId } } } }, index) => ({
        name: spaceNames[spaceId],
        type: 'line',
        itemStyle: { color: colors[index] },
        lineStyle: {
          width: 3
        },
        data: usage,
        showSymbol: false
      }))
    });
    return (
      <EChart
        options={options}
        isEmpty={endDate === null && moment().diff(startDate, 'days') < 2}
        EmptyPlaceholder={EmptyChartPlaceholder}
        isLoading={isLoading}
        additionalClassnames="usage-page__api-chart"
      />
    );
  }
}
