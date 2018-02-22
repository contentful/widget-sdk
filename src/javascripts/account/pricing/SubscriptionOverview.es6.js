import {createElement as h} from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import {runTask} from 'utils/Concurrent';
import {createOrganizationEndpoint} from 'data/EndpointFactory';
import {getPlansWithSpaces} from 'account/pricing/PricingDataProvider';
import * as Intercom from 'intercom';
import {getOrganization} from 'services/TokenStore';
import {isOwnerOrAdmin} from 'services/OrganizationRoles';
import * as ReloadNotification from 'ReloadNotification';
import {href} from 'states/Navigator';
import {showDialog as showCreateSpaceModal} from 'services/CreateSpace';
import moment from 'moment';
import {get, isString} from 'lodash';
import {supportUrl} from 'Config';
import $location from '$location';
import Workbench from 'app/WorkbenchReact';
import {joinAnd} from 'stringUtils';

const SubscriptionOverview = createReactClass({
  propTypes: {
    onReady: PropTypes.func.isRequired,
    onForbidden: PropTypes.func.isRequired,
    orgId: PropTypes.string.isRequired
  },
  getInitialState: function () {
    return {
      basePlan: {},
      spacePlans: [],
      grandTotal: 0
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

    const endpoint = createOrganizationEndpoint(orgId);
    const plans = yield getPlansWithSpaces(endpoint).catch(ReloadNotification.apiErrorHandler);

    onReady();

    const basePlan = plans.items.find(({planType}) => planType === 'base');
    const spacePlans = plans.items
      .filter(({planType}) => planType === 'space')
      .sort((plan1, plan2) => {
        const [name1, name2] = [plan1, plan2].map((plan) => get(plan, 'space.name', ''));
        return name1.localeCompare(name2);
      });
    // TODO add user fees
    const grandTotal = calculateTotalPrice(spacePlans);

    this.setState({basePlan, spacePlans, grandTotal});
  },
  createSpace: function () {
    showCreateSpaceModal(this.props.orgId);
  },
  contactUs: function () {
    // Open intercom if it's possible, otherwise go to support page.
    if (Intercom.isEnabled()) {
      Intercom.open();
    } else {
      $location.url(supportUrl);
    }
  },
  render: function () {
    const {basePlan, spacePlans, grandTotal} = this.state;
    const {orgId} = this.props;

    return h(Workbench, {
      title: 'Subscription',
      content: h('div', {
        style: {padding: '0 2rem'}
      },
          h(BasePlan, {basePlan}),
          h(SpacePlans, {
            spacePlans,
            onCreateSpace: this.createSpace
          })
        ),
      sidebar: h(RightSidebar, {
        orgId,
        grandTotal,
        onContactUs: this.contactUs
      })
    });
  }
});

function BasePlan ({basePlan}) {
  const enabledFeaturesNames = getEnabledFeatures(basePlan).map(({name}) => name);

  return h('div', null,
    h('h2', null, 'Platform'),
    h('p', null,
      h('b', null, basePlan.name),
      enabledFeaturesNames.length ? ` – includes ${joinAnd(enabledFeaturesNames)}` : null
    )
  );
}

function SpacePlans ({spacePlans, onCreateSpace}) {
  if (!spacePlans.length) {
    return h('div', null,
      h('h2', null, 'Spaces'),
      h('p', null,
        'Your organization doesn\'t have any spaces. ',
        h('button', {
          className: 'btn-link',
          onClick: onCreateSpace
        }, 'Add space')
      )
    );
  } else {
    const spacesTotal = calculateTotalPrice(spacePlans);

    return h('div', null,
      h('h2', null, 'Spaces'),
      h('p', null,
        'The total for your ',
        h('b', null, `${spacePlans.length} spaces`),
        ' is ',
        h(Price, {value: spacesTotal, style: {fontWeight: 'bold'}}),
        ' per month.'
        // TODO show available free spaces
      ),
      h('table', {className: 'deprecated-table x--hoverable'},
        h('thead', null,
          h('tr', null,
            h('th', {style: {width: '40%'}}, 'Name'),
            h('th', null, 'Space type / price'),
            h('th', null, 'Created by'),
            h('th', null, 'Created on'),
            h('th', {style: {width: '1%'}}, 'Actions')
          )
        ),
        h('tbody', {className: 'clickable'}, spacePlans.map(
          (plan) => h(SpacePlanRow, {plan, key: plan.sys.id})
        ))
      )
    );
  }
}

function SpacePlanRow ({plan}) {
  const actionLinkStyle = {padding: '0 20px 0 0', whiteSpace: 'nowrap'};
  const {name, price, space} = plan;
  const enabledFeatures = getEnabledFeatures(plan);
  let createdBy = '';
  let createdAt = '';
  let spaceLink = '';
  let usageLink = '';

  if (space) {
    createdBy = getUserName(space.sys.createdBy || {});
    createdAt = moment.utc(space.sys.createdAt).format('DD/MM/YYYY');
    spaceLink = h('a', {href: href(getSpaceNavState(space.sys.id)), style: actionLinkStyle}, 'Go to space');
    usageLink = h('a', {href: href(getSpaceUsageNavState(space.sys.id)), style: actionLinkStyle}, 'Usage');
  }

  return h('tr', null,
    h('td', null,
      h('h3', null, get(space, 'name', '—')),
      h('p', null, enabledFeatures.length ? enabledFeatures.map(({name}) => name) : 'No features on space')
    ),
    h('td', null,
      h('h3', null, name),
      h(Price, {value: price, unit: 'month'})
    ),
    h('td', null, createdBy),
    h('td', null, createdAt),
    h('td', null, spaceLink, usageLink)
  );
}

function RightSidebar ({grandTotal, orgId, onContactUs}) {
  return h('div', {className: 'entity-sidebar'},
    h('h2', {className: 'entity-sidebar__heading'}, 'Grand total'),
    h('p', {className: 'entity-sidebar__help-text'},
      'Your grand total is ',
      h(Price, {value: grandTotal, style: {fontWeight: 'bold'}}),
      ' per month.'
    ),
    h('p', {className: 'entity-sidebar__help-text'},
      h('a', {href: href(getInvoiceNavState(orgId))}, 'View invoices')
    ),
    h('h2', {className: 'entity-sidebar__heading'}, 'Need help?'),
    h('p', {className: 'entity-sidebar__help-text'},
      'Do you need to up- or downgrade? Don’t hesitate to talk to our customer success team.'
    ),
    h('p', {className: 'entity-sidebar__help-text'},
      h('button', {className: 'btn-link', onClick: onContactUs}, 'Get in touch with us')
    )
  );
}

function Price ({value = 0, currency = '$', unit = null, style = null}) {
  const valueStr = parseInt(value, 10).toLocaleString('en-US');
  const unitStr = unit && ` /${unit}`;
  return h('span', {style}, [currency, valueStr, unitStr].join(''));
}

function calculateTotalPrice (subscriptionPlans) {
  return subscriptionPlans.reduce((total, plan) => total + parseInt(plan.price, 10), 0);
}

function getEnabledFeatures ({ratePlanCharges = []}) {
  return ratePlanCharges.filter(({unitType}) => unitType === 'feature');
}

function getSpaceNavState (spaceId) {
  return {
    path: ['spaces', 'detail', 'home'],
    params: {spaceId},
    options: { reload: true }
  };
}

function getSpaceUsageNavState (spaceId) {
  return {
    path: ['spaces', 'detail', 'settings', 'usage'],
    params: {spaceId},
    options: { reload: true }
  };
}

function getInvoiceNavState (orgId) {
  return {
    path: ['account', 'organizations', 'billing'],
    params: {orgId},
    options: { reload: true }
  };
}

function getUserName ({firstName, lastName, email}) {
  const name = (firstName || lastName) ? `${firstName} ${lastName}` : email;
  return isString(name) ? name.trim() : '';
}

export default SubscriptionOverview;
