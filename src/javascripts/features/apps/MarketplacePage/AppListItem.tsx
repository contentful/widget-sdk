import React from 'react';
import {
  CardActions,
  DropdownList,
  DropdownListItem,
  Heading,
  Tag,
  TextLink,
} from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink';
import { styles } from '../styles';
import { Notification } from '@contentful/forma-36-react-components';
import { AppIcon } from '../AppIcon';
import { hasConfigLocation } from '../utils';
import { MarketplaceApp } from 'features/apps-core';
import { AppManager } from '../AppOperations';

interface AppListItemProps {
  app: MarketplaceApp;
  appManager: AppManager;
  openDetailModal: (app: MarketplaceApp) => void;
  canManageApps: boolean;
  orgId: string;
  hasAdvancedAppsFeature: boolean;
}

export function AppListItem(props: AppListItemProps) {
  const { app, openDetailModal, canManageApps, orgId, appManager } = props;

  const determineOnClick = (
    navigateToAppPage,
    openDetails,
    showPermissionsErrorFunc,
    canManageApps,
    hasConfig
  ) => {
    const isInstalled = app.appInstallation;
    const isPrivate = app.isPrivateApp;

    // When clicking on a private app, we attempt to go straight to the install
    // screen. In the case that the user cannot manage an app, we should instead
    // show an error.
    if (!canManageApps) {
      if (isPrivate) {
        return showPermissionsErrorFunc;
      }
      return openDetails;
    }

    if (hasConfig) {
      if (isInstalled) {
        return navigateToAppPage;
      }
      return openDetails;
    }

    if (isPrivate && isInstalled) {
      return () => appManager.showUninstall(app);
    }
    return openDetails;
  };

  const openDetailsFunc = () => openDetailModal(app);
  const showPermissionsErrorFunc = () =>
    Notification.error("You don't have permission to manage apps. Ask your admin for help.");

  const hasConfig = hasConfigLocation(app.appDefinition);

  return (
    <div className={styles.item}>
      <div className={styles.title} data-test-id="app-title">
        <Heading element="h3" className={styles.titleText}>
          <StateLink path="^.detail" params={{ appId: app.id }}>
            {({ onClick }) => (
              <div
                onClick={determineOnClick(
                  onClick,
                  openDetailsFunc,
                  showPermissionsErrorFunc,
                  canManageApps,
                  hasConfig
                )}
                className={styles.appLink}
                data-test-id="app-details">
                <AppIcon icon={app.icon} />
                <div>
                  {app.title}
                  {app.isEarlyAccess && (
                    <Tag tagType="warning" className={styles.earlyAccessTag}>
                      EARLY ACCESS
                    </Tag>
                  )}
                  {app.tagLine && <div className={styles.tagLine}>{app.tagLine}</div>}
                </div>
                {app.isPrivateApp && <Tag className={styles.tag}>Private</Tag>}
              </div>
            )}
          </StateLink>
        </Heading>
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
                <StateLink path="^.detail" params={{ appId: app.id }}>
                  {({ onClick }) => (
                    <>
                      <DropdownListItem onClick={onClick}>Configure</DropdownListItem>
                    </>
                  )}
                </StateLink>
              )}
              {app.appInstallation && canManageApps && (
                <DropdownListItem onClick={() => appManager.showUninstall(app)}>
                  Uninstall
                </DropdownListItem>
              )}
              {canManageApps && app.isPrivateApp && (
                <StateLink
                  path="account.organizations.apps.definitions"
                  params={{ orgId, definitionId: app.appDefinition.sys.id }}>
                  {({ onClick }) => (
                    <DropdownListItem onClick={onClick}>Edit app definition</DropdownListItem>
                  )}
                </StateLink>
              )}
            </DropdownList>
          </CardActions>
        )}
      </div>
    </div>
  );
}
