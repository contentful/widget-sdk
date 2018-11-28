import React from 'react';
import PropTypes from 'prop-types';
import { TextLink } from '@contentful/forma-36-react-components';

import { shorten } from 'utils/NumberUtils.es6';

export default class OrganizationUsageInfo extends React.Component {
  static propTypes = {
    totalUsage: PropTypes.number.isRequired,
    includedLimit: PropTypes.number.isRequired
  };

  render() {
    const { totalUsage, includedLimit } = this.props;
    return (
      <div>
        <h2>Total number of API requests</h2>
        <div className="usage-page__total-usage">{totalUsage.toLocaleString('en-US')}</div>
        <div className="usage-page__limit">
          <span className="usage-page__included-limit">{`${shorten(includedLimit)} included`}</span>
          {totalUsage > includedLimit && (
            <span className="usage-page__overage">
              {` + ${(totalUsage - includedLimit).toLocaleString('en-US')} overage`}
            </span>
          )}
          <TextLink
            href="https://www.contentful.com/r/knowledgebase/fair-use/"
            target="_blank"
            extraClassNames="usage-page__learn-more-link">
            Learn more
          </TextLink>
        </div>
      </div>
    );
  }
}
