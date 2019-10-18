import React from 'react';
import PropTypes from 'prop-types';
import { mapValues, flow, keyBy, get, eq, isNumber, pick } from 'lodash/fp';

import { Spinner } from '@contentful/forma-36-react-components';
import Workbench from 'app/common/Workbench.es6';
import ReloadNotification from 'app/common/ReloadNotification.es6';

import OrganizationResourceUsageList from './non_committed/OrganizationResourceUsageList.es6';
import OrganizationUsagePage from './committed/OrganizationUsagePage.es6';
import { getPeriods, getOrgUsage, getApiUsage } from './UsageService.es6';
import PeriodSelector from './committed/PeriodSelector.es6';
import NoSpacesPlaceholder from './NoSpacesPlaceholder.es6';
import * as Analytics from 'analytics/Analytics.es6';

import * as TokenStore from 'services/TokenStore.es6';
import * as EndpointFactory from 'data/EndpointFactory.es6';
import * as OrganizationMembershipRepository from 'access_control/OrganizationMembershipRepository';
import * as PricingDataProvider from 'account/pricing/PricingDataProvider.es6';
import createResourceService from 'services/ResourceService.es6';
import * as OrganizationRoles from 'services/OrganizationRoles.es6';

export class WorkbenchContent extends React.Component {
  static propTypes = {
    committed: PropTypes.bool,
    hasSpaces: PropTypes.bool,
    selectedPeriodIndex: PropTypes.number,
    spaceNames: PropTypes.objectOf(PropTypes.string),
    isPoC: PropTypes.objectOf(PropTypes.bool),
    periodicUsage: PropTypes.object,
    apiRequestIncludedLimit: PropTypes.number,
    assetBandwidthData: PropTypes.shape({
      usage: PropTypes.number,
      unitOfMeasure: PropTypes.string,
      limits: PropTypes.shape({
        included: PropTypes.number
      })
    }),
    isLoading: PropTypes.bool,
    periods: PropTypes.arrayOf(PropTypes.object),
    resources: PropTypes.arrayOf(PropTypes.object)
  };

  render() {
    const {
      committed,
      hasSpaces,
      selectedPeriodIndex,
      spaceNames,
      isPoC,
      periodicUsage,
      apiRequestIncludedLimit,
      assetBandwidthData,
      isLoading,
      periods,
      resources
    } = this.props;

    if (committed) {
      if (!hasSpaces) {
        return <NoSpacesPlaceholder />;
      }
      if (typeof selectedPeriodIndex !== 'undefined') {
        return (
          <OrganizationUsagePage
            {...{
              period: periods[selectedPeriodIndex],
              spaceNames,
              isPoC,
              periodicUsage,
              apiRequestIncludedLimit,
              assetBandwidthData,
              isLoading
            }}
          />
        );
      }
    } else {
      if (typeof resources !== 'undefined') {
        return <OrganizationResourceUsageList resources={resources} />;
      }
    }
    return <div />;
  }
}

export class WorkbenchActions extends React.Component {
  static propTypes = {
    isLoading: PropTypes.bool,
    hasSpaces: PropTypes.bool,
    committed: PropTypes.bool,
    periods: PropTypes.array,
    selectedPeriodIndex: PropTypes.number,
    setPeriodIndex: PropTypes.func
  };

  render() {
    const {
      isLoading,
      hasSpaces,
      committed,
      periods,
      selectedPeriodIndex,
      setPeriodIndex
    } = this.props;

    return isLoading ? (
      <Spinner />
    ) : hasSpaces && committed && periods ? (
      <PeriodSelector
        periods={periods}
        selectedPeriodIndex={selectedPeriodIndex}
        onChange={setPeriodIndex}
      />
    ) : null;
  }
}

