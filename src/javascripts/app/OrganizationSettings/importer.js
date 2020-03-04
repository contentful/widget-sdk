export default async function importer() {
  return await import(/* webpackChunkName: "organization-settings" */ './LazilyLoadedComponents');
}
