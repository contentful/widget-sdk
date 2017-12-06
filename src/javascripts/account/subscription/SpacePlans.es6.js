import {h} from 'ui/Framework';
import {runTask} from 'utils/Concurrent';
import {
  createEndpoint as createOrgEndpoint,
  getSpacePlans
} from 'access_control/OrganizationMembershipRepository';

export default function ($scope) {
  $scope.component = h('noscript');
  const {properties} = $scope;

  let state = {orgId: '', spaces: []};

  runTask(function* () {
    const nextState = yield* loadStateFromProperties(properties);
    rerender(nextState);
  });

  function rerender (nextState) {
    $scope.properties.context.ready = true;
    state = nextState;
    $scope.component = render(state);
    $scope.$applyAsync();
  }
}

function* loadStateFromProperties ({orgId}) {
  const endpoint = createOrgEndpoint(orgId);
  const spacePlans = yield getSpacePlans(endpoint);
  return {orgId, spacePlans};
}

function render ({spacePlans, orgId}) {
  return h('.workbench', [
    h('.workbench-header__wrapper', [
      h('header.workbench-header', [
        h('.workbench-header__icon', [/* TODO missing icon */]),
        h('h1.workbench-header__title', ['Spaces'])
      ])
    ]),
    h('.workbench-main', [
      h('.workbench-main__content', {
      }, [renderSpacePlans(spacePlans.items)]),
      h('.workbench-main__sidebar', [renderRightSidebar(orgId)])
    ])
  ]);
}

function renderSpacePlans (spacePlans) {
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
          spacePlans.map(({space, name}) => h('tr', [h('td', [space.name]), h('td', [name])]))
        )
      ])
    ])
  ]);
}

function renderRightSidebar (orgId) {
  return h('.entity-sidebar', [
    h('h2.entity-sidebar__heading', ['Add space']),
    h('p.entity-sidebar__help-text', [`Add space to org ${orgId}`])
  ]);
}