export class OrganizationUsage extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    onReady: PropTypes.func.isRequired,
    onForbidden: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = { isLoading: true };

    this.endpoint = EndpointFactory.createOrganizationEndpoint(props.orgId);
    this.setPeriodIndex = this.setPeriodIndex.bind(this);
  }

  async componentDidMount() {
    const { onForbidden } = this.props;

    try {
      await this.checkPermissions();
      await this.fetchOrgData();
    } catch (ex) {
      onForbidden(ex);
    }
  }

  async checkPermissions() {
    const { orgId } = this.props;
    const organization = await TokenStore.getOrganization(orgId);

    if (!OrganizationRoles.isOwnerOrAdmin(organization)) {
      throw new Error('No permission');
    }
  }

  async fetchOrgData() {
    const { orgId, onReady } = this.props;

    try {
      const service = createResourceService(orgId, 'organization');
      const basePlan = await PricingDataProvider.getBasePlan(this.endpoint);
      const committed = PricingDataProvider.isEnterprisePlan(basePlan);

      if (committed) {
        const [
          spaces,
          plans,
          periods,
          {
            limits: { included: apiRequestIncludedLimit }
          }
        ] = await Promise.all([
          OrganizationMembershipRepository.getAllSpaces(this.endpoint),
          PricingDataProvider.getPlansWithSpaces(this.endpoint),
          getPeriods(this.endpoint),
          service.get('api_request')
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
          hasSpaces: spaces.length !== 0
        });

        await this.loadPeriodData(0);
      } else {
        // console.log()
        this.setState({ resources: await service.getAll(), isLoading: false }, onReady);
      }

      this.setState({ committed }, onReady);
    } catch (e) {
      // Show the forbidden screen on 404 and 403
      if ([404, 403].includes(e.status)) {
        throw e;
      }

      ReloadNotification.trigger();
    }
  }

  loadPeriodData = async newIndex => {
    const { orgId } = this.props;
    const { periods } = this.state;

    const service = createResourceService(orgId, 'organization');
    const newPeriod = periods[newIndex];

    if (isNumber(this.state.selectedPeriodIndex)) {
      const oldPeriod = periods[this.state.selectedPeriodIndex];
      Analytics.track('usage:period_selected', {
        oldPeriod: pick(['startDate', 'endDate'], oldPeriod),
        newPeriod: pick(['startDate', 'endDate'], newPeriod)
      });
    }

    try {
      const promises = [
        getOrgUsage(this.endpoint, newPeriod.sys.id),
        ...['cma', 'cda', 'cpa'].map(api => getApiUsage(this.endpoint, newPeriod.sys.id, api))
      ];

      if (newIndex === 0) {
        promises.push(service.get('asset_bandwidth'));
      } else {
        // If the current usage period is not the first (current/most recent), we return null
        // for the asset bandwidth information.
        //
        // We don't have historical (or day-to-day) AB usage and can only show data for the user's
        // current usage period.
        promises.push(Promise.resolve(null));
      }

      const [org, cma, cda, cpa, assetBandwidthData] = await Promise.all(promises);

      this.setState({
        isLoading: false,
        periodicUsage: { org, apis: { cma, cda, cpa } },
        selectedPeriodIndex: newIndex,
        assetBandwidthData
      });
    } catch (e) {
      ReloadNotification.trigger();
    }
  };

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
      assetBandwidthData,
      committed,
      resources,
      hasSpaces
    } = this.state;
    return (
      <Workbench testId="organization.usage">
        <Workbench.Header>
          <Workbench.Icon icon="page-usage" />
          <Workbench.Title>Usage</Workbench.Title>
          <Workbench.Header.Actions>
            <WorkbenchActions
              {...{
                isLoading,
                hasSpaces,
                committed,
                periods,
                selectedPeriodIndex,
                setPeriodIndex: this.setPeriodIndex
              }}
            />
          </Workbench.Header.Actions>
        </Workbench.Header>
        <Workbench.Content>
          <WorkbenchContent
            {...{
              committed,
              hasSpaces,
              selectedPeriodIndex,
              spaceNames,
              isPoC,
              periodicUsage,
              apiRequestIncludedLimit,
              assetBandwidthData,
              isLoading,
              periods,
              resources
            }}
          />
        </Workbench.Content>
      </Workbench>
    );
  }
}

export default OrganizationUsage;
