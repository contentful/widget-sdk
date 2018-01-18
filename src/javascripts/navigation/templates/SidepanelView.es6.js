import { h } from 'ui/Framework';
import closeIcon from 'svg/close';
import spaceIcon from 'svg/space';
import scaleSvg from 'utils/ScaleSvg';

export default function (props) {
  return h('.nav-sidepanel-container', [
    renderSidepanelBackground(props),
    renderSidepanel(props)
  ]);
}

function renderSidepanelBackground ({sidePanelIsShown, orgDropdownIsShown, closeOrgsDropdown, closeSidePanel}) {
  const activeClassNames = 'nav-sidepanel__bg nav-sidepanel__bg--is-visible';
  const inactiveClassNames = 'nav-sidepanel__bg';

  return h('div', {
    onClick: orgDropdownIsShown ? closeOrgsDropdown : closeSidePanel,
    className: sidePanelIsShown ? activeClassNames : inactiveClassNames
  });
}

function renderSidepanel ({
  sidePanelIsShown,
  closeSidePanel,
  gotoOrgSettings,
  canGotoOrgSettings,
  viewingOrgSettings,
  spacesByOrg,
  currOrg,
  currSpace,
  orgs,
  setAndGotoSpace,
  canCreateSpaceInCurrOrg,
  showCreateSpaceModal,
  openOrgsDropdown,
  setCurrOrg,
  orgDropdownIsShown,
  closeOrgsDropdown,
  canCreateOrg,
  createNewOrg
}) {
  if (!currOrg) return;

  return h('div', {
    className: sidePanelIsShown ? 'nav-sidepanel nav-sidepanel--is-active' : ' nav-sidepanel',
    ariaHidden: sidePanelIsShown ? '' : 'true',
    onClick: closeOrgsDropdown,
    dataTestId: 'sidepanel'
  }, [
    renderOrganizationSelector({currOrg, openOrgsDropdown, orgDropdownIsShown}),
    renderOrgListDropdown({orgs, setCurrOrg, orgDropdownIsShown, currOrg, canCreateOrg, createNewOrg}),
    renderOrgSpaces({spacesByOrg, currOrg, currSpace, setAndGotoSpace, canCreateSpaceInCurrOrg, showCreateSpaceModal}),
    renderOrgActions({canGotoOrgSettings, gotoOrgSettings, viewingOrgSettings}),
    renderCloseBtn({closeSidePanel})
  ]);
}

function renderOrganizationSelector ({currOrg, openOrgsDropdown, orgDropdownIsShown}) {
  const activeClassNames = 'nav-sidepanel__header nav-sidepanel__header--is-active';
  const inactiveClassNames = 'nav-sidepanel__header';
  const twoLetterOrgName = currOrg.name.slice(0, 2).toUpperCase();

  return h('div', {
    className: orgDropdownIsShown ? activeClassNames : inactiveClassNames,
    dataTestId: 'sidepanel-header',
    onClick: (event) => openOrgsDropdown(event)
  }, [
    h('p.nav-sidepanel__org-img', {
      dataTestId: 'sidepanel-header-org-icon'
    }, [twoLetterOrgName]),
    h('.nav-sidepanel__org-selector-container', [
      h('.nav-sidepanel__org-selector', {
        dataTestId: 'sidepanel-org-selector'
      }, [
        h('p.nav-sidepanel__org-selector-heading', ['Organization']),
        h('p.nav-sidepanel__org-selector-current-org', {
          dataTestId: 'sidepanel-header-curr-org',
          title: currOrg.name
        }, [currOrg.name])
      ])
    ]),
    h('span')
  ]);
}

function renderOrgListDropdown ({orgs, setCurrOrg, orgDropdownIsShown, currOrg, canCreateOrg, createNewOrg}) {
  const activeClassNames = 'nav-sidepanel__org-list-container nav-sidepanel__org-list-container--is-visible';
  const inactiveClassNames = 'nav-sidepanel__org-list-container';

  return h('div', {
    className: orgDropdownIsShown ? activeClassNames : inactiveClassNames,
    ariaHidden: orgDropdownIsShown ? '' : 'true',
    dataTestId: 'sidepanel-org-list'
  }, [
    h('.nav-sidepanel__org-list', [
      h('p.nav-sidepanel__org-list-heading', ['Organizations'])
    ].concat(
      orgs && orgs.map((org, index) => {
        const activeClassNames = 'nav-sidepanel__org-name nav-sidepanel__org-name--is-active u-truncate';
        const inactiveClassNames = 'nav-sidepanel__org-name u-truncate';

        return h('p', {
          className: currOrg.sys.id === org.sys.id ? activeClassNames : inactiveClassNames,
          onClick: () => setCurrOrg(org),
          dataTestId: `sidepanel-org-link-${index}`,
          dataTestGroupId: 'sidepanel-org-link'
        }, [org.name]);
      })
    )),
    (canCreateOrg && h('a.text-link.nav-sidepanel__org-create-cta', {
      onClick: createNewOrg,
      dataTestId: 'sidepanel-create-org-link'
    }, ['+ Create organization']))
  ]);
}

