import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '@contentful/forma-36-react-components';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import AccountDetails from './Account.es6';
// import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

const styles = {
  userSettingsSection: css({
    maxWidth: '768px',
    margin: 'auto'
  })
};

export default function Settings({ title, onReady }) {
  React.useEffect(onReady, []);

  return (
    <>
      <DocumentTitle title={title} />
      <Workbench>
        <Workbench.Header title={title} />
        <Workbench.Content type="default">
          <Card className={styles.userSettingsSection}>
            <AccountDetails />
          </Card>
        </Workbench.Content>
      </Workbench>
    </>
  );
}

Settings.propTypes = {
  onReady: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired
};
