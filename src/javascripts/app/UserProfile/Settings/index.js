import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card } from '@contentful/forma-36-react-components';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import useAsync from 'app/common/hooks/useAsync.es6';
import { getVariation } from 'LaunchDarkly.es6';
import { TWO_FA as TWO_FA_FLAG } from 'featureFlags.es6';

import { fetchUserData } from './AccountRepository';
import AccountDetails from './AccountDetails';
import DangerZoneSection from './DangerZoneSection';
import SecuritySection from './SecuritySection';

import ErrorState from 'app/common/ErrorState';
import LoadingState from 'app/common/LoadingState';

const styles = {
  content: css({
    height: '100%',
    '> div': {
      height: '100%'
    }
  }),
  section: css({
    maxWidth: '768px',
    margin: `${tokens.spacingL} auto`,
    padding: tokens.spacingXl
  })
};

export default function IndexPage({ title, onReady }) {
  const [user, setUser] = useState({});
  const [mfaEnabled, setMFAEnabled] = useState(false);

  const { isLoading, error } = useAsync(
    useCallback(async () => {
      const [user, variation] = await Promise.all([fetchUserData(), getVariation(TWO_FA_FLAG)]);

      // We fetch the user here and set it above so that children
      // components can update the user without needing to fetch
      setUser(user);
      setMFAEnabled(variation);
    }, [])
  );
  useEffect(onReady, [onReady]);

  const { userCancellationWarning: warning } = user;

  return (
    <>
      <DocumentTitle title={title} />
      <Workbench>
        <Workbench.Header title={title} />
        <Workbench.Content className={styles.content}>
          {isLoading && <LoadingState loadingText="Loading your account…" />}
          {!isLoading && error && <ErrorState />}
          {!isLoading && !error && (
            <>
              <Card testId="account-details-section-card" className={styles.section}>
                <AccountDetails user={user} onChangePassword={setUser} onEdit={setUser} />
              </Card>
              {!user.ssoLoginOnly && mfaEnabled && (
                <Card testId="security-section-card" className={styles.section}>
                  <SecuritySection
                    user={user}
                    onAddPassword={setUser}
                    onEnable2FA={() => {
                      setUser({ ...user, mfaEnabled: true });
                    }}
                    onDisable2FA={() => {
                      setUser({ ...user, mfaEnabled: false });
                    }}
                  />
                </Card>
              )}
              {!user.ssoLoginOnly && (
                <Card testId="danger-zone-section-card" className={styles.section}>
                  <DangerZoneSection singleOwnerOrganizations={warning.singleOwnerOrganizations} />
                </Card>
              )}
            </>
          )}
        </Workbench.Content>
      </Workbench>
    </>
  );
}

IndexPage.propTypes = {
  onReady: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired
};
