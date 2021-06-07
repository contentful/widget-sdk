import React from 'react';
import {
  CardActions,
  DropdownList,
  DropdownListItem,
  Heading,
  Tag,
  TextLink,
} from '@contentful/forma-36-react-components';
import { styles } from '../styles';
import { Notification } from '@contentful/forma-36-react-components';
import { AppIcon } from '../AppIcon';
import { hasConfigLocation } from '../utils';
import { MarketplaceApp } from 'features/apps-core';
import { AppManager } from '../AppOperations';
import { ReactRouterLink, useRouteNavigate } from 'core/react-routing';

interface AppListItemProps {
  app: MarketplaceApp;
  appManager: AppManager;
  openDetailModal: (app: MarketplaceApp) => void;
  canManageApps: boolean;
  orgId: string;
}

export function AppListItem(props: AppListItemProps) {
  const { app, openDetailModal, canManageApps, orgId, appManager } = props;

  const routeNavigate = useRouteNavigate();
  const openDetailsFunc = () => openDetailModal(app);
  const isInstalled = app.appInstallation;
  const isPrivate = app.isPrivateApp;
  const hasConfig = hasConfigLocation(app.appDefinition);

  const shouldNavigateToConfig = canManageApps && hasConfig && isInstalled;
  const shouldDoNothing = canManageApps && !hasConfig && isPrivate && isInstalled;

  const clickAction = () => {
    if (!canManageApps && isPrivate) {
      Notification.error("You don't have permission to manage apps. Ask your admin for help.");
    } else if (!shouldDoNothing) {
      openDetailModal(app);
    }
  };

  const goToConfiguration = () => {
    routeNavigate({ path: 'apps.app-configuration', appId: app.id });
  };

  return (
    <div className={styles.item}>
      <div className={styles.title} data-test-id="app-title">
        <div className={styles.titleText}>
          <div
            onClick={shouldNavigateToConfig ? goToConfiguration : clickAction}
            className={styles.appLink(shouldDoNothing)}
            data-test-id="app-details">
            <AppIcon icon={app.icon} />
            <div>
              <Heading element="h3" className={styles.appLinkTitle}>
                {app.title}
                {app.isEarlyAccess && (
                  <Tag tagType="warning" className={styles.earlyAccessTag}>
                    EARLY ACCESS
                  </Tag>
                )}
                {app.isPrivateApp && <Tag className={styles.tag}>Private</Tag>}
              </Heading>
              {app.tagLine && <div className={styles.tagLine}>{app.tagLine}</div>}
            </div>
          </div>
        </div>
      </div>
      <div className={styles.actions}>
        {!canManageApps ? (
          !app.isPrivateApp && (
            <TextLink onClick={openDetailsFunc} linkType="primary">
              About
            </TextLink>
          )
        ) : (
          <CardActions iconButtonProps={{ buttonType: 'primary' }}>
            <DropdownList className={styles.listItemDropdown}>
              {!app.isPrivateApp && (
                <DropdownListItem onClick={openDetailsFunc}>About</DropdownListItem>
              )}
              {!app.appInstallation && canManageApps && (
                <DropdownListItem onClick={openDetailsFunc}>Install</DropdownListItem>
              )}
              {app.appInstallation && canManageApps && hasConfig && (
                <DropdownListItem onClick={goToConfiguration}>Configure</DropdownListItem>
              )}
              {app.appInstallation && canManageApps && (
                <DropdownListItem onClick={() => appManager.showUninstall(app)}>
                  Uninstall
                </DropdownListItem>
              )}
              {canManageApps && app.isPrivateApp && (
                <ReactRouterLink
                  route={{
                    path: 'organizations.apps.definition',
                    orgId,
                    definitionId: app.appDefinition.sys.id,
                  }}>
                  {({ onClick }) => (
                    <DropdownListItem onClick={onClick}>Edit app definition</DropdownListItem>
                  )}
                </ReactRouterLink>
              )}
            </DropdownList>
          </CardActions>
        )}
      </div>
    </div>
  );
}
