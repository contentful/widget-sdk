import React from 'react';
import PropTypes from 'prop-types';
import { map, sum } from 'lodash';
import { Button } from '@contentful/ui-component-library';

import * as Intercom from 'intercom';
import $state from '$state';
import { supportUrl } from 'Config.es6';
import { track } from 'analytics/Analytics.es6';

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
    usage: PropTypes.shape({
      org: organizationUsagePropType,
      apis: PropTypes.shape({
        cma: apiUsagePropType,
        cda: apiUsagePropType,
        cpa: apiUsagePropType
      })
    }).isRequired,
    period: periodPropType,
    includedLimit: PropTypes.number.isRequired,
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
      usage: { org, apis },
      includedLimit,
      spaceNames,
      period,
      isLoading
    } = this.props;
    const totalUsage = sum(org.usage);

    return (
      <div className="usage-page">
        <div className="usage-page__org-section">
          <h2>Total number of API requests</h2>
          <div className="usage-page__total-usage">{totalUsage.toLocaleString('en-US')}</div>
          <div className="usage-page__limit">
            <span className="usage-page__included-limit">{`${formatNumber(
              includedLimit
            )} included`}</span>
            {totalUsage > includedLimit && (
              <span className="usage-page__overage">{` + ${(
                totalUsage - includedLimit
              ).toLocaleString('en-US')} overage`}</span>
            )}
          </div>
          <Button onClick={this.onClickSupport}>Talk to support</Button>
        </div>
        <OrganisationUsageChart
          usage={org}
          includedLimit={includedLimit}
          period={period}
          isLoading={isLoading}
        />
        {map(apis, (usage, api) => (
          <ApiUsageSection
            key={api}
            usage={usage.items}
            spaceNames={spaceNames}
            api={api}
            includedLimit={includedLimit}
            period={period}
            isLoading={isLoading}
          />
        ))}
      </div>
    );
  }
}
