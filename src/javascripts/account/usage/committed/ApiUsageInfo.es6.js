import React from 'react';
import PropTypes from 'prop-types';
import { sum } from 'lodash';
import { Tooltip, Tag } from '@contentful/ui-component-library';

import { shorten } from 'utils/NumberUtils.es6';

import { organizationResourceUsagePropType } from './propTypes.es6';

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
                  {spaceNames[spaceId] ? (
                    <span>{spaceNames[spaceId]}</span>
                  ) : (
                    <em>deleted space</em>
                  )}
                  {isPoC[spaceId] && (
                    <Tooltip content="Proof of concept">
                      <Tag tagType="muted" style={{ marginLeft: '10px' }}>
                        POC
                      </Tag>
                    </Tooltip>
                  )}
                </td>
                <td className="usage-page__space-usage">{shorten(sum(spaceUsage))}</td>
                <td className="usage-page__percentage-of-total-usage" style={{ color: colors[i] }}>
                  <Tooltip content="Percentage of total number of API requests">
                    <span>{`${Math.round((sum(spaceUsage) / includedLimit) * 100)}%`}</span>
                  </Tooltip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
