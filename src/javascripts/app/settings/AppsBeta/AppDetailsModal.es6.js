import React, { useState, useEffect } from 'react';
import tokens from '@contentful/forma-36-tokens';
import cx from 'classnames';
import { css } from 'emotion';
import PropTypes from 'prop-types';
import {
  Modal,
  Button,
  Subheading,
  TextLink,
  Paragraph,
  Heading
} from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink.es6';
import AppPermissions from './AppPermissions.es6';
import ClientStorage from 'TheStore/ClientStorage.es6';
import { websiteUrl } from 'Config.es6';
import * as AppLifecycleTracking from './AppLifecycleTracking.es6';
import AppMarkdown from './AppMarkdown.es6';

const sessionStorage = ClientStorage('session');
sessionStorage.set('appPermissions', JSON.stringify({}));

const styles = {
  root: css({
    display: 'flex',
    overflow: 'hidden'
  }),
  mainColumn: css({
    flexGrow: 1
  }),
  sidebarColumn: css({
    minWidth: '280px',
    width: '280px',
    paddingLeft: tokens.spacingL,
    marginLeft: tokens.spacingL,
    borderLeft: `1px solid ${tokens.colorElementMid}`
  }),
  sidebarSpacing: css({
    marginBottom: tokens.spacingL
  }),
  sidebarSubheading: css({
    marginBottom: tokens.spacingXs
  }),
  sidebarLink: css({
    marginBottom: tokens.spacingXs
  }),
  icon: css({
    width: '60px',
    height: '60px',
    marginRight: tokens.spacingM
  }),
  iconSmall: css({
    width: '40px',
    height: '40px'
  }),
  permissions: css({
    display: 'flex',
    justifyContent: 'center'
  }),
  modalPermissions: css({
    whiteSpace: 'pre-line'
  }),
  contactUs: css({
    textDecoration: 'none'
  })
};

const AppPropType = PropTypes.shape({
  appId: PropTypes.string.isRequired,
  links: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired
    }).isRequired
  ).isRequired,
  author: PropTypes.shape({
    name: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired
  }).isRequired,
  icon: PropTypes.string.isRequired,
  categories: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  enabled: PropTypes.bool.isRequired
});

const externalLinkProps = {
  target: '_blank',
  rel: 'noopener noreferrer'
};

function AppHeader(props) {
  const { app } = props;
  return (
    <div className={css({ display: 'flex', marginBottom: tokens.spacingL })}>
      <img src={app.icon} className={styles.icon} />
      <div>
        <Heading
          element="h1"
          className={css({
            lineHeight: tokens.lineHeightCondensed,
            fontSize: tokens.fontSize2Xl,
            fontWeight: tokens.fontWeightMedium
          })}>
          {app.appName}
        </Heading>
        <div>
          App • Developed by{' '}
          <TextLink href={app.author.url} {...externalLinkProps}>
            {app.author.name}
          </TextLink>
        </div>
      </div>
    </div>
  );
}

AppHeader.propTypes = {
  app: AppPropType.isRequired
};

function saveAcceptAuthorize(appId) {
  try {
    const perms = JSON.parse(sessionStorage.get('appPermissions')) || {};
    perms[appId] = true;
    sessionStorage.set('appPermissions', JSON.stringify(perms));
  } catch (e) {
    sessionStorage.set('appPermissions', JSON.stringify({ [appId]: true }));
  }
}

function AppPermissionScreen({ app, onInstall, onCancel, onClose }) {
  useEffect(() => {
    AppLifecycleTracking.permissionsOpened(app.appId);
  }, [app.appId]);

  const onAuthorize = () => {
    AppLifecycleTracking.permissionsAccepted(app.appId);
    saveAcceptAuthorize(app.appId);
    onClose(true);
    onInstall();
  };

  const onCancelTracked = () => {
    AppLifecycleTracking.permissionsDismissed(app.appId);
    onCancel();
  };

  return (
    <div className={styles.permissions}>
      <AppPermissions
        onAuthorize={onAuthorize}
        onCancel={() => onCancelTracked()}
        icon={app.icon}
        appName={app.appName}
        permissions={app.permissions}
      />
    </div>
  );
}

