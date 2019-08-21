import React from 'react';
import tokens from '@contentful/forma-36-tokens';
import {
  Card,
  Heading,
  Subheading,
  Paragraph,
  Icon,
  Button
} from '@contentful/forma-36-react-components';
import cx from 'classnames';
import { css } from 'emotion';
import PropTypes from 'prop-types';
import AppIcon from '../apps/_common/AppIcon.es6';

const styles = {
  card: css({
    padding: tokens.spacingL,
    border: 'none',
    boxShadow: 'none',
    maxWidth: '500px'
  }),
  subheading: css({
    marginBottom: tokens.spacingS
  }),
  heading: css({
    textAlign: 'center',
    marginBottom: tokens.spacingS
  }),
  sectionSplitter: css({
    marginTop: tokens.spacingXl
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
  centered: css({
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    textAlign: 'center'
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
  const { appName, permissions, centered, icon } = props;

  return (
    <div className={cx({ [styles.centered]: centered })}>
      <Card className={styles.card}>
        <Heading element="h1" className={styles.heading}>
          Install {appName}
        </Heading>

        <div className={styles.logos}>
          <AppIcon appId="contentful" className={styles.appIcon} />
          <Icon icon="ChevronLeft" color="muted" className={styles.arrowIcon} />
          <Icon icon="ChevronRight" color="muted" className={styles.arrowIcon} />
          <img src={icon} className={styles.icon} />
        </div>
        <Subheading element="h3" className={styles.subheading}>
          Permissions
        </Subheading>
        <Paragraph>
          This app acts on the behalf of the user and inherits the same permissions as the user
          using it.
        </Paragraph>
        {permissions.length > 0 && (
          <>
            <div className={styles.sectionSplitter} />
            <Subheading element="h3" className={styles.subheading}>
              {appName} app will:
            </Subheading>
            <Paragraph className={styles.permissions}>{permissions}</Paragraph>
          </>
        )}
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
  appId: PropTypes.string.isRequired,
  appName: PropTypes.string.isRequired,
  permissions: PropTypes.string,
  centered: PropTypes.bool,
  icon: PropTypes.string.isRequired
};
