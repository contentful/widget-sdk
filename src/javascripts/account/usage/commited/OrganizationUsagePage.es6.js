import React from 'react';
import PropTypes from 'prop-types';
import { map, sum } from 'lodash';

import { Button } from '@contentful/ui-component-library';
import * as Intercom from 'intercom';
import { supportUrl } from 'Config';
import { track } from 'analytics/Analytics';
import $state from '$state';

import OrganisationUsageChart from './OrganisationUsageChart';
import ApiUsageSection from './ApiUsageSection';
import formatNumber from './formatNumber';
import {
  organizationResourceUsagePropType,
  organizationUsagePropType,
  arrayPropType,
  periodPropType
} from './propTypes';

const apiUsagePropType = arrayPropType(organizationResourceUsagePropType);

const chartWidth = '700px';

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
    includedLimit: PropTypes.number.isRequired
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
      period
    } = this.props;
    const totalUsage = sum(org.usage);

    return (
      <div className="usage-page">
        <h2>Total number of API requests</h2>
        <div className="usage-page__org-section">
          <div>
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
          </div>
          <div className="usage-page__section">
            Plan overages help you handle traffic spikes or expand the team while keeping your
            expenses in check.
          </div>
          <Button onClick={this.onClickSupport}>Talk to support</Button>
        </div>
        <OrganisationUsageChart
          usage={org}
          includedLimit={includedLimit}
          period={period}
          width={chartWidth}
        />
        {map(apis, (usage, api) => (
          <ApiUsageSection
            key={api}
            usage={usage.items}
            spaceNames={spaceNames}
            api={api}
            includedLimit={includedLimit}
            period={period}
            chartWidth={chartWidth}
          />
        ))}
      </div>
    );
  }
}
