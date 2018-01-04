import {h} from 'ui/Framework';
import {runTask} from 'utils/Concurrent';
import {createEndpoint as createOrgEndpoint} from 'access_control/OrganizationMembershipRepository';
import {getBasePlan, getSpacePlans} from 'account/pricing/PricingDataProvider';
import {getBasePlanStyle} from 'account/pricing/SubscriptionPlanStyles';
import {supportUrl, websiteUrl} from 'Config';
import {byName as colors} from 'Styles/Colors';
import {groupBy} from 'lodash';

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
  const [basePlan, spacePlans] = yield Promise.all([
    getBasePlan(endpoint),
    getSpacePlans(endpoint)
  ]);
  const spacePlansByName = Object.values(groupBy(spacePlans, 'productRatePlanId')).map((spacePlans) => ({
    count: spacePlans.length,
    price: calculateTotalPrice(spacePlans),
    name: spacePlans[0].name
  }));
  const grandTotal = calculateTotalPrice([...spacePlans, basePlan]);

  return {basePlan, spacePlansByName, grandTotal};
}

function calculateTotalPrice (subscriptionPlans) {
  return subscriptionPlans.reduce((total, plan) => total + parseInt(plan.price, 10), 0);
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
      h('.workbench-main__left-sidebar', {
        style: {padding: '1.2rem 0 0 1.5rem'}
      }, [renderBasePlan(state.basePlan)]),
      h('.workbench-main__right-content', {
        style: {padding: '1.2rem 2rem'}
      }, [renderSpacePlans(state.spacePlansByName)]),
      h('.workbench-main__sidebar', [renderRightSidebar(state)])
    ])
  ]);
}

// TODO: 'key' is not served by endpoint, but we need some key to choose icon
// and style for the pricing plan box
function renderBasePlan ({name, price, key = 'team-edition'}) {
  const basePlanStyle = getBasePlanStyle(key);
  return h('div', [
    h('h2.pricing-heading', ['Your pricing plan']),
    h(`.pricing-plan.pricing-tile`, {
      style: {paddingTop: '45px'}
    }, [
      h('.pricing-plan__bar', {style: basePlanStyle.bar}),
      basePlanStyle.icon,
      h('h3.pricing-heading', [name]),
      renderPrice(price)
    ])
  ]);
}

function renderSpacePlans (spacePlansByName) {
  return h('div', [
    h('h2.pricing-heading', ['Your spaces']),
    h('.pricing-tiles-list',
      spacePlansByName.map(({name, price, count}) =>
        h('.pricing-tile', [
          h('h3.pricing-heading', [name]),
          renderPrice(price),
          h('p', [`${count} ${pluralize(count, 'space')}`])
        ])
      )
    )
  ]);
}

function renderRightSidebar ({grandTotal}) {
  return h('.entity-sidebar', [
    h('h2.entity-sidebar__heading', ['Grand total']),
    h('p.entity-sidebar__help-text', [
      'Your grand total amounts to ',
      h('b', [`$${grandTotal}`]),
      ' / month.'
    ]),

    h('h2.entity-sidebar__heading', ['Need help?']),
    h('p.entity-sidebar__help-text', [
      'Do you need to make changes to your pricing plan or purchase additional spaces? ' +
      'Don’t hesitate to talk to our customer success team.'
    ]),
    h('p.entity-sidebar__help-text.pricing-csm', [
      h('span.pricing-csm__photo'),
      h('span.pricing-csm__photo'),
      h('span.pricing-csm__photo')
    ]),
    h('p.entity-sidebar__help-text', [
      h('a', {href: supportUrl}, ['Get in touch with us'])
    ]),

    h('h2.entity-sidebar__heading', ['Cancel subscription']),
    h('p.entity-sidebar__help-text', [
      'Cancelling your subscription will delete your organization and all content ' +
      'associated with it. Make sure to ',
      h('a', {href: websiteUrl('pricing')}, ['check our pricing plans']),
      ' before proceeding.'
    ]),
    h('p.entity-sidebar__help-text', [
      h('a', {href: '#', style: {color: colors.redDark}}, ['Cancel subscription'])
    ])
  ]);
}

function renderPrice (value, currency = '$', unit = 'month') {
  return h('p.pricing-price', [
    h('span.pricing-price__value', [
      h('span.pricing-price__value__currency', [currency]),
      value.toLocaleString('en-US')
    ]),
    h('span.pricing-price__unit', [`/${unit}`])
  ]);
}

/**
 * Receives amount of items, singular name of item and optionally plural name.
 * Returns singular or plural name for given amount based on grammar rules.
 * e.g.
 * pluralize(2, 'apple') // apples
 * pluralize(101, 'apple') // apple
 * pluralize(2, 'person', 'people') // people
 *
 * TODO move to string utils
 */
function pluralize (amount, singular, plural) {
  return amount % 10 === 1 ? singular : plural || singular + 's';
}
