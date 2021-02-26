import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import EmptyNavigationBar from 'navigation/EmptyNavigationBar';
import { LoadingState } from 'features/loading-state';
import { go } from 'states/Navigator';
import * as TokenStore from 'services/TokenStore';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { init as initAutoCreateNewSpace } from 'components/shared/auto_create_new_space';

import { EmptyHome } from './EmptyHome';

const localStorage = getBrowserStorage();

export function EmptyHomeRouter({ appsPurchase }) {
  const [loading, setLoading] = useState(appsPurchase);

  useEffect(() => {
    async function init() {
      if (!appsPurchase) {
        await initAutoCreateNewSpace();
        setLoading(false);
        return;
      }

      const organizations = await TokenStore.getOrganizations();

      const lastUsedOrgId = localStorage.get('lastUsedOrg');
      const lastUsedOrg = organizations.find((org) => org.sys.id === lastUsedOrgId);

      let organization = lastUsedOrg ?? organizations[0];

      if (organization?.pricingVersion === 'pricing_version_1') {
        // If the last used org is pricing v1, find the first v2 org instead
        const firstV2Org = organizations.find((org) => org.pricingVersion === 'pricing_version_2');

        if (firstV2Org) {
          organization = firstV2Org;
        } else {
          // If no pricing v2 org was able to be found, then unset the organization entirely.
          // Compose + Launch cannot be purchased by these users
          organization = null;
        }
      }

      if (organization) {
        go({
          path: ['account', 'organizations', 'subscription_new', 'new_space'],
          params: { orgId: organization.sys.id, from: 'marketing_cta' },
          options: { location: 'replace' },
        });
      } else {
        await initAutoCreateNewSpace();
        setLoading(false);
      }
    }

    init();
  }, [appsPurchase]);

  if (loading) return <LoadingState />;

  return <EmptyHome />;
}

EmptyHomeRouter.propTypes = {
  appsPurchase: PropTypes.bool.isRequired,
};

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
  navComponent: EmptyNavigationBar,
  component: EmptyHomeRouter,
};
