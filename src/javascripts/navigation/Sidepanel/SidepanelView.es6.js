import {h} from 'ui/Framework';
import closeIcon from 'svg/close';
import scaleSvg from 'utils/ScaleSvg';
import SidepanelOrgs from './SidepanelOrgs';
import SidepanelSpaces from './SidepanelSpaces';

export default function (props) {
  const {sidePanelIsShown, orgDropdownIsShown, closeOrgsDropdown, closeSidePanel, currOrg} = props;

  return h('.nav-sidepanel-container', [
    h('div', {
      className: `nav-sidepanel__bg ${sidePanelIsShown ? 'nav-sidepanel__bg--is-visible' : ''}`,
      onClick: orgDropdownIsShown ? closeOrgsDropdown : closeSidePanel
    }),
    currOrg && renderSidepanel(props)
  ]);
}

function renderSidepanel (props) {
  const {
    sidePanelIsShown,
    closeOrgsDropdown,
    closeSidePanel,
    canGotoOrgSettings,
    gotoOrgSettings,
    viewingOrgSettings
  } = props;

  return h('div', {
    className: `nav-sidepanel ${sidePanelIsShown ? 'nav-sidepanel--is-active' : ''}`,
    ariaHidden: sidePanelIsShown ? '' : 'true',
    onClick: closeOrgsDropdown,
    dataTestId: 'sidepanel'
  }, [
    SidepanelOrgs(props),
    SidepanelSpaces(props),
    canGotoOrgSettings && renderOrgActions(gotoOrgSettings, viewingOrgSettings),
    renderCloseBtn(closeSidePanel)
  ]);
}

function renderOrgActions (gotoOrgSettings, viewingOrgSettings) {
  return h('.nav-sidepanel__org-actions', {
    dataTestId: 'sidepanel-org-actions'
  }, [
    h('div.nav-sidepanel__org-actions-separator-container', [
      h('div.nav-sidepanel__org-actions-separator')
    ]),
    h('p', {
      className: `nav-sidepanel__org-actions-goto-settings ${viewingOrgSettings ? 'nav-sidepanel__org-actions-goto-settings--is-active' : ''}`,
      onClick: gotoOrgSettings,
      dataTestId: 'sidepanel-org-actions-settings'
    }, [
      h('i.fa.fa-cog'),
      ' Organization settings'
    ])
  ]);
}

function renderCloseBtn (closeSidePanel) {
  return h('.nav-sidepanel__close-btn', {
    onClick: closeSidePanel,
    dataTestId: 'sidepanel-close-btn'
  }, [scaleSvg(closeIcon, 0.8)]);
}
