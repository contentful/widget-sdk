import {
  Button,
  HelpText,
  Paragraph,
  SkeletonBodyText,
  SkeletonContainer,
  Subheading,
  TextLink,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import MarkdownRenderer from 'app/common/MarkdownRenderer';
import cx from 'classnames';
import { ActionPerformerName } from 'core/components/ActionPerformerName';
import { css } from 'emotion';
import { MarketplaceApp } from 'features/apps-core';
import moment from 'moment';
import React from 'react';
import { AppManager } from '../AppOperations';
import { getContentfulAppUrl, getUsageExceededMessage, hasConfigLocation } from '../utils';
import { AppHeader } from './AppHeader';
import { AppPermissionScreen } from './AppPermissionsScreen';
import { externalLinkProps, SpaceInformation } from './shared';
import { useRouteNavigate } from 'core/react-routing';

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
  onClose: () => Promise<void> | void;
  canManageApps: boolean;
  showPermissions?: boolean;
  setShowPermissions?: (show: boolean) => void;
  usageExceeded?: boolean;
  hasAdvancedAppsFeature?: boolean;
  isContentfulApp?: boolean;
}

export function AppDetails(props: AppDetailsProps) {
  const routeNavigate = useRouteNavigate();
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

  const isInstalled = app.appInstallation;
  const hasConfig = hasConfigLocation(app.appDefinition);

  if (showPermissions) {
    return (
      <AppPermissionScreen
        app={app}
        spaceInformation={spaceInformation}
        onInstall={async () => {
          if (!hasConfig) {
            await appManager.installApp(app, hasAdvancedAppsFeature);
            await onClose();
          } else {
            routeNavigate({
              path: 'apps.app-configuration',
              appId: app.id,
              navigationState: {
                acceptedPermissions: true,
              },
            });
          }
        }}
        onCancel={() => {
          app.isPrivateApp ? onClose() : setShowPermissions(false);
        }}
      />
    );
  }

  return (
    <div className={cx(styles.root)}>
      <div className={styles.mainColumn}>
        <AppHeader app={app} />
        {app.description && <MarkdownRenderer source={app.description} />}
      </div>
      <div className={styles.sidebarColumn}>
        <CTA
          app={app}
          appManager={appManager}
          spaceInformation={spaceInformation}
          setShowPermissions={setShowPermissions}
          usageExceeded={usageExceeded ?? false}
          canManageApps={canManageApps}
          onClose={onClose}
        />

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
              {moment(app.appInstallation.sys.createdAt).format('DD MMM YYYY')}
            </span>
          </>
        )}

        {!isInstalled && usageExceeded && canManageApps && (
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

interface CTAProps {
  app: MarketplaceApp;
  appManager: AppManager;
  spaceInformation: SpaceInformation;
  setShowPermissions: (show: boolean) => void;
  usageExceeded: boolean;
  canManageApps: boolean;
  onClose: () => void | Promise<void>;
}

function CTA({
  app,
  appManager,
  spaceInformation,
  setShowPermissions,
  usageExceeded,
  canManageApps,
  onClose,
}: CTAProps) {
  const routeNavigate = useRouteNavigate();
  if (app.isPaidApp && !app.appDefinition) {
    return (
      <Button
        href={app.learnMoreUrl!}
        target="_blank"
        rel="noopener noreferrer"
        isFullWidth
        buttonType="muted"
        icon="ExternalLink">
        Contact us
      </Button>
    );
  }

  if (!app.appInstallation) {
    return (
      <Button
        onClick={() => setShowPermissions(true)}
        isFullWidth
        buttonType="primary"
        disabled={usageExceeded || !canManageApps}>
        Install
      </Button>
    );
  }

  if (app.isContentfulApp) {
    return (
      <Button
        href={getContentfulAppUrl(app.id, spaceInformation)}
        target="_blank"
        rel="noopener noreferrer"
        isFullWidth
        buttonType="primary"
        icon="ExternalLink">
        Open
      </Button>
    );
  }

  if (hasConfigLocation(app.appDefinition)) {
    return (
      <Button
        onClick={async () => {
          await onClose();
          routeNavigate({ path: 'apps.app-configuration', appId: app.id });
        }}
        isFullWidth
        buttonType="primary"
        disabled={!canManageApps}>
        Configure
      </Button>
    );
  }

  return (
    <Button
      onClick={async () => {
        await onClose();
        await appManager.showUninstall(app);
      }}
      isFullWidth
      buttonType="negative"
      disabled={!canManageApps}>
      Uninstall
    </Button>
  );
}
