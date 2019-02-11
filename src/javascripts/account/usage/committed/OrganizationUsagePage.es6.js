import React from 'react';
import PropTypes from 'prop-types';
import { map, sum } from 'lodash';
import * as Config from 'Config.es6';
import { getModule } from 'NgRegistry.es6';

import {
  organizationResourceUsagePropType,
  organizationUsagePropType,
  arrayPropType,
  periodPropType
} from './propTypes.es6';
import OrganizationUsageInfo from './OrganizationUsageInfo.es6';
import AssetBandwidthSection from './AssetBandwidthSection.es6';
import OrganisationUsageChart from './OrganisationUsageChart.es6';
import ApiUsageInfo from './ApiUsageInfo.es6';
import ApiUsageChart from './ApiUsageChart.es6';

const apiUsagePropType = arrayPropType(organizationResourceUsagePropType);
const apiSeriesColors = ['#3072BE', '#14D997', '#CD3F39'];

const $state = getModule('$state');
const Analytics = getModule('analytics/Analytics.es6');
const Intercom = getModule('intercom');

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
    Analytics.track('element:click', {
      elementId: 'contact_sales_usage',
      groupId: 'contact_sales',
      fromState: $state.current.name
    });
    Intercom.isEnabled() && Intercom.isLoaded() ? Intercom.open() : window.open(Config.supportUrl);
  };

  render() {
    const {
      periodicUsage: {
        org: {
          items: [{ usage: orgUsage }]
        },
        apis
      },
      apiRequestIncludedLimit,
      assetBandwidthIncludedLimit,
      assetBandwidthUsage,
      assetBandwidthUOM,
      spaceNames,
      period,
      isLoading,
      isPoC
    } = this.props;

    const totalUsage = sum(orgUsage);

    return (
      <div className="usage-page">
        <div className="usage-page__section">
          <OrganizationUsageInfo totalUsage={totalUsage} includedLimit={apiRequestIncludedLimit} />
          <OrganisationUsageChart
            usage={orgUsage}
            includedLimit={apiRequestIncludedLimit}
            period={period}
            isLoading={isLoading}
          />
        </div>
        {map(apis, (usage, api) => (
          <div key={api} className="usage-page__section">
            <ApiUsageInfo
              totalUsage={totalUsage}
              api={api}
              spaceNames={spaceNames}
              isPoC={isPoC}
              usage={usage.items}
              colors={apiSeriesColors}
            />
            <ApiUsageChart
              usage={usage.items}
              period={period}
              colors={apiSeriesColors}
              spaceNames={spaceNames}
              isLoading={isLoading}
            />
          </div>
        ))}
        <AssetBandwidthSection
          assetBandwidthIncludedLimit={assetBandwidthIncludedLimit}
          assetBandwidthUsage={assetBandwidthUsage}
          assetBandwidthUOM={assetBandwidthUOM}
        />
      </div>
    );
  }
}
