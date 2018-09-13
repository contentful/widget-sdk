import { h } from 'ui/Framework';
import closeIcon from 'svg/close.es6';
import settingsIcon from 'svg/settings.es6';
import SidepanelOrgs from './SidepanelOrgs.es6';
import SidepanelSpaces from './SidepanelSpaces.es6';
import SidepanelNoOrgs from './SidepanelNoOrgs.es6';

export default function(props) {
  const { sidePanelIsShown, orgDropdownIsShown, closeOrgsDropdown, closeSidePanel } = props;

  return h('.nav-sidepanel-container', [
    h('div', {
      className: `nav-sidepanel__bg ${sidePanelIsShown ? 'nav-sidepanel__bg--is-visible' : ''}`,
      onClick: orgDropdownIsShown ? closeOrgsDropdown : closeSidePanel
    }),
    renderSidepanel(props)
  ]);
}

function renderSidepanel(props) {
  const {
    sidePanelIsShown,
    closeOrgsDropdown,
    closeSidePanel,
    canGotoOrgSettings,
    gotoOrgSettings,
    viewingOrgSettings,
    currOrg
  } = props;

  return h(
    'div',
    {
      className: `nav-sidepanel ${sidePanelIsShown ? 'nav-sidepanel--is-active' : ''}`,
      ariaHidden: sidePanelIsShown ? '' : 'true',
      onClick: closeOrgsDropdown,
      dataTestId: 'sidepanel'
    },
    [
      currOrg && SidepanelOrgs(props),
      currOrg && SidepanelSpaces(props),
      !currOrg && SidepanelNoOrgs(props),
      canGotoOrgSettings && renderOrgActions(gotoOrgSettings, viewingOrgSettings),
      renderCloseBtn(closeSidePanel)
    ]
  );
}

function renderOrgActions(gotoOrgSettings, viewingOrgSettings) {
  return h(
    '.nav-sidepanel__org-actions',
    {
      dataTestId: 'sidepanel-org-actions'
    },
    [
      h('div.nav-sidepanel__org-actions-separator-container', [
        h('div.nav-sidepanel__org-actions-separator')
      ]),
      h(
        'div',
        {
          className: `nav-sidepanel__org-actions-goto-settings ${
            viewingOrgSettings ? 'nav-sidepanel__org-actions-goto-settings--is-active' : ''
          }`,
          onClick: gotoOrgSettings,
          dataTestId: 'sidepanel-org-actions-settings'
        },
        [
          h('.nav-sidepanel__org-title', [
            h('.nav-sidepanel__org-icon', [settingsIcon]),
            h('span', ['Organization settings'])
          ])
        ]
      )
    ]
  );
}

function renderCloseBtn(closeSidePanel) {
  return h(
    '.nav-sidepanel__close-btn',
    {
      onClick: closeSidePanel,
      dataTestId: 'sidepanel-close-btn'
    },
    [closeIcon]
  );
}
