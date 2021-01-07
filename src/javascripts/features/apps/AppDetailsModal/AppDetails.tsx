import React from 'react';
import {
  Button,
  HelpText,
  Paragraph,
  SkeletonBodyText,
  SkeletonContainer,
  Subheading,
  TextLink,
} from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink';
import MarkdownRenderer from 'app/common/MarkdownRenderer';
import { externalLinkProps, SpaceInformation } from './shared';
import { AppPermissionScreen } from './AppPermissionsScreen';
import { AppHeader } from './AppHeader';
import tokens from '@contentful/forma-36-tokens';
import cx from 'classnames';
import { css } from 'emotion';
import { ActionPerformerName } from 'core/components/ActionPerformerName';
import moment from 'moment';
import { getUsageExceededMessage, hasConfigLocation } from '../utils';
import { MarketplaceApp } from 'features/apps-core';
import { AppManager } from '../AppOperations';

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

interface AppDetailsProps {
  app: MarketplaceApp;
  appManager: AppManager;
  spaceInformation: SpaceInformation;
  onClose: Function;
  canManageApps: boolean;
  showPermissions?: boolean;
  setShowPermissions?: Function;
  usageExceeded?: boolean;
  hasAdvancedAppsFeature?: boolean;
  isContentfulApp?: boolean;
}

export function AppDetails(props: AppDetailsProps) {
  const {
    app,
    appManager,
    onClose,
    showPermissions,
    spaceInformation,
    usageExceeded,
    canManageApps,
    hasAdvancedAppsFeature,
    setShowPermissions = () => null,
  } = props;

  const installed = !!app.appInstallation;
  const hasConfig = hasConfigLocation(app.appDefinition);

  const determineOnClick = (onClick) =>
    installed
      ? () => {
          onClose();
          if (installed && !hasConfig) {
            appManager.showUninstall(app);
          } else {
            onClick();
          }
        }
      : () => setShowPermissions(true);

  if (showPermissions) {
    return (
      <StateLink path="^.detail" params={{ appId: app.id, acceptedPermissions: true }}>
        {({ onClick }) => (
          <AppPermissionScreen
            app={app}
            spaceInformation={spaceInformation}
            onInstall={async (...args) => {
              if (!hasConfig) {
                await appManager.installApp(app, hasAdvancedAppsFeature);
              } else {
                onClick(...args);
              }
            }}
            onCancel={() => {
              app.isPrivateApp ? onClose() : setShowPermissions(false);
            }}
            onClose={onClose}
          />
        )}
      </StateLink>
    );
  }

  const installCTA = 'Install';
  const configCTA = hasConfig ? 'Configure' : 'Remove';

  return (
    <div className={cx(styles.root)}>
      <div className={styles.mainColumn}>
        <AppHeader app={app} />
        {app.description && <MarkdownRenderer source={app.description} />}
      </div>
      <div className={styles.sidebarColumn}>
        <StateLink path="^.detail" params={{ appId: app.id }}>
          {({ onClick }) => (
            <Button
              onClick={determineOnClick(onClick)}
              isFullWidth
              buttonType="primary"
              disabled={usageExceeded || !canManageApps}>
              {installed ? configCTA : installCTA}
            </Button>
          )}
        </StateLink>

        {app.appInstallation && (
          <>
            <div className={styles.installation.container}>
              <div className={styles.installation.installerName}>
                {/** @ts-ignore ActionPerformerName is not TS yet and props are infered wrong */}
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
              {moment(app.appInstallation.sys.createdAt).format('DD MMM YYYY')}
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
        {app.author && (
          <TextLink
            href={app.author.url}
            {...externalLinkProps}
            className={styles.author.container}>
            <img src={app.author.icon} className={styles.author.icon} />
            <div className={styles.author.name}>{app.author.name}</div>
          </TextLink>
        )}
        <div className={styles.sidebarSpacing} />

        {app.links && app.links.length > 0 && (
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
          {app.supportUrl && app.author ? (
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

        {app.categories && app.categories.length > 0 && (
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
