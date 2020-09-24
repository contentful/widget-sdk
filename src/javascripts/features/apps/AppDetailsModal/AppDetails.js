import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Subheading,
  TextLink,
  Paragraph,
  HelpText,
} from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink';
import MarkdownRenderer from 'app/common/MarkdownRenderer';
import { AppPropType, externalLinkProps } from './shared';
import { AppPermissionScreen } from './AppPermissionsScreen';
import { AppHeader } from './AppHeader';
import { getUsageExceededMessage } from '../isUsageExceeded';
import tokens from '@contentful/forma-36-tokens';
import cx from 'classnames';
import { css } from 'emotion';

const styles = {
  root: css({
    display: 'flex',
    overflow: 'hidden',
  }),
  mainColumn: css({
    flexGrow: 1,
  }),
  sidebarColumn: css({
    minWidth: '280px',
    width: '280px',
    paddingLeft: tokens.spacingL,
    marginLeft: tokens.spacingL,
    borderLeft: `1px solid ${tokens.colorElementMid}`,
  }),
  sidebarSpacing: css({
    marginBottom: tokens.spacingL,
  }),
  sidebarSpacingM: css({
    marginBottom: tokens.spacingM,
  }),
  sidebarSubheading: css({
    marginBottom: tokens.spacingXs,
  }),
  sidebarLink: css({
    marginBottom: tokens.spacingXs,
  }),
  iconSmall: css({
    width: '40px',
    height: '40px',
  }),
  modalPermissions: css({
    whiteSpace: 'pre-line',
  }),
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
    canManageApps,
    hasAdvancedAppsFeature,
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
              disabled={usageExceeded || !canManageApps}>
              {installed ? 'Configure' : 'Install'}
            </Button>
          )}
        </StateLink>
        {!installed && usageExceeded && canManageApps && (
          <>
            <div className={styles.sidebarSpacingM} />
            <HelpText>{getUsageExceededMessage(hasAdvancedAppsFeature)}</HelpText>
          </>
        )}
        {!canManageApps && (
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
            {app.links.map((link) => (
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
      aliasId: PropTypes.string,
    }),
  }),
  onClose: PropTypes.func.isRequired,
  showPermissions: PropTypes.bool,
  setShowPermissions: PropTypes.func,
  usageExceeded: PropTypes.bool,
  canManageApps: PropTypes.bool.isRequired,
  hasAdvancedAppsFeature: PropTypes.bool,
};
