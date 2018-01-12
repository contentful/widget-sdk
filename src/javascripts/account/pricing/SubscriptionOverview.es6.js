import {createElement as h} from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import {runTask} from 'utils/Concurrent';
import {createEndpoint as createOrgEndpoint} from 'access_control/OrganizationMembershipRepository';
import {getBasePlan, getSpacePlans} from 'account/pricing/PricingDataProvider';
import {getBasePlanStyle} from 'account/pricing/SubscriptionPlanStyles';
import {supportUrl, websiteUrl} from 'Config';
import {byName as colors} from 'Styles/Colors';
import {groupBy, pick} from 'lodash';
import {getOrganization} from 'services/TokenStore';
import {isOwnerOrAdmin} from 'services/OrganizationRoles';
import * as ReloadNotification from 'ReloadNotification';
import {asReact} from 'ui/Framework/DOMRenderer';
import {href as getStateHref} from 'states/Navigator';

const subscriptionOverviewPropTypes = {
  onReady: PropTypes.func.isRequired,
  onForbidden: PropTypes.func.isRequired,
  orgId: PropTypes.string.isRequired
};

const SubscriptionOverview = createReactClass({
  getInitialState: function () {
    return {
      basePlan: {},
      spacePlansByName: [],
      grandTotal: 0,
      subscriptionId: null
    };
  },
  componentWillMount: function () {
    runTask(this.fetchData);
  },
  fetchData: function* () {
    const {orgId, onReady, onForbidden} = this.props;

    const org = yield getOrganization(orgId);
    if (!isOwnerOrAdmin(org)) {
      onForbidden();
      return;
    }

    const endpoint = createOrgEndpoint(orgId);
    const [basePlan, spacePlans] = yield Promise.all([
      getBasePlan(endpoint),
      getSpacePlans(endpoint)
    ]).catch(ReloadNotification.apiErrorHandler);

    onReady();

    const spacePlansByName = Object.values(groupBy(spacePlans, 'productRatePlanId')).map((spacePlans) => ({
      count: spacePlans.length,
      price: calculateTotalPrice(spacePlans),
      name: spacePlans[0].name
    }));
    const grandTotal = calculateTotalPrice([...spacePlans, basePlan]);

    this.setState({basePlan, spacePlansByName, grandTotal, subscriptionId: org.subscription.sys.id});
  },
  render: function () {
    const {orgId} = this.props;
    const {basePlan, spacePlansByName, grandTotal, subscriptionId} = this.state;
    const unsubscribeLink = getUnsubscribeLink(orgId, subscriptionId);

    return h('div', {className: 'workbench'},
      h('div', {className: 'workbench-header__wrapper'},
        h('header', {className: 'workbench-header'},
          h('div', {className: 'workbench-header__icon'}), /* TODO missing icon */
          h('h1', {className: 'workbench-header__title'}, 'Subscription')
        )
      ),
      h('div', {className: 'workbench-main'},
        h('div', {
          className: 'workbench-main__left-sidebar',
          style: {padding: '1.2rem 0 0 1.5rem'}
        }, h(BasePlan, pick(basePlan, 'name', 'price'))),
        h('div', {
          className: 'workbench-main__right-content',
          style: {padding: '1.2rem 2rem'}
        }, h(SpacePlans, {spacePlansByName})),
        h('div', {
          className: 'workbench-main__sidebar'
        }, h(RightSidebar, {grandTotal, unsubscribeLink}))
      )
    );
  }
});

SubscriptionOverview.propTypes = subscriptionOverviewPropTypes;

// TODO: 'key' is not served by endpoint, but we need some key to choose icon
// and style for the pricing plan box
function BasePlan ({name, price, key = 'team-edition'}) {
  const basePlanStyle = getBasePlanStyle(key);
  return h('div', null,
    h('h2', {className: 'pricing-heading'}, 'Your pricing plan'),
    h('div', {
      className: 'pricing-plan pricing-tile',
      style: {paddingTop: '45px'}
    },
      h('div', {className: 'pricing-plan__bar', style: basePlanStyle.bar}),
      asReact(basePlanStyle.icon),
      h('h3', {className: 'pricing-heading'}, name),
      h(Price, {value: price})
    )
  );
}

function SpacePlans ({spacePlansByName}) {
  return h('div', null,
    h('h2', {className: 'pricing-heading'}, 'Your spaces'),
    h('div', {className: 'pricing-tiles-list'},
      spacePlansByName.map(({name, price, count}) =>
        h('div', {className: 'pricing-tile', key: name},
          h('h3', {className: 'pricing-heading'}, name),
          h(Price, {value: price}),
          h('p', null, `${count} ${pluralize(count, 'space')}`)
        )
      )
    )
  );
}

function RightSidebar ({grandTotal, unsubscribeLink}) {
  return h('div', {className: 'entity-sidebar'},
    h('h2', {className: 'entity-sidebar__heading'}, 'Grand total'),
    h('p', {className: 'entity-sidebar__help-text'},
      'Your grand total amounts to ',
      h('b', null, `$${grandTotal}`),
      ' / month.'
    ),

    h('h2', {className: 'entity-sidebar__heading'}, 'Need help?'),
    h('p', {className: 'entity-sidebar__help-text'},
      'Do you need to make changes to your pricing plan or purchase additional spaces? ' +
      'Don’t hesitate to talk to our customer success team.'
    ),
    h('p', {className: 'entity-sidebar__help-text.pricing-csm'},
      h('span', {className: 'pricing-csm__photo'}),
      h('span', {className: 'pricing-csm__photo'}),
      h('span', {className: 'pricing-csm__photo'})
    ),
    h('p', {className: 'entity-sidebar__help-text'},
      h('a', {href: supportUrl}, 'Get in touch with us')
    ),

    h('h2', {className: 'entity-sidebar__heading'}, 'Cancel subscription'),
    h('p', {className: 'entity-sidebar__help-text'},
      'Cancelling your subscription will delete your organization and all content ' +
      'associated with it. Make sure to ',
      h('a', {href: websiteUrl('pricing')}, 'check our pricing plans'),
      ' before proceeding.'
    ),
    h('p', {className: 'entity-sidebar__help-text'},
      h('a', {href: unsubscribeLink, style: {color: colors.redDark}}, 'Cancel subscription')
    )
  );
}

function Price ({value = 0, currency = '$', unit = 'month'}) {
  return h('p', {className: 'pricing-price'},
    h('span', {className: 'pricing-price__value'},
      h('span', {className: 'pricing-price__value__currency'}, currency),
      value.toLocaleString('en-US')
    ),
    h('span', {className: 'pricing-price__unit'}, `/${unit}`)
  );
}

function calculateTotalPrice (subscriptionPlans) {
  return subscriptionPlans.reduce((total, plan) => total + parseInt(plan.price, 10), 0);
}

function getUnsubscribeLink (orgId, subscriptionId) {
  return getStateHref({
    path: ['account', 'organizations', 'subscription'],
    params: {orgId, pathSuffix: `/${subscriptionId}/cancel`}
  });
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

export default SubscriptionOverview;
