import React from 'react';
import PropTypes from 'prop-types';
import { mapValues, flow, keyBy, get, eq, isNumber, pick } from 'lodash/fp';
import { css } from 'emotion';
import { Spinner, Workbench } from '@contentful/forma-36-react-components';
import ReloadNotification from 'app/common/ReloadNotification';

import DocumentTitle from 'components/shared/DocumentTitle';
import { OrganizationUsagePage } from '../components/OrganizationUsagePage';
import { PeriodSelector } from '../components/PeriodSelector';
import { NoSpacesPlaceholder } from '../components/NoSpacesPlaceholder';
import { track } from 'analytics/Analytics';
import * as UsageService from '../services/UsageService';

import * as TokenStore from 'services/TokenStore';
import * as EndpointFactory from 'data/EndpointFactory';
import * as OrganizationMembershipRepository from 'access_control/OrganizationMembershipRepository';
import * as PricingDataProvider from 'account/pricing/PricingDataProvider';
import createResourceService from 'services/ResourceService';
import * as OrganizationRoles from 'services/OrganizationRoles';
import NavigationIcon from 'ui/Components/NavigationIcon';
import ErrorState from 'app/common/ErrorState';
import LoadingState from 'app/common/LoadingState';

const styles = {
  content: css({
    height: '100%',
    '> div': {
      height: '100%',
    },
  }),
};

export const WorkbenchContent = ({
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
  onTabSelect,
}) => {
  if (error) {
    return <ErrorState />;
  }

  if (isLoading) {
    // TODO: use skeleton loading
    return <LoadingState />;
  }

  if (!isLoading && !hasSpaces) {
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
          isLoading,
          onTabSelect,
        }}
      />
    );
  }

  return <div />;
};

WorkbenchContent.propTypes = {
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
      included: PropTypes.number,
    }),
  }),
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  periods: PropTypes.arrayOf(PropTypes.object),
  onTabSelect: PropTypes.func,
};

export const WorkbenchActions = ({
  isLoading,
  error,
  hasSpaces,
  periods,
  selectedPeriodIndex,
  setPeriodIndex,
  isAssetBandwidthTab,
  isTeamOrEnterpriseCustomer,
}) => {
  if (error) {
    return null; // The workbench content renders the error state
  }

  if (isLoading && isTeamOrEnterpriseCustomer && hasSpaces) {
    return <Spinner />;
  }

  if (hasSpaces && periods && isTeamOrEnterpriseCustomer && !isAssetBandwidthTab) {
    return (
      <PeriodSelector
        periods={periods}
        selectedPeriodIndex={selectedPeriodIndex}
        onChange={setPeriodIndex}
      />
    );
  }

  return null;
};

WorkbenchActions.propTypes = {
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  hasSpaces: PropTypes.bool,
  periods: PropTypes.array,
  selectedPeriodIndex: PropTypes.number,
  setPeriodIndex: PropTypes.func,
  isAssetBandwidthTab: PropTypes.bool,
  isTeamOrEnterpriseCustomer: PropTypes.bool,
};

// need to do this for the test
// eslint-disable-next-line rulesdir/restrict-multiple-react-component-exports
export class OrganizationUsageRouteNew extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      error: null,
      isAssetBandwidthTab: false,
    };

    this.endpoint = EndpointFactory.createOrganizationEndpoint(props.orgId);
    this.setPeriodIndex = this.setPeriodIndex.bind(this);
  }

  async componentDidMount() {
    try {
      await this.checkPermissions();
      await this.fetchOrgData();
      this.setState({ isLoading: false });
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
      const isTeamOrEnterpriseCustomer =
        PricingDataProvider.isEnterprisePlan(basePlan) ||
        PricingDataProvider.isSelfServicePlan(basePlan);

      const [
        spaces,
        plans,
        periods,
        {
          limits: { included: apiRequestIncludedLimit },
        },
      ] = await Promise.all([
        OrganizationMembershipRepository.getAllSpaces(this.endpoint),
        PricingDataProvider.getPlansWithSpaces(this.endpoint),
        UsageService.getPeriods(this.endpoint),
        service.get('api_request'),
      ]);

      const spaceNames = flow(keyBy('sys.id'), mapValues('name'))(spaces);

      const isPoC = flow(
        keyBy('space.sys.id'),
        mapValues(flow(get('name'), eq('Proof of concept')))
      )(plans.items);

      this.setState({
        spaceNames,
        isPoC,
        periods: periods.items,
        apiRequestIncludedLimit: apiRequestIncludedLimit ?? 0,
        isTeamOrEnterpriseCustomer,
        hasSpaces: spaces.length !== 0,
      });

      await this.loadPeriodData(0);
    } catch (e) {
      // Show the forbidden screen on 404 and 403
      if ([404, 403].includes(e.status)) {
        throw e;
      }

      ReloadNotification.trigger();
    }
  }

  loadPeriodData = async (newIndex) => {
    const { orgId } = this.props;
    const { periods } = this.state;

    const service = createResourceService(orgId, 'organization');
    const newPeriod = periods[newIndex];

    if (isNumber(this.state.selectedPeriodIndex)) {
      const oldPeriod = periods[this.state.selectedPeriodIndex];
      track('usage:period_selected', {
        oldPeriod: pick(['startDate', 'endDate'], oldPeriod),
        newPeriod: pick(['startDate', 'endDate'], newPeriod),
      });
    }

    try {
      const promises = [
        UsageService.getOrgUsage(this.endpoint, {
          startDate: newPeriod.startDate,
          endDate: newPeriod.endDate,
        }),
        ...['cma', 'cda', 'cpa', 'gql'].map((apiType) =>
          UsageService.getApiUsage(this.endpoint, {
            apiType,
            startDate: newPeriod.startDate,
            endDate: newPeriod.endDate,
            limit: 5,
          })
        ),
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
          newIndex,
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

  setIsAssetBandwidthTab = (val) => {
    this.setState({ isAssetBandwidthTab: val == 'assetBandwidth' });
  };

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
      hasSpaces,
      isAssetBandwidthTab,
      isTeamOrEnterpriseCustomer,
    } = this.state;

    return (
      <>
        <DocumentTitle title="Usage" />
        <Workbench testId="organization.usage">
          <Workbench.Header
            title="Usage"
            icon={<NavigationIcon icon="usage" color="green" size="large" />}
            actions={
              <WorkbenchActions
                {...{
                  isLoading,
                  hasSpaces,
                  periods,
                  selectedPeriodIndex,
                  setPeriodIndex: this.setPeriodIndex,
                  isAssetBandwidthTab,
                  isTeamOrEnterpriseCustomer,
                }}
              />
            }></Workbench.Header>
          <Workbench.Content className={styles.content}>
            <WorkbenchContent
              {...{
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
                onTabSelect: this.setIsAssetBandwidthTab,
              }}
            />
          </Workbench.Content>
        </Workbench>
      </>
    );
  }
}
