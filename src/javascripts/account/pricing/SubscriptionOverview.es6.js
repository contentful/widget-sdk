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
import {href} from 'states/Navigator';
import {showDialog as showCreateSpaceModal} from 'services/CreateSpace';
import {canCreateSpaceInOrganization} from 'access_control/AccessChecker';
import svgPlus from 'svg/plus';
import {asReact} from 'ui/Framework/DOMRenderer';
import moment from 'moment';
import {get, isString} from 'lodash';

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
      canCreateSpace: false
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
    const spacePlans = plans.items
      .filter(({planType}) => planType === 'space')
      .sort((plan1, plan2) => {
        const [name1, name2] = [plan1, plan2].map((plan) => get(plan, 'space.name', ''));
        return name1.localeCompare(name2);
      });
    const canCreateSpace = canCreateSpaceInOrganization(orgId);

    this.setState({basePlan, spacePlans, canCreateSpace});
  },
  createSpace: function () {
    if (this.state.canCreateSpace) {
      showCreateSpaceModal(this.props.orgId);
    }
  },
  render: function () {
    const {basePlan, spacePlans, canCreateSpace} = this.state;
    const {orgId} = this.props;

    return h('div', {className: 'workbench'},
      h('div', {className: 'workbench-header__wrapper'},
        h('header', {className: 'workbench-header'},
          h('div', {className: 'workbench-header__icon'}), /* TODO missing icon */
          h('h1', {className: 'workbench-header__title'}, 'Subscription')
        )
      ),
      h('div', {className: 'workbench-main'},
        h('div', {
          className: 'workbench-main__content',
          style: {padding: '1.2rem 2rem'}
        },
          h(BasePlan, {basePlan, orgId}),
          h(SpacePlans, {spacePlans, orgId})
        ),
        h('div', {
          className: 'workbench-main__sidebar'
        },
          h(RightSidebar, {
            canCreateSpace,
            onCreateSpace: this.createSpace
          })
        )
      )
    );
  }
});

SubscriptionOverview.propTypes = subscriptionOverviewPropTypes;

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

function SpacePlans ({spacePlans, orgId}) {
  const grandTotal = calculateTotalPrice(spacePlans);
  const actionLinkStyle = {padding: '0 15px'};
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
    ),
    h('tfoot', null,
      h('tr', null,
        h('td', null, 'Total'),
        h('td', null, h(Price, {value: grandTotal, unit: 'mo'})),
        h('td', null),
        h('td', {style: {textAlign: 'right'}},
          h('a', {href: href(getInvoiceNavState(orgId)), style: actionLinkStyle}, 'Invoices')
        )
      )
    )
  );
}

function RightSidebar ({onCreateSpace, canCreateSpace}) {
  return h('div', {className: 'entity-sidebar'},
    h('p', {className: 'entity-sidebar__help-text'},
      h('button', {
        className: 'btn-action x--block',
        onClick: onCreateSpace,
        disabled: !canCreateSpace
      },
        h('div', {className: 'btn-icon cf-icon cf-icon--plus inverted'}, asReact(svgPlus)),
        'Add a new space'
      )
    ),
    h('h2', {className: 'entity-sidebar__heading'}, 'Need help?'),
    h('p', {className: 'entity-sidebar__help-text'},
      'Do you need to make changes to your pricing plan or purchase additional spaces? ' +
      'Don’t hesitate to talk to our customer success team.'
    ),
    h('p', {className: 'entity-sidebar__help-text'},
      h('a', {href: supportUrl}, 'Get in touch with us')
    )
  );
}

function Price ({value = 0, currency = '$', unit = null}) {
  const valueStr = parseInt(value, 10).toLocaleString('en-US');
  const unitStr = unit && ` /${unit}`;
  return h('span', null, [currency, valueStr, unitStr].join(''));
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
