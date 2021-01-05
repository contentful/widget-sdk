import React from 'react';
import { withOrganizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import { importer } from './importer';

const editPaymentMethodRoute = {
  name: 'edit-payment-method',
  url: '/edit_payment_method',
  component: withOrganizationRoute((props) => (
    <LazyLoadedComponent importer={importer}>
      {({ EditPaymentMethodRouter }) => {
        return <EditPaymentMethodRouter {...props} />;
      }}
    </LazyLoadedComponent>
  )),
};

export const billingRoutingState = {
  name: 'billing',
  url: '/billing',
  component: withOrganizationRoute((props) => (
    <LazyLoadedComponent importer={importer}>
      {({ DashboardRouter }) => {
        return <DashboardRouter {...props} />;
      }}
    </LazyLoadedComponent>
  )),
  children: [editPaymentMethodRoute],
};
