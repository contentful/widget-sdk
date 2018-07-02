import {h} from 'ui/Framework';
import spaceIcon from 'svg/space';
import folderIcon from 'svg/folder';
import SpaceWithEnvironments from './SpaceWithEnvironments';
import * as accessChecker from 'access_control/AccessChecker';

export default function (props) {
  const {currOrg, spacesByOrg, canCreateSpaceInCurrOrg, showCreateSpaceModal} = props;
  const spaces = currOrg && spacesByOrg[currOrg.sys.id];

  return h('.nav-sidepanel__spaces-container', [
    spaces && renderOrgSpacesHeader(canCreateSpaceInCurrOrg, showCreateSpaceModal),
    spaces && renderSpaceList({...props, spaces}),
    !spaces && renderNoSpacesMsg(canCreateSpaceInCurrOrg, showCreateSpaceModal)
  ]);
}

function renderOrgSpacesHeader (canCreateSpaceInCurrOrg, showCreateSpaceModal) {
  return h('.nav-sidepanel__spaces-header', [
    h('p.nav-sidepanel__spaces-header-heading', ['Spaces']),
    canCreateSpaceInCurrOrg && h('a.text-link', {
      onClick: showCreateSpaceModal,
      dataTestId: 'sidepanel-add-space-link'
    }, ['+ Add space'])
  ]);
}

function renderSpaceList (props) {
  const {
    spaces,
    currentSpaceId,
    currentEnvId,
    goToSpace,
    openedSpaceId,
    setOpenedSpaceId,
    environmentsEnabled
  } = props;

  return h('ul.nav-sidepanel__space-list', spaces.map((space, index) => {
    const isCurrSpace = space.sys.id === currentSpaceId;

    if (environmentsEnabled && accessChecker.can('manage', 'Environments')) {
      return h(SpaceWithEnvironments, {
        index,
        key: space.sys.id,
        space,
        isCurrSpace,
        currentEnvId,
        goToSpace,
        openedSpaceId,
        setOpenedSpaceId
      });
    }

    return h('li', {
      key: space.sys.id,
      className: `nav-sidepanel__space-list-item ${isCurrSpace ? 'nav-sidepanel__space-list-item--is-active' : ''}`,
      onClick: () => goToSpace(space.sys.id),
      dataTestId: `sidepanel-space-link-${index}`,
      dataTestGroupId: 'sidepanel-space-link',
      ariaSelected: isCurrSpace ? 'true' : 'false'
    }, [
      h('.nav-sidepanel__space-title', [
        h('div.nav-sidepanel__space-icon', [folderIcon]),
        h('span', {
          className: `u-truncate nav-sidepanel__space-name ${isCurrSpace ? 'nav-sidepanel__space-name--is-active' : ''}`
        }, [space.name])
      ])
    ]);
  }));
}

function renderNoSpacesMsg (canCreateSpaceInCurrOrg, showCreateSpaceModal) {
  return h('.nav-sidepanel__no-spaces', {dataTestId: 'sidepanel-no-spaces'}, [
    spaceIcon,
    h('p.nav-sidepanel__no-spaces-heading', [
      canCreateSpaceInCurrOrg
        ? 'Let’s go - create your first space!'
        : 'Uh oh! Nothing to see here'
    ]),
    h('p', [
      canCreateSpaceInCurrOrg
        ? 'A space is a place where you keep all the content related to a single project.'
        : 'Seems like you don’t have access to any of your organization’s spaces. Contact your organization admin to add you to spaces.'
    ]),
    canCreateSpaceInCurrOrg && h('button.btn-action nav-sidepanel__no-spaces-create-cta', {
      dataTestId: 'sidepanel-create-space-btn',
      onClick: showCreateSpaceModal
    }, ['Create Space'])
  ]);
}
