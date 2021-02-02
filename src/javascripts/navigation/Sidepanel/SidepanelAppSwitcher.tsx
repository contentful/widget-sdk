import React from 'react';
import { AppSwitcher, AppSwitcherAction } from '@contentful/experience-components';
import * as Navigator from 'states/Navigator';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { NavigationSwitcherAppProps } from './useAppsList';

export const SidepanelAppSwitcher = ({ isVisible, onClose, appsList }) => {
  const spaceEnv = useSpaceEnvContext();

  const onAppSwitcherAction = (action: AppSwitcherAction) => {
    const { ctrlKey, shiftKey } = action.event;

    if (ctrlKey || shiftKey) return;

    onClose();

    if (action.type === 'open-app') {
      if (!action.app.isInstalled) {
        const app = action.app as NavigationSwitcherAppProps;

        Navigator.go(app.installRouteProps);

        action.event.preventDefault();
        return;
      }

      // go to space home on click Web app
      if (action.app.active) {
        Navigator.go({
          path: 'spaces.detail.home',
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
