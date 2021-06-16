import React, { useState } from 'react';
import { css } from 'emotion';

import { Workbench } from '@contentful/forma-36-react-components';
import { LoadingState } from 'features/loading-state';
import { getGatekeeperUrl } from './UrlSyncHelper';
import { useLocation } from 'core/react-routing';

const wrapperStyle = css({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
});

export function GatekeeperView({
  title,
  icon,
}: {
  title: string;
  icon?: React.ReactElement<unknown>;
}) {
  const location = useLocation();
  const [gatekeeperUrl, setGatekeeperUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    setGatekeeperUrl(getGatekeeperUrl(location.pathname) as string);
  }, [location.pathname]);

  return (
    <Workbench testId="account-iframe-page">
      {(loading || !gatekeeperUrl) && <LoadingState />}

      <Workbench.Header title={title} icon={icon} />
      <Workbench.Content>
        {gatekeeperUrl && (
          <div className={wrapperStyle}>
            <iframe
              data-test-id="account-iframe"
              width="100%"
              height="100%"
              id="accountViewFrame"
              onLoad={() => setLoading(false)}
              src={gatekeeperUrl}
            />
          </div>
        )}
      </Workbench.Content>
    </Workbench>
  );
}
