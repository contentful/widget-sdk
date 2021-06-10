import React, { useEffect } from 'react';
import { mapValues, flow, keyBy } from 'lodash/fp';
import { css } from 'emotion';
import { Spinner, Workbench } from '@contentful/forma-36-react-components';
import ReloadNotification from 'app/common/ReloadNotification';

import DocumentTitle from 'components/shared/DocumentTitle';
import { OrganizationUsageTabs } from './components/OrganizationUsageTabs';
import { PeriodSelector } from './components/PeriodSelector';
import { NoSpacesPlaceholder } from './components/NoSpacesPlaceholder';
import { getPeriods, loadPeriodData } from './services/UsageService';
import { UsageProvider, useUsageState, useUsageDispatch } from './hooks/usageContext';

import * as TokenStore from 'services/TokenStore';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import * as OrganizationMembershipRepository from 'access_control/OrganizationMembershipRepository';
import * as PricingDataProvider from 'account/pricing/PricingDataProvider';
import { getBasePlan } from 'features/pricing-entities';
import createResourceService from 'services/ResourceService';
import * as OrganizationRoles from 'services/OrganizationRoles';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import ErrorState from 'app/common/ErrorState';

const styles = {
  content: css({
    height: '100%',
    '> div': {
      height: '100%',
    },
  }),
};

export const WorkbenchContent = () => {
  const { hasSpaces, error } = useUsageState();

  if (error) {
    return <ErrorState />;
  }

  if (hasSpaces === false) {
    return <NoSpacesPlaceholder />;
  }

  return <OrganizationUsageTabs />;
};

export const WorkbenchActions = () => {
  const { isLoading, error, hasSpaces, periods, isTeamOrEnterpriseCustomer } = useUsageState();

  if (error) {
    return null;
  }

  if (isLoading && isTeamOrEnterpriseCustomer && hasSpaces) {
    return <Spinner testId="organization-usage_spinner" />;
  }

  if (hasSpaces && periods) {
    return <PeriodSelector />;
  }

  return null;
};

const OrganizationUsage = () => {
  const { selectedPeriodIndex, orgId } = useUsageState();
  const dispatch = useUsageDispatch();

  useEffect(() => {
    const checkPermissions = async () => {
      const organization = await TokenStore.getOrganization(orgId as string);

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

        const endpoint = createOrganizationEndpoint(orgId as string);
        const service = createResourceService(endpoint);
        const basePlan = await getBasePlan(endpoint);

        const isTeamOrEnterpriseCustomer =
          PricingDataProvider.isEnterprisePlan(basePlan) ||
          PricingDataProvider.isSelfServicePlan(basePlan);
        dispatch({ type: 'SET_CUSTOMER_TYPE', value: isTeamOrEnterpriseCustomer });

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
          service.get('api_request') as Promise<any>,
        ]);

        const periods = usagePeriods.items;
        const spaceNames = flow(keyBy('sys.id'), mapValues('name'))(spaces);
        const spaceTypeLookup = flow(keyBy('space.sys.id'), mapValues('name'))(plans.items);

        dispatch({
          type: 'SET_ORG_DATA',
          value: {
            spaceNames,
            spaceTypeLookup,
            periods: periods,
            apiRequestIncludedLimit: apiRequestIncludedLimit ?? 0,
            hasSpaces: spaces.length !== 0,
          },
        });

        const [usageData, assetBandwidthData] = await Promise.all([
          loadPeriodData(orgId as string, periods[selectedPeriodIndex]),
          service.get('asset_bandwidth'),
        ]);

        dispatch({ type: 'SET_USAGE_DATA', value: usageData });
        dispatch({ type: 'SET_ASSET_BANDWIDTH_DATA', value: assetBandwidthData });
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
          icon={<ProductIcon icon="Usage" size="large" />}
          actions={<WorkbenchActions />}
        />
        <Workbench.Content className={styles.content}>
          <WorkbenchContent />
        </Workbench.Content>
      </Workbench>
    </>
  );
};

type OrganizationUsagePageProps = {
  orgId: string;
};

export const OrganizationUsagePage = ({ orgId }: OrganizationUsagePageProps) => {
  return (
    <UsageProvider orgId={orgId}>
      <OrganizationUsage />
    </UsageProvider>
  );
};
