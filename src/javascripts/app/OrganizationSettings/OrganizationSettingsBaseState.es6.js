import Base from 'states/Base.es6';
import { getStore } from 'TheStore';
import * as Analytics from 'analytics/Analytics.es6';

const store = getStore();

// A list of states that have been changed
// to be adapted to the new pricing model (V2).
// Orgs that are still in the old pricing model
// still access the V1 state
const migratedStates = [
  {
    v1: 'account.organizations.subscription',
    v2: 'account.organizations.subscription_new'
  }
];

export default function OrganizationsBase(definition) {
  const defaults = {
    label: 'Organizations & Billing',
    onEnter: [
      '$state',
      '$stateParams',
      'require',
      async ($state, $stateParams, require) => {
        const accessChecker = require('access_control/AccessChecker');
        const useLegacy = require('utils/ResourceUtils.es6').useLegacy;
        const TokenStore = require('services/TokenStore.es6');
        const go = require('states/Navigator.es6').go;

        const org = await TokenStore.getOrganization($stateParams.orgId);

        Analytics.trackContextChange(null, org);

        const migration = migratedStates.find(state => $state.is(state.v1));
        accessChecker.setOrganization(org);
        store.set('lastUsedOrg', $stateParams.orgId);

        const isLegacy = await useLegacy(org);

        if (isLegacy) {
          const shouldRedirectToV2 = !isLegacy && Boolean(migration);
          // redirect old v1 state to the new v2 state
          // in case a user from a previously v1 org has
          // the URL bookmarked
          if (shouldRedirectToV2) {
            go({
              path: migration.v2.split('.'),
              params: { orgId: $stateParams.orgId }
            });
          }
        }
      }
    ]
  };
  return Base(Object.assign(defaults, definition));
}
