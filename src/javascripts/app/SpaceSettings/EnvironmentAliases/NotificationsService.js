import React from 'react';
import { ModalLauncher, Notification } from '@contentful/forma-36-react-components';
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
  AliasChangedChoiceModal,
  AliasChangedInfoModal,
  AliasDeletedInfoModal,
  MasterAliasMovedModal,
} from './Notifications';
import { isAContentSpecificPage, isAnEnvironmentAwarePage, ACTION } from './Utils';

import { getSpaceContext } from 'classes/spaceContext';

let aliasChangedToastVisible = false;

const notifyAliasChangeWithEnvironmentsAccess = ({
  currentEnvironmentId,
  currentAliasId,
  aliasId,
  oldTarget,
  newTarget,
  newTargetIsMaster,
  modalLauncher = ModalLauncher,
}) => {
  // Our alias now targets a new env, we must choose something:
  if (currentAliasId && currentAliasId === aliasId) {
    return modalLauncher.open(({ onClose, isShown }) => (
      <AliasChangedChoiceModal
        onClose={onClose}
        isShown={isShown}
        currentEnvironmentId={currentEnvironmentId}
        oldTarget={oldTarget}
        newTarget={newTarget}
        newTargetIsMaster={newTargetIsMaster}
        aliasId={aliasId}
      />
    ));
  }

  // Master alias now targets this env
  if (aliasId === 'master' && newTarget === currentEnvironmentId) {
    return modalLauncher.open(({ onClose, isShown }) => (
      <MasterAliasMovedModal onClose={onClose} isShown={isShown} isMaster={true} />
    ));
  }

  // Master alias no longer targets this env
  if (aliasId === 'master' && oldTarget === currentEnvironmentId) {
    return modalLauncher.open(({ onClose, isShown }) => (
      <MasterAliasMovedModal onClose={onClose} isShown={isShown} isMaster={false} />
    ));
  }
};

export const triggerAliasChangedNotifications = ({ update, modalLauncher = ModalLauncher }) => {
  if (aliasChangedToastVisible) return;
  const { newTarget, oldTarget, aliasId } = update;
  const spaceContext = getSpaceContext();
  const currentEnvironmentId = spaceContext.getEnvironmentId();
  const currentAliasId = spaceContext.space.environmentMeta.aliasId;
  if (oldTarget === null) {
    // hack to avoid refresh if opting-in to aliases for first time
    return;
  }

  // Check to see if we are now targeting the same env as the master alias
  const newTargetIsMaster = spaceContext.isMasterEnvironmentById(newTarget);

  notificationEnvironmentAliasChanged({ update });

  if (!isAContentSpecificPage() && !isAnEnvironmentAwarePage()) {
    return;
  }

  if (accessChecker.can('manage', 'Environments')) {
    return notifyAliasChangeWithEnvironmentsAccess({
      newTarget,
      oldTarget,
      aliasId,
      currentAliasId,
      currentEnvironmentId,
      newTargetIsMaster,
      modalLauncher,
    });
  }

  // If non-env users are on master as an alias, and it changes, tell them the bad news:
  if (currentAliasId === 'master' && aliasId === 'master') {
    return modalLauncher.open(({ onClose, isShown }) => (
      <AliasChangedInfoModal onClose={onClose} isShown={isShown} />
    ));
  }
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
    logger.captureError(err);
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

  if (!accessChecker.can('manage', 'Environments')) {
    return;
  }

  const { target, aliasId } = update;
  const spaceContext = getSpaceContext();
  if (update.action === ACTION.DELETE && aliasId === spaceContext.space.environmentMeta.aliasId) {
    return modalLauncher.open(({ onClose, isShown }) => (
      // reload to unscoped route, or move to the old target env
      <AliasDeletedInfoModal
        onClose={onClose}
        isShown={isShown}
        target={target}
        aliasId={aliasId}
      />
    ));
  }
};

export const initEnvAliasCreateHandler = (modalLauncher = ModalLauncher) => {
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

export const initEnvAliasDeleteHandler = (modalLauncher = ModalLauncher) => {
  const action = ACTION.DELETE;
  return (update) => {
    triggerAliasCreatedOrDeletedNotifications({
      modalLauncher,
      update: { ...update, action },
    });
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
    logger.captureError(err);
    Notification.error(<Message message={`There was an error deleting the ${aliasId} alias`} />);
  }
};

export const triggerAliasCreatedToast = async (id) => {
  Notification.success(<Message message={`Environment alias ${id} created.`} />);
  Navigator.reload();
};

// change to named export initEnvAliasChangeHandler
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
