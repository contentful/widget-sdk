import React from 'react';
import PropTypes from 'prop-types';
import { sum } from 'lodash';

import ApiUsageChart from './ApiUsageChart.es6';
import { organizationResourceUsagePropType, periodPropType } from './propTypes.es6';
import formatNumber from './formatNumber.es6';
import Pill from './Pill.es6';

const colors = ['#18a16c', '#d57d1f', '#824cb9'];

export default class ApiUsageSection extends React.Component {
  static propTypes = {
    includedLimit: PropTypes.number.isRequired,
    api: PropTypes.string.isRequired,
    spaceNames: PropTypes.objectOf(PropTypes.string).isRequired,
    isPoC: PropTypes.objectOf(PropTypes.bool).isRequired,
    usage: PropTypes.arrayOf(organizationResourceUsagePropType).isRequired,
    period: periodPropType.isRequired,
    isLoading: PropTypes.bool.isRequired
  };

  render() {
    const { api, spaceNames, usage, includedLimit, period, isLoading, isPoC } = this.props;
    return (
      <React.Fragment>
        <div className="usage-page__api-usage-section">
          <h2>{`${api.toUpperCase()} requests`}</h2>
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
                    <td className="usage-page__space-name">
                      <span>{spaceNames[spaceId]}</span>
                      {isPoC[spaceId] && <Pill text="POC" />}
                    </td>
                    <td className="usage-page__space-usage">{formatNumber(sum(spaceUsage), 1)}</td>
                    <td
                      style={{ color: colors[index] }}
                      title="Percentage of total number of API requests">
                      {`${Math.round((sum(spaceUsage) / includedLimit) * 100)}%`}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
        <div>
          <ApiUsageChart
            usage={usage}
            period={period}
            colors={colors}
            spaceNames={spaceNames}
            isLoading={isLoading}
          />
        </div>
      </React.Fragment>
    );
  }
}
