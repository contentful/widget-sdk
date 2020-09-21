export async function importer() {
  const [{ EditPaymentMethodRouter }, { DashboardRouter }] = await Promise.all([
    import(
      /* webpackChunkName: "organization-billing" */ './edit-payment-method/EditPaymentMethodRouter'
    ),
    import(/* webpackChunkName: "organization-billing" */ './dashboard/DashboardRouter'),
  ]);

  return { EditPaymentMethodRouter, DashboardRouter };
}
