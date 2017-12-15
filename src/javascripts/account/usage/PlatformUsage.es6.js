import * as auth from 'Authentication';
import {apiUrl} from 'Config';
import {createOrganizationEndpoint, createSubscriptionEndpoint} from 'data/Endpoint';
import {getSubscription, getBasePlan} from 'account/pricing/PricingDataProvider';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import {createElement as h} from 'libs/react';
import {runTask} from 'utils/Concurrent';
import {isOwnerOrAdmin} from 'services/OrganizationRoles';
import {getOrganization} from 'services/TokenStore';

const PRICE_FORMATS = {
  'FlatFee': '(flat fee)',
  'PerUnit': 'per unit'
};

const PlatformUsage = createReactClass({
  getInitialState: function () {
    return {
      charges: []
    };
  },
  componentDidMount: function () {
    runTask(this.fetchPlan);
  },
  fetchPlan: function* () {
    const org = yield getOrganization(this.props.orgId);
    const orgEndpoint = createOrganizationEndpoint(apiUrl(), this.props.orgId, auth);

    if (!isOwnerOrAdmin(org)) {
      this.props.onForbidden();
      return;
    }

    const subscription = yield getSubscription(orgEndpoint);
    const subscriptionsEndpoint = createSubscriptionEndpoint(apiUrl(), subscription.sys.id, auth);
    const plan = yield getBasePlan(subscriptionsEndpoint);

    this.props.onReady();
    this.setState({
      name: plan.productRatePlan.name,
      charges: plan.ratePlanCharges
    });
  },
  render: function () {
    return h(Workbench, {
      title: 'Usage',
      content: h('div', {style: {padding: '2rem 3.15rem'}},
        h('h2', {style: {margin: '0 0 1em'}}, this.state.name),
        this.state.charges.map(charge => h(TiersTable, {key: charge.sys.id, charge}))
      )
    });
  }
});

PlatformUsage.propTypes = {
  onReady: PropTypes.func.isRequired,
  onForbidden: PropTypes.func.isRequired,
  orgId: PropTypes.string.isRequired
};

function TiersTable ({charge}) {
  return h('section', null,
    h('h3', {className: 'section-title'}, charge.name),
    h('table',
      {className: 'deprecated-table'},
      h('thead', null,
        h('tr', null,
          h('th', null, 'Tier'),
          h('th', null, 'Start'),
          h('th', null, 'End'),
          h('th', null, 'Price'),
          h('th', null, 'Price format')
        )
      ),
      h('tbody', null,
        charge.tiers.map(row => h('tr', {key: row.tier},
          h('td', null, row.tier),
          h('td', null, row.startingUnit),
          h('td', null, row.endingUnit),
          h('td', null, `$${row.price}`),
          h('td', null, PRICE_FORMATS[row.priceFormat])
        ))
      )
    )
  );
}

// TODO: move this to Workbench.es6.js?
function Workbench ({title, content, sidebar}) {
  return h('div', {
    className: 'workbench'
  },
    h('div', {
      className: 'workbench-header__wrapper'
    },
      h('header', {
        className: 'workbench-header'
      },
        h('h1', {
          className: 'workbench-header__title'
        }, title)
      )
    ),
    h('div', {
      className: 'workbench-main'
    },
      h('div', {
        className: 'workbench-main__content'
      }, content),
      h('div', {
        className: 'workbench-main__sidebar'
      }, sidebar)
    )
  );
}

export default PlatformUsage;
