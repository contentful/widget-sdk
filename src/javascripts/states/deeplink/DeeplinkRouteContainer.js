import React, { useMemo, useEffect, useState } from 'react';
import DeeplinkPage from './DeeplinkPage';
import { getMarketplaceApps } from './utils';
import { getLocationHref, getQueryString } from 'utils/location';

export function DeeplinkRouteContainer() {
  const href = useMemo(() => getLocationHref(), []);
  const searchParams = useMemo(() => getQueryString(), []);
  const [marketplaceApps, setMarketplaceApps] = useState({});

  useEffect(() => {
    if (searchParams.link !== 'apps') return;

    async function fetchApps() {
      const apps = await getMarketplaceApps();
      setMarketplaceApps(apps);
    }

    fetchApps();
  }, [searchParams]);

  return <DeeplinkPage href={href} searchParams={searchParams} marketplaceApps={marketplaceApps} />;
}
