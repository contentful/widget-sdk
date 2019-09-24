import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card } from '@contentful/forma-36-react-components';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import AccountDetails from './Account.es6';
import DeleteUser from './DeleteUser.es6';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { fetchUserData } from './AccountService.es6';
import useAsync from 'app/common/hooks/useAsync.es6';

const styles = {
  userSettingsSection: css({
    maxWidth: '768px',
    margin: `${tokens.spacingL} auto`
  })
};

export default function Settings({ title, onReady }) {
  useEffect(onReady, []);

  const { isLoading, data: user } = useAsync(useCallback(fetchUserData));

  if (isLoading) {
    return null;
  }

  const { userCancellationWarning: warning } = user;

  return (
    <>
      <DocumentTitle title={title} />
      <Workbench>
        <Workbench.Header title={title} />
        <Workbench.Content type="default">
          <Card className={styles.userSettingsSection}>
            <AccountDetails data={user} />
          </Card>
          {!user.ssoLoginOnly && (
            <Card className={styles.userSettingsSection}>
              <DeleteUser singleOwnerOrganizations={warning.singleOwnerOrganizations} />
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
