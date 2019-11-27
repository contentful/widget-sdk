import React from 'react';
import { Notification } from '@contentful/forma-36-react-components';
import ModalLauncher from 'app/common/ModalLauncher';
import * as Navigator from 'states/Navigator';
import * as logger from 'services/logger';
import * as accessChecker from 'access_control/AccessChecker';
import { notificationEnvironmentAliasChanged } from 'analytics/events/EnvironmentAliases';
import { FromTo, InfoModal, ChoiceModal } from './Notifications';
import { isAContentSpecificPage, isAnEnvironmentAwarePage } from './Utils';

let aliasChangedToastVisible = false;
export const triggerNotifications = async ({ currentEnvironmentId, update }) => {
  if (aliasChangedToastVisible) return;
  notificationEnvironmentAliasChanged({ update });
  const { newTarget, oldTarget } = update;

  const newAliasTargetIsCurrentEnv = currentEnvironmentId === newTarget;
  const newAliasTargetNotCurrentEnv = currentEnvironmentId === oldTarget;

  const aliasTargetIsUnrelatedToCurrentEnv =
    !newAliasTargetIsCurrentEnv && !newAliasTargetNotCurrentEnv;
  const currentPageIsNotEnvironmentRelated =
    !isAContentSpecificPage() && !isAnEnvironmentAwarePage();

  const shouldSimplyReload =
    aliasTargetIsUnrelatedToCurrentEnv || currentPageIsNotEnvironmentRelated;

  if (shouldSimplyReload) {
    // changes not related to current environment
    Notification.warning('Your space admin has made changes to your space');
    await Navigator.reload();
    return;
  }

  const canManageEnvironments = accessChecker.can('manage', 'Environments');
  await ModalLauncher.open(({ onClose, isShown }) =>
    newAliasTargetNotCurrentEnv && canManageEnvironments ? (
      // ask for user input
      <ChoiceModal
        onClose={onClose}
        isShown={isShown}
        currentEnvironmentId={currentEnvironmentId}
        {...update}
      />
    ) : (
      // ask for user confirmation
      <InfoModal
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
    sys: { id: aliasId }
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

export default currentEnvironmentId => {
  return update => {
    if (window.location.pathname.startsWith('/spaces')) {
      triggerNotifications({
        currentEnvironmentId,
        update
      });
    }
  };
};
