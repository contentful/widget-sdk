import {h} from 'ui/Framework';
import {runTask} from 'utils/Concurrent';
import {
  createMockEndpoint as createOrgEndpoint,
  getSubscription
} from 'access_control/OrganizationMembershipRepository';
import {getPricingPlanStyle} from 'account/PricingPlanStyles';

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
        h('.workbench-header__icon', [/* TODO missing icon */]),
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

function renderLeftSidebar ({productName, type = 'team-edition'}) {
  const style = getPricingPlanStyle(type);
  return h('div', [
    h('h2.pricing-heading', ['Your pricing plan']),
    h(`.pricing-plan.pricing-tile`, [
      h('.pricing-plan__bar', {style: style.bar}),
      style.icon,
      h('p.pricing-heading', [productName])
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

function renderRightSidebar () {
  return h('.entity-sidebar', [
    h('h2.entity-sidebar__heading', ['Need help?']),
    h('p.entity-sidebar__help-text', ['Get help!'])
  ]);
}
