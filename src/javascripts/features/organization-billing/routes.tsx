import React from 'react';

import { Route, Routes } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';
import { EditPaymentMethodRouter } from './edit-payment-method/EditPaymentMethodRouter';
import { DashboardRouter } from './dashboard/DashboardRouter';

export const BillingRouter = ({ orgId }: { orgId: string }) => {
  return (
    <Routes>
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
  );
};
