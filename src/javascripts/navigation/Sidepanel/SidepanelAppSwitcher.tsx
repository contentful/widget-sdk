import React from 'react';
import { AppSwitcher, AppSwitcherAction } from '@contentful/experience-components';
import * as Navigator from 'states/Navigator';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { NavigationSwitcherAppProps } from './useAppsList';
import * as accessChecker from 'access_control/AccessChecker';

export const SidepanelAppSwitcher = ({
  isVisible,
  onClose,
  appsList,
}: {
  appsList: NavigationSwitcherAppProps[];
  isVisible: boolean;
  onClose: () => void;
}) => {
  const spaceEnv = useSpaceEnvContext();

  const onAppSwitcherAction = (action: AppSwitcherAction) => {
    const { ctrlKey, shiftKey } = action.event;

    if (ctrlKey || shiftKey) return;

    onClose();

    if (action.type === 'open-app') {
      const app = appsList.find((item) => item.type === action.app);

      if (!app) {
        return;
      }

      if (!app.isInstalled) {
        Navigator.go(app.installRouteProps);

        action.event.preventDefault();
        return;
      }

      // go to space home or entries on click Web app
      if (app.active) {
        Navigator.go({
          path: accessChecker.getSectionVisibility().spaceHome
            ? 'spaces.detail.home'
            : 'spaces.detail.entries.list',
          params: { environmentId: spaceEnv.currentEnvironmentId },
        });

        action.event.preventDefault();
        return;
      }
    }
  };

  return (
    <AppSwitcher
      appsList={appsList}
      isVisible={isVisible}
      onClose={onClose}
      onClick={onAppSwitcherAction}
    />
  );
};
