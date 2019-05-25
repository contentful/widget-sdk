// render iframe
// handle post messages
// show modal if page takes too long to load ?? what's the value of this?

import React, { useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { onValue } from 'utils/kefir.es6';
import createIframeChannel from 'account/IframeChannel.es6';
import { getGatekeeperUrl } from 'account/UrlSyncHelper.es6';
import { getModule } from 'NgRegistry.es6';
import { css } from 'emotion';

import Workbench from 'app/common/Workbench.es6';

const handleGatekeeperMessage = getModule('account/handleGatekeeperMessage.es6');

const wrapperStyle = css({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0
});

export default function AccountView({ title, onReady }) {
  const iframeRef = useRef();
  const gatekeeperUrl = useMemo(() => getGatekeeperUrl(), []);

  useEffect(() => {
    const message$ = createIframeChannel(iframeRef);
    const off = onValue(message$, message => {
      onReady();
      handleGatekeeperMessage(message);
    });

    return off;
  }, [onReady]);

  return (
    <Workbench title={title} testId="account-iframe-page">
      <Workbench.Content>
        <div className={wrapperStyle}>
          <iframe
            ref={iframeRef}
            width="100%"
            height="100%"
            id="accountViewFrame"
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
