import React, { useState, useCallback } from 'react';
import { Card, Workbench } from '@contentful/forma-36-react-components';
import DocumentTitle from 'components/shared/DocumentTitle';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { useAsync } from 'core/hooks';

import { fetchUserData } from './AccountRepository';
import AccountDetails from './AccountDetails';
import DangerZoneSection from './DangerZoneSection';
import SecuritySection from './SecuritySection';
import ManageCookieConsentSection from './ManageCookieConsentSection';

import ErrorState from 'app/common/ErrorState';
import LoadingState from 'app/common/LoadingState';
import { getOrganizations } from 'services/TokenStore';
import { OrgMembershipsSection } from './OrgMembershipsSection';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';

const styles = {
  content: css({
    height: '100%',
    '> div': {
      height: '100%',
    },
  }),
  section: css({
    maxWidth: '768px',
    margin: `${tokens.spacingL} auto`,
    padding: tokens.spacingXl,
  }),
};

export default function IndexPage() {
  const [user, setUser] = useState({});
  const [hasOrgMemberships, setHasOrgMemberships] = useState(false);

  const { isLoading, error } = useAsync(
    useCallback(async () => {
      const user = await fetchUserData();
      const orgs = await getOrganizations();
      // We fetch the user here and set it above so that children
      // components can update the user without needing to fetch
      setUser(user);
      setHasOrgMemberships(orgs.length > 0);
    }, [])
  );

  const { userCancellationWarning: warning } = user;

  return (
    <>
      <DocumentTitle title="User profile" />
      <Workbench>
        <Workbench.Header
          title="User profile"
          icon={<ProductIcon icon="UserProfile" size="large" />}
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
              {!user.ssoLoginOnly && (
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
              <Card testId="privacy-section-card" className={styles.section}>
                <ManageCookieConsentSection />
              </Card>
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
