import React, { useState } from 'react';
import { css } from 'emotion';

import { Workbench } from '@contentful/forma-36-react-components';
import { LoadingState } from 'features/loading-state';

import { getGatekeeperUrl } from './UrlSyncHelper';

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
  const gatekeeperUrl = React.useMemo(() => getGatekeeperUrl() as string, []);
  const [loading, setLoading] = useState(true);

  return (
    <Workbench testId="account-iframe-page">
      {loading && <LoadingState />}

      <Workbench.Header title={title} icon={icon} />
      <Workbench.Content>
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
      </Workbench.Content>
    </Workbench>
  );
}
