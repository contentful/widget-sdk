import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Subheading,
  TextLink,
  Paragraph,
  HelpText,
  SkeletonBodyText,
  SkeletonContainer,
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
import { ActionPerformerName } from 'core/components/ActionPerformerName';
import moment from 'moment';

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
  modalPermissions: css({
    whiteSpace: 'pre-line',
  }),
  installation: {
    container: css({
      marginTop: tokens.spacingM,
    }),
    installerName: css({
      color: tokens.colorTextDark,
      fontSize: tokens.fontSizeM,
      fontWeight: tokens.fontWeightMedium,
    }),
    date: css({
      fontSize: tokens.fontSizeM,
      color: tokens.colorTextLightest,
    }),
  },
  author: {
    container: css({
      textDecoration: 'none !important',

      // <TabFocusTrap>
      '> *': {
        display: 'flex !important',
      },
    }),
    icon: css({
      width: '24px',
      height: '24px',
      marginRight: tokens.spacingXs,
    }),
    name: css({
      color: tokens.colorTextDark,
      fontWeight: tokens.fontWeightMedium,
    }),
  },
  support: {
    text: css({
      marginBottom: tokens.spacing2Xs,
    }),
  },
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

        {app.appInstallation && (
          <>
            <div className={styles.installation.container}>
              <div className={styles.installation.installerName}>
                <ActionPerformerName
                  link={app.appInstallation.sys.createdBy}
                  formatName={(name) => `Installed by ${name}`}
                  loadingComponent={
                    <SkeletonContainer svgHeight={21}>
                      <SkeletonBodyText lineHeight={21} numberOfLines={1} />
                    </SkeletonContainer>
                  }
                />
              </div>
            </div>
            <span className={styles.installation.date}>
              {moment(app.appInstallation.createdAt).format('DD MMM YYYY')}
            </span>
          </>
        )}

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

        <Subheading element="h3" className={styles.sidebarSubheading}>
          Developer
        </Subheading>
        <TextLink href={app.author.url} {...externalLinkProps} className={styles.author.container}>
          <img src={app.author.icon} className={styles.author.icon} />
          <div className={styles.author.name}>{app.author.name}</div>
        </TextLink>
        <div className={styles.sidebarSpacing} />

        {app.links.length > 0 && (
          <>
            <Subheading element="h3" className={styles.sidebarSubheading}>
              Links
            </Subheading>
            {app.links.map((link) => (
              <div key={link.url} className={styles.sidebarLink}>
                <TextLink
                  href={`${link.url}`}
                  {...externalLinkProps}
                  icon="ExternalLink"
                  aria-label={link.title}>
                  {link.shortTitle || link.title}
                </TextLink>
              </div>
            ))}
            <div className={styles.sidebarSpacing} />
          </>
        )}

        <Subheading element="h3" className={styles.sidebarSubheading}>
          Support
        </Subheading>
        <div>
          {app.supportUrl ? (
            <>
              <Paragraph className={styles.support.text}>
                {app.author.name} supports this app.
              </Paragraph>
              <TextLink href={app.supportUrl} icon="ChatBubble" {...externalLinkProps}>
                Get support
              </TextLink>
            </>
          ) : (
            <>
              <Paragraph className={styles.support.text}>
                This app is not officially supported.
              </Paragraph>
              <TextLink href="https://www.contentful.com/slack" {...externalLinkProps}>
                Ask a question in our Slack community
              </TextLink>
            </>
          )}
        </div>

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
