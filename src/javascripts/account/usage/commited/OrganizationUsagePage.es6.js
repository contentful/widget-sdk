import React from 'react';
import PropTypes from 'prop-types';
import { map, sum, partialRight } from 'lodash';
import { Button } from '@contentful/ui-component-library';

import * as Intercom from 'intercom';
import $state from '$state';
import { supportUrl } from 'Config.es6';
import { track } from 'analytics/Analytics.es6';
import { shortenStorageUnit } from 'utils/NumberUtils.es6';

import OrganisationUsageChart from './OrganisationUsageChart.es6';
import ApiUsageSection from './ApiUsageSection.es6';
import formatNumber from './formatNumber.es6';
import {
  organizationResourceUsagePropType,
  organizationUsagePropType,
  arrayPropType,
  periodPropType
} from './propTypes.es6';

const apiUsagePropType = arrayPropType(organizationResourceUsagePropType);

export default class OrganizationUsagePage extends React.Component {
  static propTypes = {
    spaceNames: PropTypes.objectOf(PropTypes.string).isRequired,
    isPoC: PropTypes.objectOf(PropTypes.bool).isRequired,
    periodicUsage: PropTypes.shape({
      org: organizationUsagePropType,
      apis: PropTypes.shape({
        cma: apiUsagePropType,
        cda: apiUsagePropType,
        cpa: apiUsagePropType
      })
    }).isRequired,
    period: periodPropType,
    apiRequestIncludedLimit: PropTypes.number.isRequired,
    assetBandwidthIncludedLimit: PropTypes.number.isRequired,
    assetBandwidthUsage: PropTypes.number.isRequired,
    assetBandwidthUOM: PropTypes.string.isRequired,
    isLoading: PropTypes.bool.isRequired
  };

  onClickSupport = () => {
    track('element:click', {
      elementId: 'contact_sales_usage',
      groupId: 'contact_sales',
      fromState: $state.current.name
    });
    Intercom.isEnabled() && Intercom.isLoaded() ? Intercom.open() : window.open(supportUrl);
  };

  render() {
    const {
      periodicUsage: { org, apis },
      apiRequestIncludedLimit,
      assetBandwidthIncludedLimit,
      assetBandwidthUsage,
      assetBandwidthUOM,
      spaceNames,
      period,
      isLoading,
      isPoC
    } = this.props;
    const totalUsage = sum(org.usage);
    const withUnit = partialRight(shortenStorageUnit, assetBandwidthUOM);

    return (
      <div className="usage-page">
        <div className="usage-page__org-section">
          <h2>Total number of API requests</h2>
          <div className="usage-page__total-usage">{totalUsage.toLocaleString('en-US')}</div>
          <div className="usage-page__limit">
            <span className="usage-page__included-limit">{`${formatNumber(
              apiRequestIncludedLimit
            )} included`}</span>
            {totalUsage > apiRequestIncludedLimit && (
              <span className="usage-page__overage">{` + ${(
                totalUsage - apiRequestIncludedLimit
              ).toLocaleString('en-US')} overage`}</span>
            )}
          </div>
          <Button onClick={this.onClickSupport}>Talk to us</Button>
        </div>
        <OrganisationUsageChart
          usage={org}
          includedLimit={apiRequestIncludedLimit}
          period={period}
          isLoading={isLoading}
        />
        {map(apis, (usage, api) => (
          <ApiUsageSection
            key={api}
            usage={usage.items}
            spaceNames={spaceNames}
            isPoC={isPoC}
            api={api}
            includedLimit={apiRequestIncludedLimit}
            period={period}
            isLoading={isLoading}
          />
        ))}
        <div className="usage-page__org-section">
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
          </div>
          <Button onClick={this.onClickSupport}>Talk to us</Button>
        </div>
      </div>
    );
  }
}
