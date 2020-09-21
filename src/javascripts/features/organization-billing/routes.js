import React from 'react';
import { organizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import { importer } from './importer';

const editPaymentMethodRoute = organizationRoute({
  name: 'edit-payment-method',
  url: '/edit_payment_method',
  component: (props) => (
    <LazyLoadedComponent importer={importer}>
      {({ EditPaymentMethodRouter }) => {
        return <EditPaymentMethodRouter {...props} />;
      }}
    </LazyLoadedComponent>
  ),
});

export const billingRoutingState = organizationRoute({
  name: 'billing',
  url: '/billing',
  component: (props) => (
    <LazyLoadedComponent importer={importer}>
      {({ DashboardRouter }) => {
        return <DashboardRouter {...props} />;
      }}
    </LazyLoadedComponent>
  ),
  children: [editPaymentMethodRoute],
});
