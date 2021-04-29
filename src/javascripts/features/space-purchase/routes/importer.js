export async function importer() {
  const [{ SpacePurchaseRoute }] = await Promise.all([
    import(/* webpackChunkName: "space-purchase" */ './SpacePurchaseRoute'),
  ]);

  return { SpacePurchaseRoute };
}
