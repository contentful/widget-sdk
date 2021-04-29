import React, { useEffect, useState } from 'react';
import EmptyNavigationBar from 'navigation/EmptyNavigationBar';
import { LoadingState } from 'features/loading-state';
import * as TokenStore from 'services/TokenStore';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { init as initAutoCreateNewSpace } from 'components/shared/auto_create_new_space';
import { PRESELECT_VALUES } from 'features/space-purchase';
import { useQueryParams } from 'core/hooks/useQueryParams';

import { EmptyHome } from './EmptyHome';
import { router } from 'core/react-routing';

const localStorage = getBrowserStorage();

export function EmptyHomeRouter() {
  const { appsPurchase } = useQueryParams();

  const [loading, setLoading] = useState(appsPurchase);

  useEffect(() => {
    if (!appsPurchase) {
      initAutoCreateNewSpace();
      setLoading(false);
      return;
    }

    async function init() {
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
        router.navigate(
          {
            path: 'organizations.subscription.newSpace',
            orgId: organization.sys.id,
            navigationState: {
              from: 'marketing_cta',
              preselect: PRESELECT_VALUES.APPS,
            },
          },
          { location: 'replace' }
        );
      } else {
        initAutoCreateNewSpace();
        setLoading(false);
      }
    }

    init();
  }, [appsPurchase]);

  if (loading) return <LoadingState />;

  return <EmptyHome />;
}

// This routing declaration refers to the "root" home, rather than the space home.
export const homeState = {
  name: 'home',
  url: '/',
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
