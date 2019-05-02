import { getOrgFeature } from 'data/CMA/ProductCatalog.es6';

export function isEnabled(orgId) {
  // Argument 2:
  // "Custom Sidebar" is the name of the initial feature.
  // Now we use an umbrella term of "Advanced Extensibility".
  // We kept the ID so no extra effort was needed on the GK side.
  //
  // Argument 3:
  // By passing `true` we enable the feature in case of Product Catalog unavailability.
  return getOrgFeature(orgId, 'custom_sidebar', true);
}
