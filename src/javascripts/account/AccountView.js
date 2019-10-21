import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { getGatekeeperUrl } from 'account/UrlSyncHelper';
import { css } from 'emotion';

import Workbench from 'app/common/Workbench.es6';

const wrapperStyle = css({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0
});

export default function AccountView({ title, onReady }) {
  const gatekeeperUrl = useMemo(() => getGatekeeperUrl(), []);

  return (
    <Workbench title={title} testId="account-iframe-page">
      <Workbench.Content>
        <div className={wrapperStyle}>
          <iframe
            data-test-id="account-iframe"
            width="100%"
            height="100%"
            id="accountViewFrame"
            onLoad={() => onReady()}
            src={gatekeeperUrl}
          />
        </div>
      </Workbench.Content>
    </Workbench>
  );
}

AccountView.propTypes = {
  onReady: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired
};
