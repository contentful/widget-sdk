import React, { useEffect, useState } from 'react';
import { LoadingState } from 'features/loading-state';
import * as TokenStore from 'services/TokenStore';
import * as accessChecker from 'access_control/AccessChecker';
import { getBrowserStorage } from 'core/services/BrowserStorage';

export function withOrganizationRoute<T>(Component: React.ComponentType<T>) {
  function OrganizationRoute(props: T & { orgId: string }) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      async function init() {
        const organization = await TokenStore.getOrganization(props.orgId);
        const browserStore = getBrowserStorage();
        accessChecker.setOrganization(organization);
        browserStore.set('lastUsedOrg', props.orgId);
        setIsLoading(false);
      }

      init();
    }, [props.orgId]);

    if (isLoading) {
      return <LoadingState />;
    }

    return <Component {...props} />;
  }

  return OrganizationRoute;
}
