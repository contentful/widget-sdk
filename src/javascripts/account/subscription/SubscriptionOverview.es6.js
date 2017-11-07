import {h} from 'ui/Framework';
import {runTask} from 'utils/Concurrent';
import {
  createMockEndpoint as createOrgEndpoint,
  getPlatformSubscriptionPlan
} from 'access_control/OrganizationMembershipRepository';
import {getPlatformPlanStyle} from 'account/subscription/PlatformPlanStyles';

export default function ($scope) {
  $scope.component = h('noscript');
  const {properties} = $scope;

  let state = {orgId: ''};

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
  const platformPlan = yield getPlatformSubscriptionPlan(endpoint);

  // TODO get the data from endpoint(s)
  const spacePlans = Array(4).fill({});
  const usersPlan = {};

  return {platformPlan, spacePlans, usersPlan};
}

function render (state) {
  return h('.workbench', [
    h('.workbench-header__wrapper', [
      h('header.workbench-header', [
        h('.workbench-header__icon', [/* TODO missing icon */]),
        h('h1.workbench-header__title', ['Subscription'])
      ])
    ]),
    h('.workbench-main', [
      h('.workbench-main__left-sidebar', [renderPlatformPlan(state.platformPlan)]),
      h('.workbench-main__right-content', {
        style: { padding: '20px 25px' }
      }, [renderSpacesAndUsers(state)]),
      h('.workbench-main__sidebar', [renderRightSidebar()])
    ])
  ]);
}

// TODO: 'type' is not served by endpoint, but we need some key to choose icon
// and style for the pricing plan box
function renderPlatformPlan ({productName, type = 'team-edition'}) {
  const platformStyle = getPlatformPlanStyle(type);
  return h('div', [
    h('h2.pricing-heading', ['Your pricing plan']),
    h(`.pricing-plan.pricing-tile`, [
      h('.pricing-plan__bar', {style: platformStyle.bar}),
      platformStyle.icon,
      h('h3.pricing-heading', [productName])
    ])
  ]);
}

function renderSpacesAndUsers ({spacePlans, usersPlan}) {
  return h('div', [
    h('h2.pricing-heading', ['Your spaces & users']),
    h('.pricing-tiles-list', [...spacePlans.map(renderSpacePlan), renderUsersPlan(usersPlan)])
  ]);
}

// TODO: these two functions don't get actual data and design may yet change

function renderSpacePlan ({productName = 'X-Large'}) {
  return h('.pricing-tile', [
    h('h3.pricing-heading', [productName])
  ]);
}

function renderUsersPlan () {
  return h('.pricing-tile', [
    h('h3.pricing-heading', ['Users'])
  ]);
}

function renderRightSidebar () {
  return h('.entity-sidebar', [
    h('h2.entity-sidebar__heading', ['Need help?']),
    h('p.entity-sidebar__help-text', ['Get help!'])
  ]);
}
