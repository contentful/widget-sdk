import React from 'react';
import PropTypes from 'prop-types';
import { map, sum, partialRight } from 'lodash';
import { Button, TextLink } from '@contentful/ui-component-library';

import * as Intercom from 'intercom';
import $state from '$state';
import { supportUrl } from 'Config.es6';
import { track } from 'analytics/Analytics.es6';
import { shortenStorageUnit } from 'utils/NumberUtils.es6';

import OrganisationUsageChart from './OrganisationUsageChart.es6';
import ApiUsageInfo from './ApiUsageInfo.es6';
import ApiUsageChart from './ApiUsageChart.es6';

import formatNumber from './formatNumber.es6';
import {
  organizationResourceUsagePropType,
  organizationUsagePropType,
  arrayPropType,
  periodPropType
} from './propTypes.es6';

const apiUsagePropType = arrayPropType(organizationResourceUsagePropType);
const apiSeriesColors = ['#3072BE', '#14D997', '#CD3F39'];

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
    const withUnit = partialRight(shortenStorageUnit, assetBandwidthUOM);

    return (
      <div className="usage-page">
        <div className="usage-page__section">
          <div>
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
              )}{' '}
              <TextLink href="https://www.contentful.com/r/knowledgebase/fair-use/" target="_blank">
                Learn more
              </TextLink>
            </div>
            <Button onClick={this.onClickSupport}>Talk to us</Button>
          </div>
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
              includedLimit={apiRequestIncludedLimit}
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
        <div className="usage-page__section usage-page__section--with-divider">
          <div className="usage-page__chart-info">
            <h2>Total asset bandwidth</h2>
            <div className="usage-page__total-usage">{withUnit(assetBandwidthUsage)}</div>
            <div className="usage-page__limit">
              <span className="usage-page__included-limit">{`${withUnit(
                assetBandwidthIncludedLimit
              )} included`}</span>
              {assetBandwidthUsage > assetBandwidthIncludedLimit && (
                <React.Fragment>
                  <span className="usage-page__overage">{` + ${withUnit(
                    assetBandwidthUsage - assetBandwidthIncludedLimit
                  )} overage`}</span>
                </React.Fragment>
              )}{' '}
              <TextLink href="https://www.contentful.com/r/knowledgebase/fair-use/" target="_blank">
                Learn more
              </TextLink>
            </div>
            <Button onClick={this.onClickSupport}>Talk to us</Button>
          </div>
        </div>
      </div>
    );
  }
}