AppPermissionScreen.propTypes = {
  app: AppPropType.isRequired,
  onInstall: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

function determineOnClick(installed = false, onClick, onClose, setShowPermissions) {
  return installed
    ? () => {
        onClose();
        onClick();
      }
    : () => setShowPermissions(true);
}

export function AppDetails(props) {
  const { app, onClose, showPermissions, setShowPermissions } = props;

  if (showPermissions) {
    return (
      <StateLink to="^.detail" params={{ appId: app.appId }}>
        {({ onClick }) => (
          <AppPermissionScreen
            app={app}
            onInstall={onClick}
            onCancel={() => setShowPermissions(false)}
            onClose={onClose}
          />
        )}
      </StateLink>
    );
  }

  return (
    <div className={cx(styles.root)}>
      <div className={styles.mainColumn}>
        <AppHeader app={app} showPermissions={showPermissions} />
        <AppMarkdown source={app.description} />
      </div>
      <div className={styles.sidebarColumn}>
        {app.enabled || app.installed ? (
          <StateLink to="^.detail" params={{ appId: app.appId }}>
            {({ onClick }) => (
              <Button
                onClick={determineOnClick(app.installed, onClick, onClose, setShowPermissions)}
                isFullWidth
                buttonType="primary">
                {app.installed ? 'Configure' : 'Install'}
              </Button>
            )}
          </StateLink>
        ) : (
          <Button isFullWidth href={websiteUrl('/contact/sales/')} buttonType="primary">
            Contact us
          </Button>
        )}
        <div className={styles.sidebarSpacing} />
        {!app.enabled && !app.installed && (
          <>
            <Paragraph>This app is available to customers on a committed, annual plan.</Paragraph>
            <Paragraph
              className={css({
                marginTop: tokens.spacingM
              })}>
              If you&rsquo;re interested in learning more about our expanded, enterprise-grade
              platform, contact your account manager.
            </Paragraph>
            <div className={styles.sidebarSpacing} />
          </>
        )}
        {app.links.length > 0 && (
          <>
            <Subheading element="h3" className={styles.sidebarSubheading}>
              Links
            </Subheading>
            {app.links.map(link => (
              <div key={link.url} className={styles.sidebarLink}>
                <TextLink href={`${link.url}`} {...externalLinkProps}>
                  {link.title}
                </TextLink>
              </div>
            ))}
            <div className={styles.sidebarSpacing} />
          </>
        )}
        <Subheading element="h3" className={styles.sidebarSubheading}>
          Author
        </Subheading>
        <TextLink href={app.author.url} {...externalLinkProps}>
          <img src={app.author.icon} className={styles.iconSmall} />
        </TextLink>
        <div className={styles.sidebarSpacing} />

        {app.categories.length > 0 && (
          <>
            <Subheading element="h3" className={styles.sidebarSubheading}>
              Categories
            </Subheading>
            <Paragraph>{app.categories.join(', ')}</Paragraph>
            <div className={styles.sidebarSpacing} />
          </>
        )}
      </div>
    </div>
  );
}

AppDetails.propTypes = {
  app: AppPropType.isRequired,
  onClose: PropTypes.func.isRequired,
  showPermissions: PropTypes.bool,
  setShowPermissions: PropTypes.func
};

export default function AppDetailsModal(props) {
  const [showPermissions, setShowPermissions] = useState(null);
  const modalTitle = showPermissions ? 'Authorize' : 'App details';
  const modalSize = showPermissions ? null : '1000px';
  return (
    <Modal
      allowHeightOverflow
      position="top"
      topOffset={20}
      size={modalSize}
      title={modalTitle}
      isShown={props.isShown}
      onAfterOpen={() => setShowPermissions(false)}
      onClose={props.onClose}>
      <AppDetails
        app={props.app}
        onClose={props.onClose}
        showPermissions={showPermissions}
        setShowPermissions={setShowPermissions}
      />
    </Modal>
  );
}

AppDetailsModal.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  app: AppPropType.isRequired
};
