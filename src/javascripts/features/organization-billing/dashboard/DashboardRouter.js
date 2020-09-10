import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { Dashboard } from './Dashboard';
import { useAsync } from 'core/hooks/useAsync';
import { getBillingDetails, getInvoices } from '../services/BillingDetailsService';
import { getDefaultPaymentMethod } from '../services/PaymentMethodService';
import { getBasePlan, isEnterprisePlan } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';

const fetch = (organizationId) => async () => {
  const endpoint = createOrganizationEndpoint(organizationId);

  const [basePlan, invoices] = await Promise.all([
    getBasePlan(endpoint),
    getInvoices(organizationId),
  ]);

  const orgIsEnterprise = isEnterprisePlan(basePlan);

  const result = {
    invoices,
    orgIsEnterprise,
  };

  if (!orgIsEnterprise) {
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
  const { isLoading, data = {} } = useAsync(useCallback(fetch(organizationId), []));

  const { billingDetails, paymentDetails, invoices, orgIsEnterprise } = data;

  return (
    <Dashboard
      loading={isLoading}
      organizationId={organizationId}
      billingDetails={billingDetails}
      paymentDetails={paymentDetails}
      invoices={invoices}
      orgIsEnterprise={orgIsEnterprise}
    />
  );
}

DashboardRouter.propTypes = {
  orgId: PropTypes.string.isRequired,
};
