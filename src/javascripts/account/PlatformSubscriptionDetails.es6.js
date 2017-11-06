import {h} from 'ui/Framework';
import {runTask} from 'utils/Concurrent';
import {
  createMockEndpoint as createOrgEndpoint,
  getSubscription
} from 'access_control/OrganizationMembershipRepository';
import {default as subscriptionIcon} from 'svg/nav-organization-subscription';

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
        h('.workbench-header__icon', [subscriptionIcon]),
        h('h1.workbench-header__title', ['Subscription'])
      ])
    ]),
    h('.workbench-main', [
      h('.workbench-main__left-sidebar', [renderLeftSidebar(data)]),
      h('.workbench-main__right-content', {
        style: { padding: '20px 25px' }
      }, [renderContent(data)]),
      h('.workbench-main__sidebar', [renderRightSidebar()])
    ])
  ]);
}

function renderLeftSidebar ({name, type = 'team'}) {
  return h('div', [
    h('h2.pricing-heading', ['Your pricing plan']),
    h(`.pricing-plan.pricing-plan--${type}.pricing-tile`, [
      renderPricingPlanIcon({type}),
      h('p.pricing-heading', [name])
    ])
  ]);
}

function renderPricingPlanIcon () {
  return ''; // TODO!
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

function renderRightSidebar () {
  return h('.entity-sidebar', [
    h('h2.entity-sidebar__heading', ['Need help?']),
    h('p.entity-sidebar__help-text', ['Get help!'])
  ]);
}
