import {h} from 'ui/Framework';
import {runTask} from 'utils/Concurrent';
import {createMockEndpoint as createOrgEndpoint, getSubscription} from 'access_control/OrganizationMembershipRepository';

export default function ($scope) {
  $scope.component = h('noscript');
  const {properties} = $scope;

  let state = {orgId: ''};

  runTask(function* () {
    const nextState = yield loadStateFromProperties(properties);
    rerender(nextState);
  });

  function rerender (nextState) {
    $scope.properties.context.ready = true;
    state = nextState;
    $scope.component = render(state);
    $scope.$applyAsync();
  }
}

function loadStateFromProperties ({orgId}) {
  const endpoint = createOrgEndpoint(orgId);
  return getSubscription(endpoint);
}

function render (data) {
  return h('.workbench', [
    h('.workbench-header__wrapper', [
      h('header.workbench-header', [
        h('h1.workbench-header__title', ['Platform subscription'])
      ])
    ]),
    h('.workbench-main', [
      h('.workbench-main__content', {
        style: { padding: '20px 25px' }
      }, [renderContent(data)])
    ])
  ]);
}

function renderContent ({name, productName}) {
  return h('.table', [
    h('.table__head', [
      h('table', [
        h('thead', [
          h('tr', [h('th', ['Name']), h('th', ['Product Name'])])
        ])
      ])
    ]),
    h('.table__body', [
      h('table', [
        h('tbody', [
          h('tr', [h('td', [name]), h('td', [productName])])
        ])
      ])
    ])
  ]);
}
