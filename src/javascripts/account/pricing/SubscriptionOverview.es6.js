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
          h(BasePlan, {basePlan, orgId}),
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

function BasePlan ({basePlan, orgId}) {
  const enabledFeatures = getEnabledFeatures(basePlan);

  return h('div', null,
    h('h2', null,
      basePlan.name, '  ',
      h('a', {
        href: href(getOrgUsageNavState(orgId)),
        style: {
          fontSize: '0.8em',
          fontWeight: 'normal',
          textDecoration: 'underline',
          marginLeft: '0.8em'
        }
      }, 'See usage')
    ),
    h('p', null, enabledFeatures.length ? enabledFeatures.map(({name}) => name) : 'No features on platform')
  );
}

function SpacePlans ({spacePlans, onCreateSpace}) {
  const actionLinkStyle = {padding: '0 15px'};

  if (!spacePlans.length) {
    return h('p', null,
      'Your organization doesn\'t have any spaces. ',
      h('button', {
        className: 'btn-link',
        onClick: onCreateSpace
      }, 'Add space')
    );
  } else {
    return h('table', {className: 'deprecated-table x--hoverable'},
      h('thead', null,
        h('tr', null,
          h('th', {style: {width: '40%'}},
            'Space name ',
            h('i', {className: 'fa fa-caret-up'})
          ),
          h('th', null, 'Type'),
          h('th', null, 'Created by'),
          h('th', null, 'Created on'),
          h('th', null)
        )
      ),
      h('tbody', {className: 'clickable'},
        spacePlans.map((plan) => {
          const {name, price, sys, space} = plan;
          const enabledFeatures = getEnabledFeatures(plan);
          let createdBy = '';
          let createdAt = '';
          let spaceLink = '';
          let usageLink = '';
          if (space) {
            createdBy = getUserName(space.sys.createdBy || {});
            createdAt = moment.utc(space.sys.createdAt).format('DD. MMMM YYYY');
            spaceLink = h('a', {href: href(getSpaceNavState(space.sys.id)), style: actionLinkStyle}, 'Go to space');
            usageLink = h('a', {href: href(getSpaceUsageNavState(space.sys.id)), style: actionLinkStyle}, 'Usage');
          }

          return h('tr', {
            key: sys.id
          },
            h('td', null,
              h('h3', null, get(space, 'name', '—')),
              h('p', null, enabledFeatures.length ? enabledFeatures.map(({name}) => name) : 'No features on space')
            ),
            h('td', null,
              h('h3', null, name),
              h(Price, {value: price})
            ),
            h('td', null, createdBy),
            h('td', null, createdAt),
            h('td', {style: {textAlign: 'right'}}, spaceLink, usageLink)
          );
        })
      )
    );
  }
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

function getOrgUsageNavState (orgId) {
  return {
    path: ['account', 'organizations', 'usage'],
    params: {orgId},
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
