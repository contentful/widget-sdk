import React from 'react';
import { AppSwitcher, AppSwitcherAction } from '@contentful/experience-components';
import { NavigationSwitcherAppProps } from './useAppsList';

export const SidepanelAppSwitcher = ({
  isVisible,
  onClose,
  appsList,
}: {
  appsList: NavigationSwitcherAppProps[];
  isVisible: boolean;
  onClose: () => void;
}) => {
  const onAppSwitcherAction = (action: AppSwitcherAction) => {
    const { ctrlKey, shiftKey } = action.event;

    if (ctrlKey || shiftKey) return;

    onClose();

    if (action.type === 'open-app') {
      const app = appsList.find((item) => item.type === action.app);

      if (!app) {
        return;
      }

      if (!app.isInstalled || app.active) {
        action.event.preventDefault();
        app.navigate();
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
