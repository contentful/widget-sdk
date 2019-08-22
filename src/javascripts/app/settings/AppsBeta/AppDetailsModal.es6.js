import React, { useState } from 'react';
import tokens from '@contentful/forma-36-tokens';
import cx from 'classnames';
import { css, keyframes } from 'emotion';
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

const sessionStorage = ClientStorage('session');
sessionStorage.set('appPermissions', JSON.stringify({}));

const fadeIn = keyframes({
  from: {
    transform: 'scale(0.92)',
    opacity: '0'
  },
  to: {
    transform: 'scale(1)',
    opacity: '1'
  }
});

const styles = {
  root: css({
    display: 'flex',
    overflow: 'hidden'
  }),
  fade: css({
    animation: `${fadeIn} 0.4s cubic-bezier(0.680, -0.550, 0.265, 1.550)`
  }),
  mainColumn: css({
    flexGrow: 1
  }),
  description: css({
    whiteSpace: 'pre-line'
  }),
  sidebarColumn: css({
    minWidth: '280px',
    width: '280px',
    minHeight: '700px',
    paddingLeft: tokens.spacingL,
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
    justifyContent: 'center',
    minHeight: '700px',
    animation: `${fadeIn} 0.4s cubic-bezier(0.680, -0.550, 0.265, 1.550)`
  }),
  modalPermissions: css({
    whiteSpace: 'pre-line'
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
  categories: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired
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
  const onAuthorize = () => {
    saveAcceptAuthorize(app.appId);
    onClose(true);
    onInstall();
  };

  return (
    <div className={styles.permissions}>
      <AppPermissions
        onAuthorize={onAuthorize}
        onCancel={() => onCancel()}
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
  const { app, onClose } = props;
  const [showPermissions, setShowPermissions] = useState(null);

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
    <div className={cx(styles.root, { [styles.fade]: showPermissions === false })}>
      <div className={styles.mainColumn}>
        <AppHeader app={app} showPermissions={showPermissions} />
        <div className={styles.description}>{app.description}</div>
      </div>
      <div className={styles.sidebarColumn}>
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
        <div className={styles.sidebarSpacing} />
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
  onClose: PropTypes.func.isRequired
};

export default function AppDetailsModal(props) {
  return (
    <Modal
      allowHeightOverflow
      size="1000px"
      title="App details"
      isShown={props.isShown}
      onClose={props.onClose}>
      <AppDetails app={props.app} onClose={props.onClose} />
    </Modal>
  );
}

AppDetailsModal.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  app: AppPropType.isRequired
};
