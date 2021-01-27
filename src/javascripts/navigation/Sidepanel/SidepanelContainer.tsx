import React from 'react';
import { AppSwitcher } from '@contentful/experience-components';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import * as Navigator from 'states/Navigator';
import SidePanelTrigger from './SidePanelTrigger';
import Sidepanel from './Sidepanel';
import keycodes from 'utils/keycodes';
import { FEATURES, useSpaceFeature } from 'data/CMA/ProductCatalog';
import { useAppsList, NavigationSwitcherAppProps } from './useAppsList';
import { AppSwitcherAction } from '@contentful/experience-components/dist/AppSwitcher/types';
import { isMasterEnvironment } from 'core/services/SpaceEnvContext/utils';

const SidepanelContainer = () => {
  const [sidePanelIsShown, setSidePanelIsShown] = React.useState(false);
  const [orgDropdownIsShown, setOrgDropdownIsShown] = React.useState(false);
  const [appSwitcherIsShown, setAppSwitcherIsShown] = React.useState(false);
  const contentfulApps = useAppsList();
  const spaceEnv = useSpaceEnvContext();
  const performancePageFeature = useSpaceFeature(
    spaceEnv.currentSpaceId,
    FEATURES.PC_SPACE_PERFORMANCE_PACKAGE,
    false
  );
  // when there's no space, set to false instead of null
  const performancePackageIsEnabled = spaceEnv.currentSpaceId
    ? performancePageFeature ?? null
    : false;

  const closeDropdownOrPanel = React.useCallback(() => {
    if (orgDropdownIsShown) {
      setOrgDropdownIsShown(false);
    } else {
      setSidePanelIsShown(false);
    }
  }, [orgDropdownIsShown]);

  const handleEsc = React.useCallback(
    (ev) => {
      if (ev.keyCode === keycodes.ESC) {
        closeDropdownOrPanel();
      }
    },
    [closeDropdownOrPanel]
  );

  const onAppSwitcherAction = (action: AppSwitcherAction) => {
    const { ctrlKey, shiftKey } = action.event;

    if (ctrlKey || shiftKey) return;

    setAppSwitcherIsShown(false);

    if (action.type === 'open-app') {
      if (!action.app.isInstalled) {
        const app = action.app as NavigationSwitcherAppProps;

        Navigator.go({
          path: isMasterEnvironment(spaceEnv.currentEnvironment)
            ? 'spaces.detail.apps.list'
            : 'spaces.detail.environment.apps.list',
          params: { environmentId: spaceEnv.currentEnvironmentId, app: app.slug || app.id },
        });

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

  React.useEffect(() => {
    window.addEventListener('keyup', handleEsc);

    return () => window.removeEventListener('keyup', handleEsc);
  }, [handleEsc]);

  return (
    <React.Fragment>
      <div className="nav-sidepanel-container">
        <div
          className={`nav-sidepanel__bg ${sidePanelIsShown ? 'nav-sidepanel__bg--is-visible' : ''}`}
          data-test-id="close-sidepanel-bg"
          onClick={closeDropdownOrPanel}
        />
        <Sidepanel
          sidePanelIsShown={sidePanelIsShown}
          orgDropdownIsShown={orgDropdownIsShown}
          openOrgsDropdown={(event: React.MouseEvent) => {
            if (orgDropdownIsShown === false) {
              setOrgDropdownIsShown(true);
              // Don't bubble click event to container that would close the dropdown
              event.stopPropagation();
            }
          }}
          closeOrgsDropdown={() => {
            setOrgDropdownIsShown(false);
          }}
          closeSidePanel={() => {
            setSidePanelIsShown(false);
          }}
        />
      </div>
      <AppSwitcher
        appsList={contentfulApps}
        isVisible={appSwitcherIsShown}
        onClose={() => setAppSwitcherIsShown(false)}
        onClick={onAppSwitcherAction}
      />
      <SidePanelTrigger
        performancePackageIsEnabled={performancePackageIsEnabled}
        onClickOrganization={() => setSidePanelIsShown(true)}
        openAppSwitcher={() => setAppSwitcherIsShown(true)}
      />
    </React.Fragment>
  );
};

export default SidepanelContainer;
