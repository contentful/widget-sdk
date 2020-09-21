import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Dashboard } from './Dashboard';
import { useAsync, useAsyncFn } from 'core/hooks/useAsync';
import { getBillingDetails, getInvoices } from '../services/BillingDetailsService';
import { getDefaultPaymentMethod } from '../services/PaymentMethodService';
import {
  getBasePlan,
  isSelfServicePlan,
  isEnterprisePlan,
} from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';

const fetchOrgDetails = (organizationId) => async () => {
  const endpoint = createOrganizationEndpoint(organizationId);
  const basePlan = await getBasePlan(endpoint);

  console.log(basePlan);

  const orgIsSelfService = isSelfServicePlan(basePlan);
  const orgIsEnterprise = isEnterprisePlan(basePlan);

  return { orgIsSelfService, orgIsEnterprise };
};

const fetchData = (organizationId, orgIsSelfService) => async () => {
  const invoices = await getInvoices(organizationId);

  const result = {
    invoices,
  };

  if (orgIsSelfService) {
    const [billingDetails, paymentDetails] = await Promise.all([
      getBillingDetails(organizationId),
      getDefaultPaymentMethod(organizationId),
    ]);

    Object.assign(result, {
      billingDetails,
      paymentDetails,
    });
  }

  return result;
};

export function DashboardRouter({ orgId: organizationId }) {
  const [loadingData, setLoadingData] = useState(true);

  const { isLoading: loadingOrgDetails, data: orgDetails = {} } = useAsync(
    useCallback(fetchOrgDetails(organizationId), [])
  );

  const { orgIsSelfService, orgIsEnterprise } = orgDetails;

  const [{ data = {} }, doFetchData] = useAsyncFn(
    useCallback(fetchData(organizationId, orgIsSelfService), [orgIsSelfService])
  );

  const { billingDetails, paymentDetails, invoices } = data;

  useEffect(() => {
    if (data.invoices) {
      setLoadingData(false);
    }
  }, [data]);

  useEffect(() => {
    if (!loadingOrgDetails) {
      doFetchData();
    }
  }, [loadingOrgDetails, doFetchData]);

  const loading = loadingOrgDetails || loadingData;

  return (
    <Dashboard
      loading={loading}
      organizationId={organizationId}
      billingDetails={billingDetails}
      paymentDetails={paymentDetails}
      invoices={invoices}
      orgIsSelfService={orgIsSelfService}
      orgIsEnterprise={orgIsEnterprise}
    />
  );
}

DashboardRouter.propTypes = {
  orgId: PropTypes.string.isRequired,
};
