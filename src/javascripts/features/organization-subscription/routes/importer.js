export async function importer() {
  return await import(/* webpackChunkName: "organization-settings" */ './SubscriptionPageRouter');
}
