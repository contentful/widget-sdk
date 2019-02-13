import React from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'NgRegistry.es6';
import { mapValues, flow, keyBy, get, eq, isNumber, pick } from 'lodash/fp';

import { Spinner } from '@contentful/forma-36-react-components';
import Workbench from 'app/common/Workbench.es6';
import ReloadNotification from 'app/common/ReloadNotification.es6';

import OrganizationResourceUsageList from './non_committed/OrganizationResourceUsageList.es6';
import OrganizationUsagePage from './committed/OrganizationUsagePage.es6';
import { getPeriods, getOrgUsage, getApiUsage } from './UsageService.es6';
import PeriodSelector from './committed/PeriodSelector.es6';
import NoSpacesPlaceholder from './NoSpacesPlaceholder.es6';
import isPOCEnabled from 'account/POCFeatureFlag.es6';
import * as Analytics from 'analytics/Analytics.es6';
import * as LaunchDarkly from 'utils/LaunchDarkly/index.es6';

const OrganizationRoles = getModule('services/OrganizationRoles.es6');
const ResourceService = getModule('services/ResourceService.es6');
const PricingDataProvider = getModule('account/pricing/PricingDataProvider.es6');
const OrganizationMembershipRepository = getModule(
  'access_control/OrganizationMembershipRepository.es6'
);
const EndpointFactory = getModule('data/EndpointFactory.es6');
const TokenStore = getModule('services/TokenStore.es6');

export class WorkbenchContent extends React.Component {
  static propTypes = {
    committed: PropTypes.bool,
    flagActive: PropTypes.bool,
    hasSpaces: PropTypes.bool,
    selectedPeriodIndex: PropTypes.number,
    spaceNames: PropTypes.objectOf(PropTypes.string),
    isPoC: PropTypes.objectOf(PropTypes.bool),
    periodicUsage: PropTypes.object,
    apiRequestIncludedLimit: PropTypes.number,
    assetBandwidthUsage: PropTypes.number,
    assetBandwidthIncludedLimit: PropTypes.number,
    assetBandwidthUOM: PropTypes.string,
    isLoading: PropTypes.bool,
    periods: PropTypes.arrayOf(PropTypes.object),
    resources: PropTypes.arrayOf(PropTypes.object)
  };

  render() {
    const {
      committed,
      flagActive,
      hasSpaces,
      selectedPeriodIndex,
      spaceNames,
      isPoC,
      periodicUsage,
      apiRequestIncludedLimit,
      assetBandwidthUsage,
      assetBandwidthIncludedLimit,
      assetBandwidthUOM,
      isLoading,
      periods,
      resources
    } = this.props;

    if (committed && flagActive) {
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
              assetBandwidthUsage,
              assetBandwidthIncludedLimit,
              assetBandwidthUOM,
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
    flagActive: PropTypes.bool,
    periods: PropTypes.array,
    selectedPeriodIndex: PropTypes.number,
    setPeriodIndex: PropTypes.func
  };

  render() {
    const {
      isLoading,
      hasSpaces,
      committed,
      flagActive,
      periods,
      selectedPeriodIndex,
      setPeriodIndex
    } = this.props;

    return isLoading ? (
      <Spinner />
    ) : hasSpaces && committed && flagActive && periods ? (
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

    this.setState({
      flagActive: await LaunchDarkly.getCurrentVariation('feature-bizvel-09-2018-usage')
    });

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
    const { flagActive } = this.state;

    try {
      const service = ResourceService.default(orgId, 'organization');
      const basePlan = await PricingDataProvider.getBasePlan(this.endpoint);
      const committed = PricingDataProvider.isEnterprisePlan(basePlan);

      if (committed && flagActive) {
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
          OrganizationMembershipRepository.getAllSpaces(this.endpoint),
          PricingDataProvider.getPlansWithSpaces(this.endpoint, await isPOCEnabled()),
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

      this.setState({ committed }, onReady);
    } catch (e) {
      // Show the forbidden screen on 404 and 403
      if ([404, 403].includes(e.status)) {
        throw e;
      }

      ReloadNotification.trigger();
    }
  }

  async loadPeriodData(newIndex) {
    const { periods } = this.state;
    const newPeriod = periods[newIndex];
    if (isNumber(this.state.selectedPeriodIndex)) {
      const oldPeriod = periods[this.state.selectedPeriodIndex];
      Analytics.track('usage:period_selected', {
        oldPeriod: pick(['startDate', 'endDate'], oldPeriod),
        newPeriod: pick(['startDate', 'endDate'], newPeriod)
      });
    }
    try {
      const [org, cma, cda, cpa] = await Promise.all([
        getOrgUsage(this.endpoint, newPeriod.sys.id),
        ...['cma', 'cda', 'cpa'].map(api => getApiUsage(this.endpoint, newPeriod.sys.id, api))
      ]);
      this.setState({
        isLoading: false,
        periodicUsage: { org, apis: { cma, cda, cpa } },
        selectedPeriodIndex: newIndex
      });
    } catch (e) {
      ReloadNotification.trigger();
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
      committed,
      resources,
      flagActive,
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
                flagActive,
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
              flagActive,
              hasSpaces,
              selectedPeriodIndex,
              spaceNames,
              isPoC,
              periodicUsage,
              apiRequestIncludedLimit,
              assetBandwidthUsage,
              assetBandwidthIncludedLimit,
              assetBandwidthUOM,
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
