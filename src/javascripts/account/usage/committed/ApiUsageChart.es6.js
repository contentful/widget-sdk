import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { renderToStaticMarkup as jsxToHtmlString } from 'react-dom/server';
import { LineChart } from '@contentful/ui-component-library';

import Circle from 'svg/chart-symbol-circle.es6';
import Diamond from 'svg/chart-symbol-diamond.es6';
import Triangle from 'svg/chart-symbol-triangle.es6';
import { shorten } from 'utils/NumberUtils.es6';

import { organizationResourceUsagePropType, periodPropType } from './propTypes.es6';
import periodToDates from './periodToDates.es6';
import EmptyChartPlaceholder from './EmptyChartPlaceholder.es6';

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
    const options = {
      xAxis: {
        data: periodToDates(period)
      },
      tooltip: {
        padding: 0,
        formatter: series =>
          // This should not normally be used on the client, but LineCharts needs an html string here
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
      />
    );
  }
}
