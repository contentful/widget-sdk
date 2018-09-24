import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { merge } from 'lodash';
import { renderToStaticMarkup as jsxToHtmlString } from 'react-dom/server';

import EChart from './EChart.es6';
import { organizationResourceUsagePropType, periodPropType } from './propTypes.es6';
import periodToDates from './periodToDates.es6';
import EmptyChartPlaceholder from './EmptyChartPlaceholder.es6';
import baseFormatting, { seriesBaseFormatting } from './chartsBaseFormatting.es6';
import Circle from 'svg/chart-symbol-circle.es6';
import Diamond from 'svg/chart-symbol-diamond.es6';
import Triangle from 'svg/chart-symbol-triangle.es6';

const seriesLineSymbol = ['circle', 'diamond', 'triangle'];
const tooltipSymbol = [Circle, Diamond, Triangle];

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
          // This should not normally be used on the client, but echarts needs an html string here
          jsxToHtmlString(
            <div className="usage-page__api-chart-tooltip">
              <div className="date">{series[0].name}</div>
              {series.map(({ value }, index) => (
                <div className="value" key={index}>
                  <span className="icon">{React.createElement(tooltipSymbol[index])}</span>
                  <span>{value.toLocaleString('en-US')}</span>
                </div>
              ))}
            </div>
          )
      },
      series: usage.map(({ usage, sys: { space: { sys: { id: spaceId } } } }, index) =>
        merge({}, seriesBaseFormatting, {
          name: spaceNames[spaceId] || 'deleted space',
          data: usage,
          symbol: seriesLineSymbol[index],
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
