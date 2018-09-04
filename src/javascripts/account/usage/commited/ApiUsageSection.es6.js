import React from 'react';
import PropTypes from 'prop-types';
import { sum } from 'lodash';

import ApiUsageChart from './ApiUsageChart.es6';
import { organizationResourceUsagePropType, periodPropType } from './propTypes.es6';
import formatNumber from './formatNumber.es6';

const colors = ['#18a16c', '#d57d1f', '#824cb9'];

export default class ApiUsageSection extends React.Component {
  static propTypes = {
    includedLimit: PropTypes.number.isRequired,
    api: PropTypes.string.isRequired,
    spaceNames: PropTypes.objectOf(PropTypes.string).isRequired,
    usage: PropTypes.arrayOf(organizationResourceUsagePropType).isRequired,
    period: periodPropType.isRequired,
    isLoading: PropTypes.bool.isRequired
  };

  render() {
    const { api, spaceNames, usage, includedLimit, period, isLoading } = this.props;
    return (
      <React.Fragment>
        <h2>{`${api.toUpperCase()} requests`}</h2>
        <div>
          <h3>Top 3 spaces</h3>
          <table className="usage-page__api-table">
            <tbody>
              {usage.map(
                (
                  {
                    sys: {
                      space: {
                        sys: { id: spaceId }
                      }
                    },
                    usage: spaceUsage
                  },
                  index
                ) => (
                  <tr key={spaceId}>
                    <td className="usage-page__space-name">{spaceNames[spaceId]}</td>
                    <td className="usage-page__space-usage">{formatNumber(sum(spaceUsage), 1)}</td>
                    <td style={{ color: colors[index] }}>
                      {`${Math.round((sum(spaceUsage) / includedLimit) * 100)}%`}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
        <ApiUsageChart
          usage={usage}
          period={period}
          colors={colors}
          spaceNames={spaceNames}
          isLoading={isLoading}
        />
      </React.Fragment>
    );
  }
}
