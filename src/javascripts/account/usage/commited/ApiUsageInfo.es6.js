import React from 'react';
import PropTypes from 'prop-types';
import { sum } from 'lodash';

import { organizationResourceUsagePropType } from './propTypes.es6';
import formatNumber from './formatNumber.es6';
import Pill from './Pill.es6';

export default class ApiUsageInfo extends React.Component {
  static propTypes = {
    includedLimit: PropTypes.number.isRequired,
    api: PropTypes.string.isRequired,
    spaceNames: PropTypes.objectOf(PropTypes.string).isRequired,
    isPoC: PropTypes.objectOf(PropTypes.bool).isRequired,
    usage: PropTypes.arrayOf(organizationResourceUsagePropType).isRequired,
    colors: PropTypes.arrayOf(PropTypes.string).isRequired
  };

  render() {
    const { api, spaceNames, usage, includedLimit, isPoC, colors } = this.props;
    return (
      <div className="usage-page__chart-info">
        <h2>{`${api.toUpperCase()} requests`}</h2>
        <h3>Top 3 spaces</h3>
        <table className="usage-page__api-table">
          <tbody>
            {usage.map(({ sys: { space: { sys: { id: spaceId } } }, usage: spaceUsage }, i) => (
              <tr key={spaceId}>
                <td className="usage-page__space-name">
                  <span>{spaceNames[spaceId]}</span>
                  {isPoC[spaceId] && <Pill text="POC" tooltip="Proof of concept" />}
                </td>
                <td className="usage-page__space-usage">{formatNumber(sum(spaceUsage), 1)}</td>
                <td
                  className="usage-page__percentage-of-total-usage"
                  style={{ color: colors[i] }}
                  title="Percentage of total number of API requests">
                  {`${Math.round((sum(spaceUsage) / includedLimit) * 100)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
