import React, { useState, useCallback } from 'react';
import { css } from 'emotion';
import { Workbench, Grid } from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';

import ErrorState from 'app/common/ErrorState';
import { fetchUserData } from 'app/UserProfile/Settings/AccountRepository';
import { useAsync } from 'core/hooks';
import DocumentTitle from 'components/shared/DocumentTitle';
import { LoadingEmptyState } from 'features/loading-state';
import { getOrganizations } from 'services/TokenStore';

import { AccountDetails } from './AccountDetails';
import { OrgMembershipsSection } from './OrgMembershipsSection';
import { SecuritySection } from './SecuritySection';
import { ManageCookieConsentSection } from './ManageCookieConsentSection';
import { DangerZoneSection } from './DangerZoneSection';

import type { UserData } from '../types';

export function UserProfilePage() {
  const [user, setUser] = useState<UserData>();
  const [hasOrgMemberships, setHasOrgMemberships] = useState(false);

  const { isLoading, error } = useAsync(
    useCallback(async () => {
      const user = (await fetchUserData()) as UserData;
      const orgs = await getOrganizations();
      // We fetch the user here and set it above so that children
      // components can update the user without needing to fetch
      setUser(user);
      setHasOrgMemberships(orgs.length > 0);
    }, [])
  );

  return (
    <>
      <DocumentTitle title="User profile" />
      <Workbench>
        <Workbench.Header
          title="User profile"
          icon={<ProductIcon icon="UserProfile" size="large" />}
        />
        <Workbench.Content>
          {isLoading && <LoadingEmptyState testId="cf-ui-loading-state" />}
          {!isLoading && error && <ErrorState />}
          {!isLoading && !error && user && (
            <Grid
              className={css({ maxWidth: '768px', margin: '0 auto' })}
              columns={1}
              columnGap="spacingM"
              rowGap="spacingM">
              <AccountDetails user={user} onChangePassword={setUser} onEdit={setUser} />

              {!hasOrgMemberships && <OrgMembershipsSection />}

              {!user.ssoLoginOnly && (
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
              )}

              <ManageCookieConsentSection />

              {!user.ssoLoginOnly && (
                <DangerZoneSection
                  singleOwnerOrganizations={user.userCancellationWarning.singleOwnerOrganizations}
                />
              )}
            </Grid>
          )}
        </Workbench.Content>
      </Workbench>
    </>
  );
}
