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
  Heading,
  HelpText
} from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink';
import AppPermissions from './AppPermissions';
import * as AppLifecycleTracking from './AppLifecycleTracking';
import MarkdownRenderer from 'app/common/MarkdownRenderer';
import { USAGE_EXCEEDED_MESSAGE } from './isUsageExceeded';

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
  sidebarSpacingM: css({
    marginBottom: tokens.spacingM
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
  })
};

const AppPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  appInstallation: PropTypes.object,
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
          {app.title}
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

function AppPermissionScreen({ app, onInstall, onCancel, onClose, spaceInformation }) {
  useEffect(() => {
    AppLifecycleTracking.permissionsOpened(app.id);
  }, [app.id]);

  const onAuthorize = () => {
    AppLifecycleTracking.permissionsAccepted(app.id);
    onClose(true);
    onInstall();
  };

  const onCancelTracked = () => {
    AppLifecycleTracking.permissionsDismissed(app.id);
    onCancel();
  };

  return (
    <div className={styles.permissions}>
      <AppPermissions
        onAuthorize={onAuthorize}
        onCancel={() => onCancelTracked()}
        icon={app.icon}
        title={app.title}
        space={spaceInformation.spaceName}
        envMeta={spaceInformation.envMeta}
        legal={app.legal}
      />
    </div>
  );
}

AppPermissionScreen.propTypes = {
  app: AppPropType.isRequired,
  onInstall: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  spaceInformation: PropTypes.shape({
    spaceId: PropTypes.string.isRequired,
    spaceName: PropTypes.string.isRequired,
    envMeta: PropTypes.shape({
      environmentId: PropTypes.string.isRequired,
      isMasterEnvironment: PropTypes.bool.isRequired,
      aliasId: PropTypes.string
    })
  })
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
  const {
    app,
    onClose,
    showPermissions,
    setShowPermissions,
    spaceInformation,
    usageExceeded,
    userCanEditApps
  } = props;

  if (showPermissions) {
    return (
      <StateLink path="^.detail" params={{ appId: app.id, acceptedPermissions: true }}>
        {({ onClick }) => (
          <AppPermissionScreen
            app={app}
            spaceInformation={spaceInformation}
            onInstall={onClick}
            onCancel={() => setShowPermissions(false)}
            onClose={onClose}
          />
        )}
      </StateLink>
    );
  }

  const installed = !!app.appInstallation;

  return (
    <div className={cx(styles.root)}>
      <div className={styles.mainColumn}>
        <AppHeader app={app} showPermissions={showPermissions} />
        <MarkdownRenderer source={app.description} />
      </div>
      <div className={styles.sidebarColumn}>
        <StateLink path="^.detail" params={{ appId: app.id }}>
          {({ onClick }) => (
            <Button
              onClick={determineOnClick(installed, onClick, onClose, setShowPermissions)}
              isFullWidth
              buttonType="primary"
              disabled={usageExceeded || !userCanEditApps}>
              {installed ? 'Configure' : 'Install'}
            </Button>
          )}
        </StateLink>
        {!installed && usageExceeded && userCanEditApps && (
          <>
            <div className={styles.sidebarSpacingM} />
            <HelpText>{USAGE_EXCEEDED_MESSAGE}</HelpText>
          </>
        )}
        {!userCanEditApps && (
          <>
            <div className={styles.sidebarSpacingM} />
            <HelpText>
              You don&rsquo;t have permission to manage apps. Ask your admin for help.
            </HelpText>
          </>
        )}
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
  spaceInformation: PropTypes.shape({
    spaceId: PropTypes.string.isRequired,
    spaceName: PropTypes.string.isRequired,
    envMeta: PropTypes.shape({
      environmentId: PropTypes.string.isRequired,
      isMasterEnvironment: PropTypes.bool.isRequired,
      aliasId: PropTypes.string
    })
  }),
  onClose: PropTypes.func.isRequired,
  showPermissions: PropTypes.bool,
  setShowPermissions: PropTypes.func,
  usageExceeded: PropTypes.bool,
  userCanEditApps: PropTypes.bool.isRequired
};

export default function AppDetailsModal(props) {
  const [showPermissions, setShowPermissions] = useState(null);
  const modalTitle = showPermissions ? `Install ${props.app.title}` : 'App details';
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
        spaceInformation={props.spaceInformation}
        onClose={props.onClose}
        showPermissions={showPermissions}
        setShowPermissions={setShowPermissions}
        usageExceeded={props.usageExceeded}
        userCanEditApps={props.userCanEditApps}
      />
    </Modal>
  );
}

AppDetailsModal.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  app: AppPropType.isRequired,
  spaceInformation: PropTypes.shape({
    spaceId: PropTypes.string.isRequired,
    spaceName: PropTypes.string.isRequired,
    envName: PropTypes.string.isRequired,
    envIsMaster: PropTypes.bool.isRequired
  }),
  usageExceeded: PropTypes.bool,
  userCanEditApps: PropTypes.bool.isRequired
};
