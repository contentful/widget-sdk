import React from 'react';
import PropTypes from 'prop-types';
import { map, sum, get } from 'lodash';
import * as Config from 'Config';
import { getCurrentStateName } from 'states/Navigator';

import {
  organizationResourceUsagePropType,
  organizationUsagePropType,
  arrayPropType,
  periodPropType
} from './propTypes';
import OrganizationUsageInfo from './OrganizationUsageInfo';
import AssetBandwidthSection from './AssetBandwidthSection';
import OrganizationUsageChart from './charts/OrganizationUsageChart';
import ApiUsageInfo from './ApiUsageInfo';
import ApiUsageChart from './charts/ApiUsageChart';
import * as Intercom from 'services/intercom';
import * as Analytics from 'analytics/Analytics';
import { seriesAppearance } from './charts/constants';

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
        cpa: apiUsagePropType,
        gql: apiUsagePropType
      })
    }).isRequired,
    period: periodPropType,
    apiRequestIncludedLimit: PropTypes.number.isRequired,
    assetBandwidthData: PropTypes.shape({
      usage: PropTypes.number,
      unitOfMeasure: PropTypes.string,
      limits: PropTypes.shape({
        included: PropTypes.number
      })
    }),
    isLoading: PropTypes.bool.isRequired
  };

  onClickSupport = () => {
    Analytics.track('element:click', {
      elementId: 'contact_sales_usage',
      groupId: 'contact_sales',
      fromState: getCurrentStateName()
    });
    Intercom.isEnabled() ? Intercom.open() : window.open(Config.supportUrl);
  };

  render() {
    const {
      periodicUsage: {
        org: { usage: orgUsage },
        apis
      },
      apiRequestIncludedLimit,
      assetBandwidthData,
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
          <OrganizationUsageChart
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
              colors={seriesAppearance.map(item => item.color)}
            />
            <ApiUsageChart
              usage={usage.items}
              period={period}
              spaceNames={spaceNames}
              isLoading={isLoading}
            />
          </div>
        ))}
        <AssetBandwidthSection
          limit={get(assetBandwidthData, ['limits', 'included'])}
          usage={get(assetBandwidthData, ['usage'])}
          uom={get(assetBandwidthData, ['unitOfMeasure'])}
        />
      </div>
    );
  }
}
