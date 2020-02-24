import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, Workbench } from '@contentful/forma-36-react-components';
import DocumentTitle from 'components/shared/DocumentTitle';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import useAsync from 'app/common/hooks/useAsync';
import { getVariation } from 'LaunchDarkly';
import { TWO_FA as TWO_FA_FLAG } from 'featureFlags';

import { fetchUserData } from './AccountRepository';
import AccountDetails from './AccountDetails';
import DangerZoneSection from './DangerZoneSection';
import SecuritySection from './SecuritySection';

import ErrorState from 'app/common/ErrorState';
import LoadingState from 'app/common/LoadingState';
import { getOrganizations } from 'services/TokenStore';
import { OrgMembershipsSection } from './OrgMembershipsSection';
import IconPoc from 'ui/Components/IconPoc';

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
  const [hasOrgMemberships, setHasOrgMemberships] = useState(false);
  const [mfaEnabled, setMFAEnabled] = useState(false);

  const { isLoading, error } = useAsync(
    useCallback(async () => {
      const [user, variation] = await Promise.all([fetchUserData(), getVariation(TWO_FA_FLAG)]);
      const orgs = await getOrganizations();
      // We fetch the user here and set it above so that children
      // components can update the user without needing to fetch
      setUser(user);
      setMFAEnabled(variation);
      setHasOrgMemberships(orgs.length > 0);
    }, [])
  );
  useEffect(onReady, [onReady]);

  const { userCancellationWarning: warning } = user;

  return (
    <>
      <DocumentTitle title={title} />
      <Workbench>
        <Workbench.Header
          title={title}
          icon={<IconPoc name="user-profile" size="large" color="green" />}
        />
        <Workbench.Content className={styles.content}>
          {isLoading && <LoadingState loadingText="Loading your account…" />}
          {!isLoading && error && <ErrorState />}
          {!isLoading && !error && (
            <>
              <Card testId="account-details-section-card" className={styles.section}>
                <AccountDetails user={user} onChangePassword={setUser} onEdit={setUser} />
              </Card>
              {!hasOrgMemberships && (
                <Card testId="org-memberships-section-card" className={styles.section}>
                  <OrgMembershipsSection />
                </Card>
              )}
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
