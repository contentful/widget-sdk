import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card } from '@contentful/forma-36-react-components';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import useAsync from 'app/common/hooks/useAsync.es6';
import { fetchUserData } from './AccountRepository';
import AccountDetails from './AccountDetails';
import DangerZoneSection from './DangerZoneSection';

const styles = {
  section: css({
    maxWidth: '768px',
    margin: `${tokens.spacingL} auto`
  })
};

export default function Settings({ title, onReady }) {
  const { isLoading, error, data: userData } = useAsync(useCallback(fetchUserData));
  useEffect(
    isLoading => {
      if (!isLoading) {
        onReady();
      }
    },
    [isLoading, onReady]
  );

  if (isLoading || error) {
    // TODO handle error state separately
    return null;
  }

  const { userCancellationWarning: warning } = userData;

  return (
    <>
      <DocumentTitle title={title} />
      <Workbench>
        <Workbench.Header title={title} />
        <Workbench.Content type="default">
          <Card className={styles.section}>
            <AccountDetails userData={userData} />
          </Card>
          {!userData.ssoLoginOnly && (
            <Card className={styles.section}>
              <DangerZoneSection singleOwnerOrganizations={warning.singleOwnerOrganizations} />
            </Card>
          )}
        </Workbench.Content>
      </Workbench>
    </>
  );
}

Settings.propTypes = {
  onReady: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired
};
