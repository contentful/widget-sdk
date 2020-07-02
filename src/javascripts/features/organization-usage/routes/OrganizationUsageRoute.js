import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { mapValues, flow, keyBy, get, eq } from 'lodash/fp';

import { Spinner, Workbench } from '@contentful/forma-36-react-components';
import ReloadNotification from 'app/common/ReloadNotification';

import DocumentTitle from 'components/shared/DocumentTitle';
import { OrganizationResourceUsageList } from '../components/OrganizationResourceUsageList';
import { OrganizationUsagePage } from '../components/OrganizationUsagePage';
import { PeriodSelector } from '../components/PeriodSelector';
import { NoSpacesPlaceholder } from '../components/NoSpacesPlaceholder';
import { getPeriods, loadPeriodData } from '../services/UsageService';

import * as TokenStore from 'services/TokenStore';
import * as EndpointFactory from 'data/EndpointFactory';
import * as OrganizationMembershipRepository from 'access_control/OrganizationMembershipRepository';
import * as PricingDataProvider from 'account/pricing/PricingDataProvider';
import createResourceService from 'services/ResourceService';
import * as OrganizationRoles from 'services/OrganizationRoles';
import NavigationIcon from 'ui/Components/NavigationIcon';
import ErrorState from 'app/common/ErrorState';
import { UsageProvider, useUsageState, useUsageDispatch } from '../hooks/usageContext';

import { NEW_USAGE_PAGE } from 'featureFlags';
import { getVariation } from 'LaunchDarkly';

export const WorkbenchContent = ({ resources, showNewPricingFeature }) => {
  const {
    hasSpaces,
    error,
    isTeamOrEnterpriseCustomer,
    periodicUsage,
    assetBandwidthData,
  } = useUsageState();

  if (error) {
    return <ErrorState />;
  }

  // targets free customer on pricing v2
  if (!!resources && !showNewPricingFeature && !isTeamOrEnterpriseCustomer) {
    return <OrganizationResourceUsageList resources={resources} />;
  }

  if (hasSpaces === false) {
    return <NoSpacesPlaceholder />;
  }

  if (!!periodicUsage && !!assetBandwidthData) {
    return <OrganizationUsagePage />;
  }

  return <div />;
};

WorkbenchContent.propTypes = {
  resources: PropTypes.arrayOf(PropTypes.object),
  showNewPricingFeature: PropTypes.bool,
};

export const WorkbenchActions = () => {
  const {
    isLoading,
    error,
    hasSpaces,
    periods,
    isAssetBandwidthTab,
    isTeamOrEnterpriseCustomer,
  } = useUsageState();

  if (error) {
    return null;
  }

  if (isLoading && isTeamOrEnterpriseCustomer && hasSpaces) {
    return <Spinner testId="organization-usage_spinner" />;
  }

  if (hasSpaces && periods && isTeamOrEnterpriseCustomer && !isAssetBandwidthTab) {
    return <PeriodSelector />;
  }

  return null;
};

export const OrganizationUsage = () => {
  const { selectedPeriodIndex, orgId } = useUsageState();
  const dispatch = useUsageDispatch();

  const [showNewPricingFeature, setShowNewPricingFeature] = useState(false);
  const [resources, setResources] = useState();

  useEffect(() => {
    const checkPermissions = async () => {
      const organization = await TokenStore.getOrganization(orgId);

      return OrganizationRoles.isOwnerOrAdmin(organization);
    };

    const fetchOrgData = async () => {
      try {
        // check permission first to decide wether to render the usage page
        const hasPermission = await checkPermissions();
        if (!hasPermission) {
          dispatch({ type: 'SET_ERROR', value: true });
          dispatch({ type: 'SET_LOADING', value: false });
          return;
        }

        const variation = await getVariation(NEW_USAGE_PAGE, {
          organizationId: orgId,
        });
        setShowNewPricingFeature(variation);

        const endpoint = EndpointFactory.createOrganizationEndpoint(orgId);
        const service = createResourceService(orgId, 'organization');
        const basePlan = await PricingDataProvider.getBasePlan(endpoint);

        const isTeamOrEnterpriseCustomer = variation
          ? PricingDataProvider.isEnterprisePlan(basePlan) ||
            PricingDataProvider.isSelfServicePlan(basePlan)
          : PricingDataProvider.isEnterprisePlan(basePlan);

        if (!variation && !isTeamOrEnterpriseCustomer) {
          setResources(await service.getAll());
          dispatch({ type: 'SET_LOADING', value: false });
          return;
        }

        const [
          spaces,
          plans,
          usagePeriods,
          {
            limits: { included: apiRequestIncludedLimit },
          },
        ] = await Promise.all([
          OrganizationMembershipRepository.getAllSpaces(endpoint),
          PricingDataProvider.getPlansWithSpaces(endpoint),
          getPeriods(endpoint),
          service.get('api_request'),
        ]);

        const periods = usagePeriods.items;
        const spaceNames = flow(keyBy('sys.id'), mapValues('name'))(spaces);
        const isPoC = flow(
          keyBy('space.sys.id'),
          mapValues(flow(get('name'), eq('Proof of concept')))
        )(plans.items);

        dispatch({
          type: 'SET_ORG_DATA',
          value: {
            spaceNames,
            isPoC,
            periods: periods,
            apiRequestIncludedLimit: apiRequestIncludedLimit ?? 0,
            isTeamOrEnterpriseCustomer,
            hasSpaces: spaces.length !== 0,
          },
        });

        const [usageData, aassetBandwidthData] = await Promise.all([
          loadPeriodData(orgId, periods[selectedPeriodIndex]),
          service.get('asset_bandwidth'),
        ]);

        dispatch({ type: 'SET_USAGE_DATA', value: usageData });
        dispatch({ type: 'SET_ASSET_BANDWIDTH_DATA', value: aassetBandwidthData });
        dispatch({ type: 'SET_LOADING', value: false });
      } catch (e) {
        // Show the forbidden screen on 404 and 403
        if ([404, 403].includes(e.status)) {
          throw e;
        }

        ReloadNotification.trigger();
      }
    };

    fetchOrgData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <DocumentTitle title="Usage" />
      <Workbench testId="organization.usage">
        <Workbench.Header
          title="Usage"
          icon={<NavigationIcon icon="usage" color="green" size="large" />}
          actions={<WorkbenchActions />}></Workbench.Header>
        <Workbench.Content>
          <WorkbenchContent
            {...{
              resources,
              showNewPricingFeature,
            }}
          />
        </Workbench.Content>
      </Workbench>
    </>
  );
};

export const OrganizationUsageRoute = ({ orgId }) => {
  return (
    <UsageProvider orgId={orgId}>
      <OrganizationUsage />
    </UsageProvider>
  );
};

OrganizationUsageRoute.propTypes = {
  orgId: PropTypes.string.isRequired,
};
