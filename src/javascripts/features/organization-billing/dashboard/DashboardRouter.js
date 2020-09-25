import React, { useCallback, useReducer } from 'react';
import PropTypes from 'prop-types';
import { Dashboard } from './Dashboard';
import { useAsync } from 'core/hooks/useAsync';
import { getBillingDetails, getInvoices } from '../services/BillingDetailsService';
import { getDefaultPaymentMethod } from '../services/PaymentMethodService';
import {
  getBasePlan,
  isSelfServicePlan,
  isEnterprisePlan,
} from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { createImmerReducer } from 'core/utils/createImmerReducer';

const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ORG_DETAILS: 'SET_ORG_DETAILS',
  SET_INVOICES: 'SET_INVOICES',
  SET_BILLING_DETAILS: 'SET_BILLING_DETAILS',
  SET_PAYMENT_DETAILS: 'SET_PAYMENT_DETAILS',
};

const fetch = (organizationId, dispatch) => async () => {
  const endpoint = createOrganizationEndpoint(organizationId);
  const basePlan = await getBasePlan(endpoint);

  const orgIsSelfService = isSelfServicePlan(basePlan);
  const orgIsEnterprise = isEnterprisePlan(basePlan);

  dispatch({
    type: ACTIONS.SET_ORG_DETAILS,
    orgIsSelfService,
    orgIsEnterprise,
  });

  const invoices = await getInvoices(organizationId);

  dispatch({
    type: ACTIONS.SET_INVOICES,
    invoices,
  });

  if (orgIsSelfService) {
    const [billingDetails, paymentDetails] = await Promise.all([
      getBillingDetails(organizationId),
      getDefaultPaymentMethod(organizationId),
    ]);

    dispatch({
      type: ACTIONS.SET_BILLING_DETAILS,
      billingDetails,
    });

    dispatch({
      type: ACTIONS.SET_PAYMENT_DETAILS,
      paymentDetails,
    });
  }

  dispatch({ type: ACTIONS.SET_LOADING, isLoading: false });
};

const reducer = createImmerReducer({
  [ACTIONS.SET_LOADING]: (state, { isLoading }) => {
    state.loading = isLoading;
  },
  [ACTIONS.SET_ORG_DETAILS]: (state, { orgIsSelfService, orgIsEnterprise }) => {
    state.orgIsSelfService = orgIsSelfService;
    state.orgIsEnterprise = orgIsEnterprise;
  },
  [ACTIONS.SET_INVOICES]: (state, { invoices }) => {
    state.invoices = invoices;
  },
  [ACTIONS.SET_BILLING_DETAILS]: (state, { billingDetails }) => {
    state.billingDetails = billingDetails;
  },
  [ACTIONS.SET_PAYMENT_DETAILS]: (state, { paymentDetails }) => {
    state.paymentDetails = paymentDetails;
  },
});

export function DashboardRouter({ orgId: organizationId }) {
  const [state, dispatch] = useReducer(reducer, {
    loading: true,
    orgIsSelfService: null,
    orgIsEnterprise: null,
    billingDetails: null,
    paymentDetails: null,
    invoices: null,
  });

  const {
    loading,
    orgIsSelfService,
    orgIsEnterprise,
    billingDetails,
    paymentDetails,
    invoices,
  } = state;

  useAsync(useCallback(fetch(organizationId, dispatch), []));

  return (
    <Dashboard
      loading={loading}
      organizationId={organizationId}
      billingDetails={billingDetails}
      paymentDetails={paymentDetails}
      invoices={invoices}
      orgIsSelfService={orgIsSelfService}
      orgIsEnterprise={orgIsEnterprise}
      onEditBillingDetails={(newBillingDetails) =>
        dispatch({ type: ACTIONS.SET_BILLING_DETAILS, billingDetails: newBillingDetails })
      }
    />
  );
}

DashboardRouter.propTypes = {
  orgId: PropTypes.string.isRequired,
};
