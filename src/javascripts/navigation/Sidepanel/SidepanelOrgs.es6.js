import {h} from 'ui/Framework';

export default function (props) {
  return h('div', [
    renderOrganizationSelector(props),
    renderOrgListDropdown(props)
  ]);
}

function renderOrganizationSelector ({currOrg, openOrgsDropdown, orgDropdownIsShown}) {
  return h('div', {
    className: `nav-sidepanel__header ${orgDropdownIsShown ? 'nav-sidepanel__header--is-active' : ''}`,
    dataTestId: 'sidepanel-header',
    onClick: openOrgsDropdown
  }, [
    h('p.nav-sidepanel__org-img', {
      dataTestId: 'sidepanel-header-org-icon'
    }, [
      currOrg.name.slice(0, 2).toUpperCase()
    ]),
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
    ])
  ]);
}

function renderOrgListDropdown ({orgs, setCurrOrg, orgDropdownIsShown, currOrg, canCreateOrg, createNewOrg}) {
  return h('div', {
    className: `nav-sidepanel__org-list-container ${orgDropdownIsShown ? 'nav-sidepanel__org-list-container--is-visible' : ''}`,
    ariaHidden: orgDropdownIsShown ? '' : 'true',
    dataTestId: 'sidepanel-org-list'
  }, [
    h('.nav-sidepanel__org-list', [
      h('p.nav-sidepanel__org-list-heading', ['Organizations'])
    ].concat((orgs || []).map((org, index) => {
      return h('p', {
        className: `nav-sidepanel__org-name u-truncate ${currOrg.sys.id === org.sys.id ? 'nav-sidepanel__org-name--is-active' : ''}`,
        onClick: () => setCurrOrg(org),
        dataTestId: `sidepanel-org-link-${index}`,
        dataTestGroupId: 'sidepanel-org-link'
      }, [org.name]);
    }))),
    canCreateOrg && h('a.text-link.nav-sidepanel__org-create-cta', {
      onClick: createNewOrg,
      dataTestId: 'sidepanel-create-org-link'
    }, ['+ Create organization'])
  ]);
}
