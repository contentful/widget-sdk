export async function importer() {
  const [{ NewSpaceRoute }, { UpgradeSpaceRoute }] = await Promise.all([
    import(/* webpackChunkName: "new-space-purchase" */ './NewSpaceRoute'),
    import(/* webpackChunkName: "new-space-purchase" */ './UpgradeSpaceRoute'),
  ]);

  return { NewSpaceRoute, UpgradeSpaceRoute };
}
