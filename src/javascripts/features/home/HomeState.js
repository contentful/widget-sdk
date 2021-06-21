import React, { useEffect, useState } from 'react';
import EmptyNavigationBar from 'navigation/EmptyNavigationBar';
import { StateTitle } from 'navigation/Sidepanel/SidePanelTrigger/SidePanelTrigger';

import { LoadingState } from 'features/loading-state';
import * as TokenStore from 'services/TokenStore';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { init as initAutoCreateNewSpace } from 'components/shared/auto_create_new_space';
import { PRESELECT_VALUES } from 'features/space-purchase';
import { useQueryParams } from 'core/hooks/useQueryParams';

import { EmptyHome } from './EmptyHome';
import { router } from 'core/react-routing';
import OnboardingRoute from 'components/shared/stack-onboarding/OnboardingRoute';
import { isDeveloper as checkIfDeveloper } from 'features/onboarding';

const localStorage = getBrowserStorage();

export function EmptyHomeRouter() {
  const { appsPurchase } = useQueryParams();

  const [loading, setLoading] = useState(appsPurchase);
  const [developer, setDeveloper] = useState(false);

  useEffect(() => {
    if (!appsPurchase) {
      checkIfDeveloper().then((isDeveloper) => setDeveloper(isDeveloper));
      initAutoCreateNewSpace();
      setLoading(false);
      return;
    }

    async function init() {
      const organizations = await TokenStore.getOrganizations();

      const lastUsedOrgId = localStorage.get('lastUsedOrg');
      const lastUsedOrg = organizations.find((org) => org.sys.id === lastUsedOrgId);

      const organization = lastUsedOrg ?? organizations[0];

      if (organization) {
        router.navigate(
          {
            path: 'organizations.subscription.new_space',
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

  if (loading) {
    return <LoadingState />;
  }

  if (developer) {
    return <OnboardingRoute />;
  }

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
  navComponent: () => {
    return <EmptyNavigationBar triggerText={<StateTitle title="Welcome to Contentful" />} />;
  },
  component: EmptyHomeRouter,
};
