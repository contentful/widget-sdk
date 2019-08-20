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
import AppIcon from '../apps/_common/AppIcon.es6';
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
  permissions: css({
    display: 'flex',
    justifyContent: 'center',
    minHeight: '700px',
    animation: `${fadeIn} 0.4s cubic-bezier(0.680, -0.550, 0.265, 1.550)`
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
    image: PropTypes.node.isRequired
  }).isRequired,
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
      <AppIcon appId={app.appId} size="large" className={css({ marginRight: tokens.spacingM })} />
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
        appId={app.appId}
        appName={app.appName}
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
        <div dangerouslySetInnerHTML={{ __html: app.description }} />
      </div>
      <div className={styles.sidebarColumn}>
        <Button
          onClick={() => setShowPermissions(true)}
          disabled={app.installed}
          isFullWidth
          buttonType="primary">
          {app.installed ? 'Installed' : 'Install'}
        </Button>
        <div className={styles.sidebarSpacing} />
        {app.links.length > 0 && (
          <>
            <Subheading element="h3" className={styles.sidebarSubheading}>
              Links
            </Subheading>
            {app.links.map((link, index) => (
              <div key={link.url} className={styles.sidebarLink}>
                <TextLink href={`${link.url}-${index}`} {...externalLinkProps}>
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
        <a href={app.author.url} {...externalLinkProps}>
          {app.author.image}
        </a>
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

        <Subheading element="h3" className={styles.sidebarSubheading}>
          Permissions
        </Subheading>
        <Paragraph>
          This app will have full permissions. It will be able to access all data from the selected
          space and environment.
        </Paragraph>
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
