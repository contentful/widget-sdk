import React, { Component } from 'react';
import { TextLink, Heading, Tag } from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink';
import { styles } from '../styles';
import { Notification } from '@contentful/forma-36-react-components';
import { AppIcon } from '../AppIcon';
import { MarketplaceApp } from '../../apps-core';

interface AppListItemProps {
  app: MarketplaceApp;
  openDetailModal: (app: MarketplaceApp) => void;
  canManageApps: boolean;
  orgId: string;
}

export class AppListItem extends Component<AppListItemProps> {
  determineOnClick = (onClick, openDetailsFunc, showPermissionsErrorFunc, canManageApps) => {
    const { app } = this.props;

    const isInstalledOrPrivate = !!app.appInstallation || app.isPrivateApp;

    // When clicking on a private app, we attempt to go straight to the install
    // screen. In the case that the user cannot manage an app, we should instead
    // show an error.
    if (!canManageApps && app.isPrivateApp) {
      return showPermissionsErrorFunc;
    }

    const continueDirectlyToAppPage = canManageApps && isInstalledOrPrivate;

    return continueDirectlyToAppPage ? onClick : openDetailsFunc;
  };

  render() {
    const { app, openDetailModal, canManageApps, orgId } = this.props;

    const openDetailsFunc = () => openDetailModal(app);
    const showPermissionsErrorFunc = () =>
      Notification.error("You don't have permission to manage apps. Ask your admin for help.");

    return (
      <div className={styles.item}>
        <div className={styles.title} data-test-id="app-title">
          <Heading element="h3" className={styles.titleText}>
            <StateLink path="^.detail" params={{ appId: app.id }}>
              {({ onClick }) => (
                <div
                  onClick={this.determineOnClick(
                    onClick,
                    openDetailsFunc,
                    showPermissionsErrorFunc,
                    canManageApps
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
          {!!app.appInstallation && canManageApps && (
            <StateLink path="^.detail" params={{ appId: app.id }}>
              {({ onClick }) => (
                <TextLink onClick={onClick} linkType="primary">
                  Configure
                </TextLink>
              )}
            </StateLink>
          )}
          {!app.isPrivateApp && (
            <TextLink onClick={openDetailsFunc} linkType="primary">
              About
            </TextLink>
          )}
          {canManageApps && app.isPrivateApp && (
            <StateLink
              path="account.organizations.apps.definitions"
              params={{ orgId, definitionId: app.appDefinition.sys.id }}>
              {({ onClick }) => (
                <TextLink onClick={onClick} linkType="primary">
                  Edit app definition
                </TextLink>
              )}
            </StateLink>
          )}
        </div>
      </div>
    );
  }
}
