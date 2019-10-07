import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card } from '@contentful/forma-36-react-components';
import Workbench from 'app/common/Workbench.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import useAsync from 'app/common/hooks/useAsync.es6';
import { fetchUserData } from './AccountRepository';
import AccountDetails from './AccountDetails';
import DangerZoneSection from './DangerZoneSection';

import ErrorState from 'app/common/ErrorState';
import LoadingState from 'app/common/LoadingState';

const styles = {
  content: css({
    height: '100%'
  }),
  section: css({
    maxWidth: '768px',
    margin: `${tokens.spacingL} auto`
  })
};

export default function IndexPage({ title, onReady }) {
  const { isLoading, error, data: userData = {} } = useAsync(useCallback(fetchUserData));
  useEffect(onReady, [onReady]);

  const { userCancellationWarning: warning } = userData;

  return (
    <>
      <DocumentTitle title={title} />
      <Workbench>
        <Workbench.Header>
          <Workbench.Title>{title}</Workbench.Title>
        </Workbench.Header>
        <Workbench.Content className={styles.content}>
          {isLoading && <LoadingState loadingText="Loading your account…" />}
          {!isLoading && error && <ErrorState />}
          {!isLoading && !error && (
            <>
              <Card className={styles.section}>
                <AccountDetails userData={userData} />
              </Card>
              {!userData.ssoLoginOnly && (
                <Card className={styles.section}>
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
