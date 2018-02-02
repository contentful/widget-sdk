import {createElement as h} from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import {runTask} from 'utils/Concurrent';
import {createEndpoint as createOrgEndpoint} from 'access_control/OrganizationMembershipRepository';
import {getPlansWithSpaces} from 'account/pricing/PricingDataProvider';
import {supportUrl} from 'Config';
import {getOrganization} from 'services/TokenStore';
import {isOwnerOrAdmin} from 'services/OrganizationRoles';
import * as ReloadNotification from 'ReloadNotification';
import {go, href} from 'states/Navigator';

const subscriptionOverviewPropTypes = {
  onReady: PropTypes.func.isRequired,
  onForbidden: PropTypes.func.isRequired,
  orgId: PropTypes.string.isRequired
};

const SubscriptionOverview = createReactClass({
  getInitialState: function () {
    return {
      basePlan: {},
      spacePlans: [],
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
    const plans = yield getPlansWithSpaces(endpoint).catch(ReloadNotification.apiErrorHandler);

    onReady();

    const basePlan = plans.items.find(({planType}) => planType === 'base');
    const spacePlans = plans.items.filter(({planType}) => planType === 'space');

    const grandTotal = calculateTotalPrice(spacePlans);

    this.setState({basePlan, spacePlans, grandTotal});
  },
  render: function () {
    const {basePlan, spacePlans, grandTotal} = this.state;

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
        }, h(BasePlan, basePlan)),
        h('div', {
          className: 'workbench-main__right-content',
          style: {padding: '1.2rem 2rem'}
        }, h(SpacePlans, {spacePlans})),
        h('div', {
          className: 'workbench-main__sidebar'
        }, h(RightSidebar, {grandTotal}))
      )
    );
  }
});

SubscriptionOverview.propTypes = subscriptionOverviewPropTypes;

function BasePlan ({name, ratePlanCharges = []}) {
  const enabledFeatures = ratePlanCharges.filter(({unitType}) => unitType === 'feature');
  return h('div', null,
    h('h2', {className: 'pricing-heading'}, 'Your pricing plan'),
    h('div', {
      className: 'pricing-plan pricing-tile',
      style: {paddingTop: '45px'}
    },
      h('div', {className: 'pricing-plan__bar'}),
      h('h3', {className: 'pricing-heading'}, name),
      h('h3', {className: 'pricing-heading'}, 'Enabled features:'),
      h('ul', null,
        enabledFeatures.map(({name}) => h('li', {key: name}, name)),
        !enabledFeatures.length && h('li', null, '(none)')
      )
    )
  );
}

function SpacePlans ({spacePlans}) {
  return h('div', null,
    h('h2', {className: 'pricing-heading'}, 'Your spaces'),
    h('div', {className: 'pricing-tiles-list'},
      spacePlans.map(({name, price, space}) => {
        const navState = getSpaceNavState(space.sys.id);
        return h('div', {
          className: 'pricing-tile',
          key: space.sys.id,
          onClick: () => go(navState)
        },
          h('h3', {className: 'pricing-heading'}, h('a', {href: href(navState)}, space.name)),
          h('h3', {className: 'pricing-heading'}, name),
          h(Price, {value: price})
        );
      })
    )
  );
}

function RightSidebar ({grandTotal}) {
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
    h('p', {className: 'entity-sidebar__help-text pricing-csm'},
      h('span', {className: 'pricing-csm__photo'}),
      h('span', {className: 'pricing-csm__photo'}),
      h('span', {className: 'pricing-csm__photo'})
    ),
    h('p', {className: 'entity-sidebar__help-text'},
      h('a', {href: supportUrl}, 'Get in touch with us')
    )
  );
}

function Price ({value = 0, currency = '$', unit = 'month'}) {
  return h('p', {className: 'pricing-price'},
    h('span', {className: 'pricing-price__value'},
      h('span', {className: 'pricing-price__value__currency'}, currency),
      parseInt(value, 10).toLocaleString('en-US')
    ),
    h('span', {className: 'pricing-price__unit'}, `/${unit}`)
  );
}

function calculateTotalPrice (subscriptionPlans) {
  return subscriptionPlans.reduce((total, plan) => total + parseInt(plan.price, 10), 0);
}

function getSpaceNavState (spaceId) {
  return {
    path: ['spaces', 'detail', 'home'],
    params: {spaceId},
    options: { reload: true }
  };
}

export default SubscriptionOverview;
