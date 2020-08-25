import React from 'react';
import { Notification } from '@contentful/forma-36-react-components';
import { ModalLauncher } from 'core/components/ModalLauncher';
import { window } from 'core/services/window';
import * as Navigator from 'states/Navigator';
import * as logger from 'services/logger';
import * as accessChecker from 'access_control/AccessChecker';
import {
  notificationEnvironmentAliasChanged,
  notificationEnvironmentAliasCreated,
  notificationEnvironmentAliasDeleted,
} from 'analytics/events/EnvironmentAliases';
import {
  Message,
  FromTo,
  AliasChangedInfoModal,
  AliasChangedChoiceModal,
  AliasCreatedOrDeletedInfoModal,
} from './Notifications';
import { isAContentSpecificPage, isAnEnvironmentAwarePage, ACTION } from './Utils';

import { getModule } from 'core/NgRegistry';

let aliasChangedToastVisible = false;
export const triggerAliasChangedNotifications = async ({
  update,
  modalLauncher = ModalLauncher,
}) => {
  if (aliasChangedToastVisible) return;
  notificationEnvironmentAliasChanged({ update });
  const { newTarget, oldTarget } = update;

  const spaceContext = getModule('spaceContext');
  const currentEnvironmentId = spaceContext.getEnvironmentId();
  const newAliasTargetIsCurrentEnv = currentEnvironmentId === newTarget;
  const newAliasTargetNotCurrentEnv = currentEnvironmentId === oldTarget;

  const aliasTargetIsUnrelatedToCurrentEnv =
    !newAliasTargetIsCurrentEnv && !newAliasTargetNotCurrentEnv;
  const currentPageIsNotEnvironmentRelated =
    !isAContentSpecificPage() && !isAnEnvironmentAwarePage();

  const isInitialSetup = oldTarget === null;
  if (isInitialSetup) {
    // hack to avoid refresh if opting-in to aliases for first time
    return;
  }

  const shouldSimplyReload =
    aliasTargetIsUnrelatedToCurrentEnv || currentPageIsNotEnvironmentRelated;

  if (shouldSimplyReload) {
    // changes not related to current environment
    Notification.warning('Your space admin has made changes to your space');
    await Navigator.reload();
    return;
  }

  const canManageEnvironments = accessChecker.can('manage', 'Environments');
  await modalLauncher.open(({ onClose, isShown }) =>
    newAliasTargetNotCurrentEnv && canManageEnvironments ? (
      // ask for user input
      <AliasChangedChoiceModal
        onClose={onClose}
        isShown={isShown}
        currentEnvironmentId={currentEnvironmentId}
        {...update}
      />
    ) : (
      // ask for user confirmation
      <AliasChangedInfoModal
        canManageEnvironments={canManageEnvironments}
        onClose={onClose}
        isShown={isShown}
        currentEnvironmentId={currentEnvironmentId}
        {...update}
      />
    )
  );
};

export const triggerAliasChangedToast = async (handleChangeEnvironment, update) => {
  aliasChangedToastVisible = true;
  const { spaceId, alias, oldTarget, newTarget } = update;
  const {
    sys: { id: aliasId },
  } = alias;

  try {
    await handleChangeEnvironment(spaceId, alias, newTarget);
    Notification.success(
      <FromTo
        message={`Environment alias "${aliasId}" target was changed from `}
        oldTarget={oldTarget}
        newTarget={newTarget}
      />
    );
    Navigator.reload();
  } catch (err) {
    logger.logError('Aliases - changeEnvironment exception', err);
    Notification.error(
      <FromTo
        message={`There was an error changing the ${aliasId} alias target from `}
        oldTarget={oldTarget}
        newTarget={newTarget}
      />
    );
  }
  setTimeout(() => {
    // unlock after 6s default timeout of notification
    aliasChangedToastVisible = false;
  }, 6000);
};

export const triggerAliasCreatedOrDeletedNotifications = async ({
  update,
  modalLauncher = ModalLauncher,
}) => {
  if (aliasChangedToastVisible) return;
  if (update.action === ACTION.CREATE) {
    notificationEnvironmentAliasCreated({ update });
  } else if (update.action === ACTION.DELETE) {
    notificationEnvironmentAliasDeleted({ update });
  }

  const spaceContext = getModule('spaceContext');
  const currentEnvironmentId = spaceContext.getEnvironmentId();

  const { target } = update;
  const targetIsCurrentEnv = currentEnvironmentId === target;
  const currentPageIsNotEnvironmentRelated =
    !isAContentSpecificPage() && !isAnEnvironmentAwarePage();

  const shouldSimplyReload = !targetIsCurrentEnv || currentPageIsNotEnvironmentRelated;

  if (shouldSimplyReload) {
    // changes not related to current environment
    Notification.warning('Your space admin has made changes to your space');
    await Navigator.reload();
    return;
  }

  const canManageEnvironments = accessChecker.can('manage', 'Environments');
  return modalLauncher.open(({ onClose, isShown }) => (
    // ask for user confirmation
    <AliasCreatedOrDeletedInfoModal
      canManageEnvironments={canManageEnvironments}
      onClose={onClose}
      isShown={isShown}
      currentEnvironmentId={currentEnvironmentId}
      {...update}
    />
  ));
};

export const initEnvAliasCreateHandler = (modalLauncher) => {
  const action = ACTION.CREATE;
  return (update) => {
    if (window.location.pathname.startsWith('/spaces')) {
      triggerAliasCreatedOrDeletedNotifications({
        modalLauncher,
        update: { ...update, action },
      });
    }
  };
};

export const initEnvAliasDeleteHandler = (modalLauncher) => {
  const action = ACTION.DELETE;
  return (update) => {
    if (window.location.pathname.startsWith('/spaces')) {
      triggerAliasCreatedOrDeletedNotifications({
        modalLauncher,
        update: { ...update, action },
      });
    }
  };
};

export const temporarilyIgnoreAliasChangedToast = () => {
  aliasChangedToastVisible = true;
  setTimeout(() => {
    // unlock after 6s default timeout of notification
    aliasChangedToastVisible = false;
  }, 6000);
};

export const triggerAliasDeletedToast = async (handleDeleteEnvironment, context) => {
  const { spaceId, alias } = context;
  const {
    sys: { id: aliasId },
  } = alias;

  try {
    await handleDeleteEnvironment(spaceId, alias);
    Notification.success(<Message message={`Environment alias "${aliasId}" deleted`} />);
    Navigator.reload();
  } catch (err) {
    logger.logError('Aliases - deleteEnvironment exception', err);
    Notification.error(<Message message={`There was an error deleting the ${aliasId} alias`} />);
  }
};

export const triggerAliasCreatedToast = async (id) => {
  Notification.success(<Message message={`Environment alias ${id} created.`} />);
  Navigator.reload();
};

export default (modalLauncher) => {
  return (update) => {
    if (window.location.pathname.startsWith('/spaces')) {
      triggerAliasChangedNotifications({
        modalLauncher,
        update,
      });
    }
  };
};
