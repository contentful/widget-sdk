import {h} from 'ui/Framework';
import closeIcon from 'svg/close';
import settingsIcon from 'svg/settings';
import scaleSvg from 'utils/ScaleSvg';
import SidepanelOrgs from './SidepanelOrgs';
import SidepanelSpaces from './SidepanelSpaces';
import {byName as colors} from 'Styles/Colors';

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
    h('div', {
      className: `nav-sidepanel__org-actions-goto-settings ${viewingOrgSettings ? 'nav-sidepanel__org-actions-goto-settings--is-active' : ''}`,
      onClick: gotoOrgSettings,
      dataTestId: 'sidepanel-org-actions-settings',
      style: {display: 'flex'}
    }, [
      h('div', {
        style: {
          paddingTop: '2px',
          color: colors.elementDark,
          fill: 'currentColor'
        }
      }, [settingsIcon]),
      h('div', {
        style: {marginLeft: '7px'}
      }, ['Organization settings'])
    ])
  ]);
}

function renderCloseBtn (closeSidePanel) {
  return h('.nav-sidepanel__close-btn', {
    onClick: closeSidePanel,
    dataTestId: 'sidepanel-close-btn'
  }, [scaleSvg(closeIcon, 0.8)]);
}
