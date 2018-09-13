import React from 'react';
import PropTypes from 'prop-types';
import { mapValues, flow, keyBy, cond, constant, stubTrue, get, eq } from 'lodash/fp';

import { Spinner } from '@contentful/ui-component-library';

import { trigger } from 'ReloadNotification';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { getAllSpaces } from 'access_control/OrganizationMembershipRepository.es6';
import {
  isEnterprisePlan,
  getBasePlan,
  getPlansWithSpaces
} from 'account/pricing/PricingDataProvider.es6';
import createResourceService from 'services/ResourceService.es6';
import { getOrganization } from 'services/TokenStore.es6';
import { isOwnerOrAdmin } from 'services/OrganizationRoles.es6';
import Workbench from 'app/WorkbenchReact.es6';
import { track } from 'analytics/Analytics.es6';
import { getCurrentVariation } from 'utils/LaunchDarkly/index.es6';

import OrganizationResourceUsageList from './non_commited/OrganizationResourceUsageList.es6';
import OrganizationUsagePage from './commited/OrganizationUsagePage.es6';
import { getPeriods, getOrgUsage, getApiUsage } from './UsageService.es6';
import PeriodSelector from './commited/PeriodSelector.es6';
import NoSpacesPlaceholder from './NoSpacesPlaceholder.es6';

export default class OrganizationUsage extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    onReady: PropTypes.func.isRequired,
    onForbidden: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = { isLoading: true };

    this.endpoint = createOrganizationEndpoint(props.orgId);
    this.setPeriodIndex = this.setPeriodIndex.bind(this);
  }

  async componentDidMount() {
    const { onForbidden } = this.props;

    this.setState({ flagActive: await getCurrentVariation('feature-bizvel-09-2018-usage') });
    await this.checkPermissions();

    try {
      await this.fetchOrgData();
    } catch (ex) {
      onForbidden(ex);
    }
  }

  async checkPermissions() {
    const { orgId } = this.props;
    const organization = await getOrganization(orgId);

    if (!isOwnerOrAdmin(organization)) {
      throw new Error('No permission');
    }
  }

  async fetchOrgData() {
    const { orgId, onReady } = this.props;
    const { flagActive } = this.state;
    const service = createResourceService(orgId, 'organization');

    try {
      const basePlan = await getBasePlan(this.endpoint);
      const commited = isEnterprisePlan(basePlan);

      if (commited && flagActive) {
        const [
          spaces,
          plans,
          periods,
          {
            limits: { included: apiRequestIncludedLimit }
          },
          {
            usage: assetBandwidthUsage,
            unitOfMeasure: assetBandwidthUOM,
            limits: { included: assetBandwidthIncludedLimit }
          }
        ] = await Promise.all([
          getAllSpaces(this.endpoint),
          getPlansWithSpaces(this.endpoint),
          getPeriods(this.endpoint),
          service.get('api_request'),
          service.get('asset_bandwidth')
        ]);
        const spaceNames = flow(
          keyBy('sys.id'),
          mapValues('name')
        )(spaces);
        const isPoC = flow(
          keyBy('space.sys.id'),
          mapValues(
            flow(
              get('name'),
              eq('Proof of concept')
            )
          )
        )(plans.items);
        this.setState({
          spaceNames,
          isPoC,
          periods: periods.items,
          apiRequestIncludedLimit,
          assetBandwidthUsage,
          assetBandwidthIncludedLimit,
          assetBandwidthUOM,
          hasSpaces: spaces.length !== 0
        });
        await this.loadPeriodData(0);
      } else {
        this.setState({ resources: await service.getAll(), isLoading: false }, onReady);
      }

      this.setState({ commited }, onReady);
    } catch (e) {
      // Show the forbidden screen on 404 and 403
      if ([404, 403].includes(e.status)) {
        throw e;
      }

      trigger();
    }
  }

  async loadPeriodData(newIndex) {
    const { periods } = this.state;
    const {
      sys: { id: periodId }
    } = periods[newIndex];
    track('usage:period_selected', {
      new_period: periodId
    });
    try {
      const [org, cma, cda, cpa] = await Promise.all([
        getOrgUsage(this.endpoint, periodId),
        ...['cma', 'cda', 'cpa'].map(api => getApiUsage(this.endpoint, periodId, api))
      ]);
      this.setState({
        isLoading: false,
        periodicUsage: { org, apis: { cma, cda, cpa } },
        selectedPeriodIndex: newIndex
      });
    } catch (e) {
      trigger();
    }
  }

  async setPeriodIndex(e) {
    this.setState({ isLoading: true });
    await this.loadPeriodData(parseInt(e.target.value));
  }

  render() {
    const {
      spaceNames,
      isPoC,
      selectedPeriodIndex,
      isLoading,
      periods,
      periodicUsage,
      apiRequestIncludedLimit,
      assetBandwidthUsage,
      assetBandwidthIncludedLimit,
      assetBandwidthUOM,
      commited,
      resources,
      flagActive,
      hasSpaces
    } = this.state;
    return (
      <Workbench
        icon="page-usage"
        testId="organization.usage"
        title="Usage"
        actions={cond([
          [constant(isLoading), constant(<Spinner />)],
          [
            constant(hasSpaces && commited && flagActive && periods),
            () => (
              <PeriodSelector
                periods={periods}
                selectedPeriodIndex={selectedPeriodIndex}
                onChange={this.setPeriodIndex}
              />
            )
          ],
          [stubTrue, constant(undefined)]
        ])()}
        content={cond([
          [
            constant((!commited || !flagActive) && typeof resources !== 'undefined'),
            () => <OrganizationResourceUsageList resources={resources} />
          ],
          [constant(commited && flagActive && !hasSpaces), constant(<NoSpacesPlaceholder />)],
          [
            constant(commited && flagActive && typeof selectedPeriodIndex !== 'undefined'),
            () => (
              <OrganizationUsagePage
                period={periods[selectedPeriodIndex]}
                spaceNames={spaceNames}
                isPoC={isPoC}
                periodicUsage={periodicUsage}
                apiRequestIncludedLimit={apiRequestIncludedLimit}
                assetBandwidthUsage={assetBandwidthUsage}
                assetBandwidthIncludedLimit={assetBandwidthIncludedLimit}
                assetBandwidthUOM={assetBandwidthUOM}
                isLoading={isLoading}
              />
            )
          ],
          [stubTrue, constant(<div />)]
        ])()}
      />
    );
  }
}
