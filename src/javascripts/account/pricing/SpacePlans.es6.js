import {h} from 'ui/Framework';
import {runTask} from 'utils/Concurrent';
import {pick} from 'lodash';
import {createEndpoint as createOrgEndpoint} from 'access_control/OrganizationMembershipRepository';
import {getSpacesWithPlans} from 'account/pricing/PricingDataProvider';
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

  const spaces = yield getSpacesWithPlans(endpoint);
  const canCreateSpace = canCreateSpaceInOrganization(orgId);

  return {orgId, spaces, canCreateSpace};
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
        renderSpaces(pick(state, 'spaces'))
      ]),
      h('.workbench-main__sidebar', [
        renderRightSidebar(pick(state, 'canCreateSpace', 'spaces'), actions)
      ])
    ])
  ]);
}

function renderSpaces ({spaces}) {
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
          spaces.items.map(({sys, name, plan}) =>
            h('tr', [
              h('td', [h('a', {href: getSpaceLink(sys.id)}, [name])]),
              h('td', [plan ? plan.name : 'Free'])
            ])
          )
        )
      ])
    ])
  ]);
}

function renderRightSidebar ({canCreateSpace, spaces}, actions) {
  return h('.entity-sidebar', [
    h('h2.entity-sidebar__heading', ['Add space']),
    h('p.entity-sidebar__help-text', [`Your organization has ${spaces.items.length} spaces.`]),
    h('p.entity-sidebar__help-text', [
      h('button.btn-action.x--block', {
        onClick: actions.addSpace,
        disabled: !canCreateSpace
      }, [h('.btn-icon.cf-icon.cf-icon--plus.inverted', [svgPlus]), 'Add space'])
    ])
  ]);
}

function getSpaceLink (spaceId) {
  return href({path: ['spaces', 'detail'], params: {spaceId}});
}
