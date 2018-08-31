import React from 'react';
import PropTypes from 'prop-types';

import EChart from './EChart';
import formatNumber from './formatNumber';
import { organizationResourceUsagePropType, periodPropType } from './propTypes';
import periodToDates from './periodToDates';

export default class ApiUsageChart extends React.Component {
  static propTypes = {
    usage: PropTypes.arrayOf(organizationResourceUsagePropType).isRequired,
    colors: PropTypes.arrayOf(PropTypes.string).isRequired,
    period: periodPropType.isRequired,
    width: PropTypes.string.isRequired,
    spaceNames: PropTypes.objectOf(PropTypes.string).isRequired
  };

  render() {
    const { usage, colors, period, width, spaceNames } = this.props;
    const options = {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: usage.map(
          ({
            sys: {
              space: {
                sys: { id: spaceId }
              }
            }
          }) => spaceNames[spaceId]
        )
      },
      xAxis: {
        data: periodToDates(period)
      },
      yAxis: {
        type: 'value',
        splitLine: {
          show: false
        },
        position: 'right',
        axisLabel: {
          formatter: formatNumber
        }
      },
      series: usage.map(({ usage, sys: { space: { sys: { id: spaceId } } } }, index) => ({
        name: spaceNames[spaceId],
        type: 'line',
        itemStyle: { color: colors[index] },
        data: usage,
        showSymbol: false
      }))
    };
    return <EChart width={width} height="300px" options={options} />;
  }
}
