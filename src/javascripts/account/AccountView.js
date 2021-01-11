import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { getGatekeeperUrl } from 'account/UrlSyncHelper';
import { css } from 'emotion';

import { Workbench } from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import LoadingState from 'app/common/LoadingState';

const wrapperStyle = css({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
});

export default function AccountView({ title, icon, loadingText }) {
  const gatekeeperUrl = useMemo(() => getGatekeeperUrl(), []);
  const [loading, setLoading] = useState(true);

  return (
    <Workbench testId="account-iframe-page">
      {loading && <LoadingState loadingText={loadingText} />}

      <Workbench.Header
        title={title}
        icon={icon ? <ProductIcon icon={icon} size="large" /> : null}
      />
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

AccountView.propTypes = {
  title: PropTypes.string.isRequired,
  loadingText: PropTypes.string,
  icon: PropTypes.string,
};
