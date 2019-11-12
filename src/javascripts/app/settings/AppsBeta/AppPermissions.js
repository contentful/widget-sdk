import React from 'react';
import tokens from '@contentful/forma-36-tokens';
import { Card, Heading, Icon, Button } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import PropTypes from 'prop-types';
import AppIcon from '../apps/_common/AppIcon';
import AppMarkdown from './AppMarkdown';

const styles = {
  container: css({
    maxWidth: '500px',
    margin: '0 auto'
  }),
  heading: css({
    textAlign: 'center',
    marginBottom: tokens.spacingS
  }),
  actions: css({
    marginTop: tokens.spacingL,
    textAlign: 'center',
    button: {
      marginLeft: tokens.spacingL
    }
  }),
  logos: css({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL
  }),
  appIcon: css({
    marginLeft: tokens.spacingXs,
    marginRight: tokens.spacingXs
  }),
  arrowIcon: css({
    width: tokens.spacingXl,
    height: tokens.spacingXl
  }),
  permissions: css({
    whiteSpace: 'pre-line'
  }),
  icon: css({
    width: '40px',
    height: '40px'
  })
};

export default function AppPermissions(props) {
  const { appName, permissions, icon } = props;

  return (
    <div className={styles.container}>
      <Card padding="large">
        <Heading element="h1" className={styles.heading}>
          Install {appName}
        </Heading>

        <div className={styles.logos}>
          <AppIcon appId="contentful" className={styles.appIcon} />
          <Icon icon="ChevronLeft" color="muted" className={styles.arrowIcon} />
          <Icon icon="ChevronRight" color="muted" className={styles.arrowIcon} />
          <img src={icon} className={styles.icon} />
        </div>

        <AppMarkdown source={permissions} />
      </Card>
      <div className={styles.actions}>
        <Button
          onClick={() => {
            props.onCancel();
          }}
          buttonType="muted">
          Cancel
        </Button>
        <Button
          buttonType="primary"
          onClick={() => {
            props.onAuthorize();
          }}>
          Authorize access
        </Button>
      </div>
    </div>
  );
}

AppPermissions.defaultProps = {
  permissions: '',
  centered: false
};

AppPermissions.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onAuthorize: PropTypes.func.isRequired,
  appName: PropTypes.string.isRequired,
  permissions: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired
};
