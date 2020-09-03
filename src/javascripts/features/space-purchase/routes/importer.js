export async function importer() {
  const [{ NewSpaceRoute }] = await Promise.all([
    import(/* webpackChunkName: "new-space-purchase" */ './NewSpaceRoute'),
  ]);

  return { NewSpaceRoute };
}
