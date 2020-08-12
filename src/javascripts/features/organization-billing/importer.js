export async function importer() {
  const [{ EditPaymentMethodRouter }] = await Promise.all([
    import(
      /* webpackChunkName: "organization-billing" */ './edit-payment-method/EditPaymentMethodRouter'
    ),
  ]);

  return { EditPaymentMethodRouter };
}
