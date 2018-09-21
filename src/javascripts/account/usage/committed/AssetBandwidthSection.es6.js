import React from 'react';
import PropTypes from 'prop-types';
import { partialRight } from 'lodash';
import { TextLink } from '@contentful/ui-component-library';

import { shortenStorageUnit } from 'utils/NumberUtils.es6';

export default class AssetBandwidthSection extends React.Component {
  static propTypes = {
    assetBandwidthIncludedLimit: PropTypes.number.isRequired,
    assetBandwidthUsage: PropTypes.number.isRequired,
    assetBandwidthUOM: PropTypes.string.isRequired
  };

  render() {
    const { assetBandwidthIncludedLimit, assetBandwidthUsage, assetBandwidthUOM } = this.props;

    const withUnit = partialRight(shortenStorageUnit, assetBandwidthUOM);

    return (
      <div className="usage-page__asset-bandwidth-section">
        <h2>Total asset bandwidth</h2>
        <div className="usage-page__total-usage">{withUnit(assetBandwidthUsage)}</div>
        <div className="usage-page__limit">
          <span className="usage-page__included-limit">{`${withUnit(
            assetBandwidthIncludedLimit
          )} included`}</span>
          {assetBandwidthUsage > assetBandwidthIncludedLimit && (
            <span className="usage-page__overage">{` + ${withUnit(
              assetBandwidthUsage - assetBandwidthIncludedLimit
            )} overage`}</span>
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
