import React from 'react';
import SidePanelTrigger from './SidePanelTrigger';
import Sidepanel from './Sidepanel';
import keycodes from 'utils/keycodes';
import * as Config from 'Config';
import { SidepanelAppSwitcher } from './SidepanelAppSwitcher';
import { useAppsList } from './useAppsList';
import { WhatsNewContextProvider } from '@contentful/experience-components';

// we need to pass this utm parameters in the url
// to make sure that analytics know that the traffic in those pages are coming from the user_interface
const utmParams = 'utm_source=webapp';

const SidepanelContainer = () => {
  const [sidePanelIsShown, setSidePanelIsShown] = React.useState(false);
  const [orgDropdownIsShown, setOrgDropdownIsShown] = React.useState(false);
  const [appSwitcherIsShown, setAppSwitcherIsShown] = React.useState(false);
  const { appsList } = useAppsList();

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

  React.useEffect(() => {
    window.addEventListener('keyup', handleEsc);

    return () => window.removeEventListener('keyup', handleEsc);
  }, [handleEsc]);

  const changelogUrl = `${Config.developersChangelogUrl}/?${utmParams}`;

  return (
    <WhatsNewContextProvider changelogUrl={changelogUrl}>
      <React.Fragment>
        <div className="nav-sidepanel-container">
          <div
            className={`nav-sidepanel__bg ${
              sidePanelIsShown ? 'nav-sidepanel__bg--is-visible' : ''
            }`}
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
        <SidepanelAppSwitcher
          appsList={appsList}
          isVisible={appSwitcherIsShown}
          onClose={() => setAppSwitcherIsShown(false)}
        />
        <SidePanelTrigger
          onClickOrganization={() => setSidePanelIsShown(true)}
          openAppSwitcher={() => setAppSwitcherIsShown(true)}
        />
      </React.Fragment>
    </WhatsNewContextProvider>
  );
};

export default SidepanelContainer;