function addSpaceHeaderLink ({canCreateSpaceInCurrOrg, showCreateSpaceModal, currOrg}) {
  if (canCreateSpaceInCurrOrg) {
    return h('a.text-link', {
      onClick: () => showCreateSpaceModal(currOrg.sys.id),
      dataTestId: 'sidepanel-add-space-link'
    }, [
      h('span', ['+ Add space'])
    ]);
  }
}

function renderOrgSpacesHeader ({spacesByCurrentOrg, currOrg, canCreateSpaceInCurrOrg, showCreateSpaceModal}) {
  if (spacesByCurrentOrg) {
    return h('.nav-sidepanel__spaces-header', [
      h('p.nav-sidepanel__spaces-header-heading', ['Spaces']),
      addSpaceHeaderLink({canCreateSpaceInCurrOrg, showCreateSpaceModal, currOrg})
    ]);
  }
}

function renderOrgSpaces ({spacesByOrg, currOrg, currSpace, setAndGotoSpace, canCreateSpaceInCurrOrg, showCreateSpaceModal}) {
  const spacesByCurrentOrg = spacesByOrg[currOrg.sys.id];

  if (!currOrg) return;

  return h('.nav-sidepanel__spaces-container', [
    renderOrgSpacesHeader({spacesByCurrentOrg, currOrg, canCreateSpaceInCurrOrg, showCreateSpaceModal}),
    h('.nav-sidepanel__space-list', [
      ...renderSpacesByOrg({currSpace, spacesByCurrentOrg, setAndGotoSpace}),
      renderNoSpacesMsg({spacesByCurrentOrg, currOrg, canCreateSpaceInCurrOrg, showCreateSpaceModal})
    ])
  ]);
}

function renderSpacesByOrg ({currSpace, spacesByCurrentOrg, setAndGotoSpace}) {
  const inactiveClassNames = 'nav-sidepanel__space-name u-truncate';
  const activeClassNames = 'nav-sidepanel__space-name nav-sidepanel__space-name--is-active u-truncate';

  if (spacesByCurrentOrg) {
    return spacesByCurrentOrg.map((space, index) => {
      const isCurrSpace = currSpace && currSpace.sys.id === space.sys.id;

      return h('p', {
        className: isCurrSpace ? activeClassNames : inactiveClassNames,
        onClick: () => setAndGotoSpace(space),
        dataTestId: `sidepanel-space-link-${index}`,
        dataTestGroupId: 'sidepanel-space-link',
        ariaSelected: isCurrSpace ? 'true' : 'false'
      }, [space.name]);
    });
  }
}

function renderNoSpacesMsg ({spacesByCurrentOrg, currOrg, canCreateSpaceInCurrOrg, showCreateSpaceModal}) {
  const messages = {
    canCreateSpace: {
      title: 'Let’s go - create your first space!',
      text: 'A space is a place where you keep all the content related to a single project.'
    },
    canNotCreateSpace: {
      title: 'Uh oh! Nothing to see here',
      text: 'Seems like you don’t have access to any of your organization’s spaces. Contact your organization admin to add you to spaces.'
    }
  };

  if (!spacesByCurrentOrg) {
    return h('.nav-sidepanel__no-spaces', {
      dataTestId: 'sidepanel-no-spaces'
    }, [
      spaceIcon,
      h('p.nav-sidepanel__no-spaces-heading', [canCreateSpaceInCurrOrg ? messages.canCreateSpace.title : messages.canNotCreateSpace.title]),
      h('p', [canCreateSpaceInCurrOrg ? messages.canCreateSpace.text : messages.canNotCreateSpace.text]),
      (canCreateSpaceInCurrOrg && h('button.btn-action.nav-sidepanel__no-spaces-create-cta', {
        dataTestId: 'sidepanel-create-space-btn',
        onClick: () => showCreateSpaceModal(currOrg.sys.id)
      }, ['Create Space']))
    ]);
  }
}

function renderOrgActions ({canGotoOrgSettings, gotoOrgSettings, viewingOrgSettings}) {
  const separator = h('div.nav-sidepanel__org-actions-separator-container', [
    h('div.nav-sidepanel__org-actions-separator')
  ]);

  if (canGotoOrgSettings) {
    return h('.nav-sidepanel__org-actions', {
      dataTestId: 'sidepanel-org-actions'
    }, [
      separator,
      h('p', {
        onClick: gotoOrgSettings,
        dataTestId: 'sidepanel-org-actions-settings',
        className: viewingOrgSettings ? 'nav-sidepanel__org-actions-goto-settings nav-sidepanel__org-actions-goto-settings--is-active' : 'nav-sidepanel__org-actions-goto-settings'
      }, ['Organization settings'])
    ]);
  }
}

function renderCloseBtn ({closeSidePanel}) {
  return h('.nav-sidepanel__close-btn', {
    onClick: closeSidePanel,
    dataTestId: 'sidepanel-close-btn'
  }, [
    scaleSvg(closeIcon, 0.8)
  ]);
}
