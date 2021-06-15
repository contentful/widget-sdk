import React, { useEffect, useState, useCallback, MouseEvent } from 'react';
import { css, cx } from 'emotion';
import { WhatsNewContextProvider } from '@contentful/experience-components';
import tokens from '@contentful/forma-36-tokens';

import * as Config from 'Config';
import keycodes from 'utils/keycodes';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';
import { useAppsList } from './useAppsList';
import { SidePanelTrigger } from './SidePanelTrigger/SidePanelTrigger';
import { Sidepanel } from './Sidepanel';
import { SidepanelAppSwitcher } from './SidepanelAppSwitcher';

const styles = {
  sidepanelContainer: css({
    position: 'absolute',
    zIndex: 1000,
  }),
  sidepanelBG: css({
    position: 'absolute',
    width: '100vw',
    height: '100vh',
    backgroundColor: tokens.colorContrastDark,
    opacity: 0,
    transition: `all ${tokens.transitionDurationDefault} ${tokens.transitionEasingDefault}`,
    visibility: 'hidden',
  }),
  isVisible: css({
    opacity: 0.75,
    visibility: 'visible',
  }),
};

const urlWithUtm = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'app-switcher',
  campaign: 'in-app-help',
});

export function SidepanelContainer({
  triggerText,
  currentAliasId,
  currentEnvId,
  currentOrgId,
  currentSpaceId,
}: {
  triggerText?: React.ReactNode;
  currentSpaceId?: string;
  currentEnvId?: string;
  currentAliasId?: string;
  currentOrgId?: string;
}) {
  const [sidePanelIsShown, setSidePanelIsShown] = useState(false);
  const [orgDropdownIsShown, setOrgDropdownIsShown] = useState(false);
  const [appSwitcherIsShown, setAppSwitcherIsShown] = useState(false);
  const { appsList } = useAppsList();

  const closeDropdownOrPanel = useCallback(() => {
    if (orgDropdownIsShown) {
      setOrgDropdownIsShown(false);
    } else {
      setSidePanelIsShown(false);
    }
  }, [orgDropdownIsShown]);

  const handleEsc = useCallback(
    (ev) => {
      if (ev.keyCode === keycodes.ESC) {
        closeDropdownOrPanel();
      }
    },
    [closeDropdownOrPanel]
  );

  useEffect(() => {
    window.addEventListener('keyup', handleEsc);

    return () => window.removeEventListener('keyup', handleEsc);
  }, [handleEsc]);

  const changelogUrl = urlWithUtm(Config.developersChangelogUrl);

  return (
    <>
      <div className={styles.sidepanelContainer}>
        <div
          data-test-id="close-sidepanel-bg"
          className={cx(styles.sidepanelBG, { [styles.isVisible]: sidePanelIsShown })}
          onClick={closeDropdownOrPanel}
        />

        <Sidepanel
          currentAliasId={currentAliasId}
          currentEnvId={currentEnvId}
          currentOrgId={currentOrgId}
          currentSpaceId={currentSpaceId}
          sidePanelIsShown={sidePanelIsShown}
          orgDropdownIsShown={orgDropdownIsShown}
          openOrgsDropdown={(event: MouseEvent) => {
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

      <WhatsNewContextProvider changelogUrl={changelogUrl}>
        <>
          <SidepanelAppSwitcher
            appsList={appsList}
            isVisible={appSwitcherIsShown}
            onClose={() => setAppSwitcherIsShown(false)}
          />
          <SidePanelTrigger
            triggerText={triggerText}
            onClickOrganization={() => setSidePanelIsShown(true)}
            openAppSwitcher={() => setAppSwitcherIsShown(true)}
          />
        </>
      </WhatsNewContextProvider>
    </>
  );
}
