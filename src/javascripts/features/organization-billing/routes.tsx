import React from 'react';
import { withOrganizationRoute } from 'states/withOrganizationRoute';

import { CustomRouter, Route, RouteErrorBoundary, Routes } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';
import { EditPaymentMethodRouter } from './edit-payment-method/EditPaymentMethodRouter';
import { DashboardRouter } from './dashboard/DashboardRouter';

import { getModule } from 'core/NgRegistry';

export const billingRoutingState = {
  name: 'billing',
  url: '/billing{pathname:any}',
  component: withOrganizationRoute(function ComponentRoute() {
    const [basename] = window.location.pathname.split('billing');
    const { orgId } = getModule('$stateParams');
    return (
      <CustomRouter splitter={'billing'}>
        <RouteErrorBoundary>
          <Routes basename={basename + 'billing'}>
            <Route
              name="account.organizations.billing"
              path="/"
              element={<DashboardRouter orgId={orgId} />}
            />
            <Route
              name="account.organizations.billing.edit-payment-method"
              path="/edit_payment_method"
              element={<EditPaymentMethodRouter orgId={orgId} />}
            />
            <Route name={null} path="*" element={<StateRedirect path="home" />} />
          </Routes>
        </RouteErrorBoundary>
      </CustomRouter>
    );
  }),
};
