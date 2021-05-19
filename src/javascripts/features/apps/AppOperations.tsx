import React from 'react';
import { get } from 'lodash';
import { ModalLauncher, Notification } from '@contentful/forma-36-react-components';
import * as AppLifecycleTracking from './AppLifecycleTracking';
import { isUsageExceededErrorResponse, getUsageExceededMessage } from './utils';

import {
  transformEditorInterfacesToTargetState,
  removeAllEditorInterfaceReferences,
} from './AppEditorInterfaces';
import { validateState } from './AppState';
import { UninstallModal } from './UninstallModal';
import { MarketplaceApp, getAppsRepo } from 'features/apps-core';
import APIClient from 'data/APIClient';

export type AppStatusCheck = (app: MarketplaceApp) => Promise<{
  appDefinition: MarketplaceApp['appDefinition'];
  appInstallation?: MarketplaceApp['appInstallation'];
  isMarketplaceInstallation: boolean;
}>;

export type AppInstallCallback = (appInstallation?: MarketplaceApp['appInstallation']) => void;

export class AppManager {
  cma: any;
  environmentId: string;
  spaceId: string;
  organizationId: string;
  afterEachCallback?: Function;

  constructor(cma, environmentId, spaceId, organizationId, afterEachCallback?) {
    this.cma = cma;
    this.environmentId = environmentId;
    this.spaceId = spaceId;
    this.organizationId = organizationId;
    this.afterEachCallback = afterEachCallback;
  }

  checkAppStatus = async (app: MarketplaceApp) => {
    if (!app.appDefinition) {
      throw new Error('AppDefinition not defined');
    }

    try {
      return {
        appDefinition: app.appDefinition,
        // Can throw 404 if the app is not installed yet:
        appInstallation: await this.cma.getAppInstallation(app.appDefinition.sys.id),
        isMarketplaceInstallation: false,
      };
    } catch (err) {
      return {
        appDefinition: app.appDefinition,
        // There is no installation and the app is not private:
        isMarketplaceInstallation: !app.isPrivateApp,
      };
    }
  };

  async installApp(
    app,
    hasAdvancedAppsFeature,
    userNotifications = true,
    callback: AppInstallCallback = () => null
  ) {
    try {
      await installOrUpdate(app, this.cma, callback, this.checkAppStatus, undefined, {
        organizationId: this.organizationId,
        environmentId: this.environmentId,
        spaceId: this.spaceId,
      });

      // Verify if installation was completed.
      const { appInstallation } = await this.checkAppStatus(app);
      if (!appInstallation) {
        // For whatever reason AppInstallation entity wasn't created.
        throw new Error('AppInstallation does not exist.');
      }
      userNotifications && Notification.success('The app was successfully installed.');
      AppLifecycleTracking.installed(app.id);

      if (this.afterEachCallback) {
        this.afterEachCallback();
      }
    } catch (err) {
      if (isUsageExceededErrorResponse(err)) {
        userNotifications && Notification.error(getUsageExceededMessage(hasAdvancedAppsFeature));
        AppLifecycleTracking.installationFailed(app.id);
      } else {
        userNotifications && Notification.error('Failed to install the app.');
        AppLifecycleTracking.installationFailed(app.id);
      }
      if (!userNotifications) {
        throw err;
      }
    }
  }

  async showUninstall(app, callback?: AppInstallCallback) {
    return this.showUninstallModal(app, async (onClose, reasons: string[]) => {
      await this.uninstallApp(app, reasons, callback);
      onClose(true);
    });
  }

  async showUninstallModal(app, onConfirm) {
    AppLifecycleTracking.uninstallationInitiated(app.id);
    return ModalLauncher.open(({ isShown, onClose }) => (
      <UninstallModal
        key={Date.now()}
        isShown={isShown}
        askForReasons={!app.isPrivateApp}
        actionList={app.actionList || []}
        onConfirm={(...args) => onConfirm(onClose, ...args)}
        onClose={() => {
          AppLifecycleTracking.uninstallationCancelled(app.id);
          onClose(true);
        }}
      />
    ));
  }

  async uninstallApp(app, reasons: string[], callback?: AppInstallCallback) {
    try {
      await uninstall(app, this.cma, this.checkAppStatus.bind(this), callback);

      // Verify if uninstallation was completed.
      const { appInstallation } = await this.checkAppStatus(app);

      if (appInstallation) {
        throw new Error('AppInstallation still exists.');
      }

      Notification.success('The app was uninstalled successfully.');
      AppLifecycleTracking.uninstalled(app.id, reasons);

      if (this.afterEachCallback) {
        this.afterEachCallback();
      }
    } catch (err) {
      Notification.error('Failed to fully uninstall the app.');
      AppLifecycleTracking.uninstallationFailed(app.id);
    }
  }
}

export async function installOrUpdate(
  app: MarketplaceApp,
  cma: APIClient,
  callback: AppInstallCallback,
  checkAppStatus: AppStatusCheck,
  { parameters, targetState }: any = {},
  spaceData
) {
  validateState(targetState);

  const { appDefinition, isMarketplaceInstallation } = await checkAppStatus(app);

  const appInstallation = await cma.updateAppInstallation(
    appDefinition.sys.id,
    parameters,
    isMarketplaceInstallation
  );

  await transformEditorInterfacesToTargetState(
    cma,
    get(targetState, ['EditorInterface'], {}),
    appInstallation.sys.appDefinition.sys.id,
    spaceData
  );

  getAppsRepo().clearCache(['appInstallations']);
  await callback(appInstallation);
}

// Best effort uninstallation.
export async function uninstall(
  app: MarketplaceApp,
  cma,
  checkAppStatus: AppStatusCheck,
  callback: AppInstallCallback = (_) => null
) {
  const { appDefinition, appInstallation } = await checkAppStatus(app);

  if (appInstallation) {
    // Rewrite all EditorInterfaces refering the app widget.
    await removeAllEditorInterfaceReferences(cma, appInstallation.sys.appDefinition.sys.id);
    // Remove the AppInstallation itself.
    await cma.deleteAppInstallation(appDefinition.sys.id);

    getAppsRepo().clearCache(['appInstallations']);
  }

  await callback(appInstallation);
}
