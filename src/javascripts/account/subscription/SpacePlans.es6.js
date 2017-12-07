import {h} from 'ui/Framework';
import {runTask} from 'utils/Concurrent';
import {pick} from 'lodash';
import {
  createEndpoint as createOrgEndpoint,
  getSpacePlans
} from 'access_control/OrganizationMembershipRepository';
import {href} from 'states/Navigator';
import svgPlus from 'svg/plus';
import {showDialog as showCreateSpaceModal} from 'services/CreateSpace';
import {canCreateSpaceInOrganization} from 'accessChecker';

export default function ($scope) {
  $scope.component = h('noscript');
  const {properties} = $scope;

  let state = {};
  const actions = {
    addSpace: () => { showCreateSpaceModal(state.orgId); }
  };

  runTask(function* () {
    const nextState = yield* loadStateFromProperties(properties);
    rerender(nextState);
  });

  function rerender (nextState) {
    $scope.properties.context.ready = true;
    state = nextState;
    $scope.component = render(state, actions);
    $scope.$applyAsync();
  }
}

function* loadStateFromProperties ({orgId}) {
  const endpoint = createOrgEndpoint(orgId);
  const {items: spacePlans} = yield getSpacePlans(endpoint);
  const canCreateSpace = canCreateSpaceInOrganization(orgId);

  return {orgId, spacePlans, canCreateSpace};
}

function render (state, actions) {
  return h('.workbench', [
    h('.workbench-header__wrapper', [
      h('header.workbench-header', [
        h('.workbench-header__icon', [/* TODO missing icon */]),
        h('h1.workbench-header__title', ['Spaces'])
      ])
    ]),
    h('.workbench-main', [
      h('.workbench-main__content', [
        renderSpacePlans(pick(state, 'spacePlans'))
      ]),
      h('.workbench-main__sidebar', [
        renderRightSidebar(pick(state, 'canCreateSpace', 'spacePlans'), actions)
      ])
    ])
  ]);
}

function renderSpacePlans ({spacePlans}) {
  return h('.table', [
    h('.table__head', [
      h('table', [
        h('thead', [
          h('tr', [h('th', ['Name']), h('th', ['Plan'])])
        ])
      ])
    ]),
    h('.table__body', [
      h('table', [
        h('tbody',
          spacePlans.map(({space, name}) =>
            h('tr', [
              h('td', [h('a', {href: getSpaceLink(space.sys.id)}, [space.name])]),
              h('td', [name])
            ])
          )
        )
      ])
    ])
  ]);
}

function renderRightSidebar ({canCreateSpace, spacePlans}, actions) {
  return h('.entity-sidebar', [
    h('h2.entity-sidebar__heading', ['Add space']),
    h('p.entity-sidebar__help-text', [`Your organization has ${spacePlans.length} spaces.`]),
    h('p.entity-sidebar__help-text', [
      // TODO get rid of cf-icon after svg styles are refactored
      h('button.btn-action.x--block', {
        onClick: actions.addSpace,
        disabled: !canCreateSpace
      }, [h('cf-icon.btn-icon.inverted', {name: 'plus'}, [svgPlus]), 'Add space'])
    ])
  ]);
}

function getSpaceLink (spaceId) {
  return href({path: ['spaces', 'detail'], params: {spaceId}});
}
