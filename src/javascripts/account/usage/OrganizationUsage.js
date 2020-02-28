import React from 'react';
import PropTypes from 'prop-types';
import { mapValues, flow, keyBy, get, eq, isNumber, pick } from 'lodash/fp';

import { Spinner, Workbench } from '@contentful/forma-36-react-components';
import ReloadNotification from 'app/common/ReloadNotification';

import OrganizationResourceUsageList from './non_committed/OrganizationResourceUsageList';
import OrganizationUsagePage from './committed/OrganizationUsagePage';
import PeriodSelector from './committed/PeriodSelector';
import NoSpacesPlaceholder from './NoSpacesPlaceholder';
import * as Analytics from 'analytics/Analytics';
import * as UsageService from '././UsageService';

import * as TokenStore from 'services/TokenStore';
import * as EndpointFactory from 'data/EndpointFactory';
import * as OrganizationMembershipRepository from 'access_control/OrganizationMembershipRepository';
import * as PricingDataProvider from 'account/pricing/PricingDataProvider';
import createResourceService from 'services/ResourceService';
import * as OrganizationRoles from 'services/OrganizationRoles';
import Icon from 'ui/Components/Icon';
import ErrorState from 'app/common/ErrorState';

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
    error: PropTypes.string,
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
      error,
      periods,
      resources
    } = this.props;

    if (error) {
      return <ErrorState />;
    }

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
    error: PropTypes.string,
    hasSpaces: PropTypes.bool,
    committed: PropTypes.bool,
    periods: PropTypes.array,
    selectedPeriodIndex: PropTypes.number,
    setPeriodIndex: PropTypes.func
  };

  render() {
    const {
      isLoading,
      error,
      hasSpaces,
      committed,
      periods,
      selectedPeriodIndex,
      setPeriodIndex
    } = this.props;

    if (error) {
      return null;
    }

    if (isLoading) {
      return <Spinner />;
    }

    if (hasSpaces && committed && periods) {
      return (
        <PeriodSelector
          periods={periods}
          selectedPeriodIndex={selectedPeriodIndex}
          onChange={setPeriodIndex}
        />
      );
    }

    return null;
  }
}

export class OrganizationUsage extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired
  };

  constructor(props) {
    super(props);

    this.state = { isLoading: true, error: null };

    this.endpoint = EndpointFactory.createOrganizationEndpoint(props.orgId);
    this.setPeriodIndex = this.setPeriodIndex.bind(this);
  }

  async componentDidMount() {
    try {
      await this.checkPermissions();
      await this.fetchOrgData();
    } catch (ex) {
      this.setState({ isLoading: false, error: ex.message });
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
    const { orgId } = this.props;

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
          UsageService.getPeriods(this.endpoint),
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
        this.setState({ resources: await service.getAll(), isLoading: false });
      }

      this.setState({ committed });
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
        UsageService.getOrgUsage(this.endpoint, {
          startDate: newPeriod.startDate,
          endDate: newPeriod.endDate,
          periodId: newPeriod.sys.id
        }),
        ...['cma', 'cda', 'cpa', 'gql'].map(apiType =>
          UsageService.getApiUsage(this.endpoint, {
            apiType,
            startDate: newPeriod.startDate,
            endDate: newPeriod.endDate,
            periodId: newPeriod.sys.id
          })
        )
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

      const [org, cma, cda, cpa, gql, assetBandwidthData] = await Promise.all(promises);

      this.setState(
        UsageService.mapResponseToState({
          org,
          cma,
          cda,
          cpa,
          gql,
          assetBandwidthData,
          newIndex
        })
      );
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
      error,
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
        <Workbench.Header
          title="Usage"
          icon={<Icon name="page-usage" scale="0.75" />}
          actions={
            <WorkbenchActions
              {...{
                isLoading,
                error,
                hasSpaces,
                committed,
                periods,
                selectedPeriodIndex,
                setPeriodIndex: this.setPeriodIndex
              }}
            />
          }></Workbench.Header>
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
              error,
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
