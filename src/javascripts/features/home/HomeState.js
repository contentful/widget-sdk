import EmptyNavigationBar from 'navigation/EmptyNavigationBar';
import { disable as disableOnboarding } from 'components/shared/auto_create_new_space';
import { go } from 'states/Navigator';
import * as TokenStore from 'services/TokenStore';
import { getBrowserStorage } from 'core/services/BrowserStorage';

import { EmptyHome } from './EmptyHome';

const localStorage = getBrowserStorage();

// This routing declaration refers to the "root" home, rather than the space home.
export const homeState = {
  name: 'home',
  url: '/?appsPurchase',
  params: {
    orgId: null,
    appsPurchase: {
      type: 'bool',
      value: false,
    },
  },
  onEnter: [
    '$stateParams',
    async ($stateParams) => {
      // This logic is done here, rather than in the component, so that we can disable onboarding
      // before prelude.js can initialize it. prelude.js waits for the first route to fully load,
      // including waiting for the `onEnter` function to complete, before initializing it, which allows
      // routes to disable it if necessary.
      //
      // If the below logic was done in the component there would likely be a visual flicker when the
      // onboarding view appears then almost immediately disappears.
      const { appsPurchase } = $stateParams;

      if (appsPurchase) {
        disableOnboarding();

        const organizations = await TokenStore.getOrganizations();
        const lastUsedOrgId = localStorage.get('lastUsedOrg');

        // Default value is the first organization's id
        let organizationId = organizations[0]?.sys?.id;

        const lastUsedOrg = organizations.find((org) => org.sys.id === lastUsedOrgId);

        if (lastUsedOrg?.pricingVersion === 'pricing_version_1') {
          // If the last used org is pricing v1, find the first v2 org instead
          const firstV2Org = organizations.find(
            (org) => org.pricingVersion === 'pricing_version_2'
          );

          if (firstV2Org) {
            organizationId = firstV2Org.sys.id;
          }
        }

        if (organizationId) {
          go({
            path: ['account', 'organizations', 'subscription_new', 'new_space'],
            params: { orgId: organizationId },
            options: { location: 'replace' },
          });
        }
      }
    },
  ],
  navComponent: EmptyNavigationBar,
  component: EmptyHome,
};
