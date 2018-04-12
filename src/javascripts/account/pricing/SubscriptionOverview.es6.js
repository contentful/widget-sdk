import React, {createElement as h, Fragment} from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import {runTask} from 'utils/Concurrent';
import createResourceService from 'services/ResourceService';
import {createOrganizationEndpoint} from 'data/EndpointFactory';
import {getPlansWithSpaces} from 'account/pricing/PricingDataProvider';
import * as Intercom from 'intercom';
import {getSpaces, getOrganization} from 'services/TokenStore';
import {isOwnerOrAdmin, isOwner} from 'services/OrganizationRoles';
import * as ReloadNotification from 'ReloadNotification';
import {href} from 'states/Navigator';
import {showDialog as showCreateSpaceModal} from 'services/CreateSpace';
import {openDeleteSpaceDialog} from 'services/DeleteSpace';
import moment from 'moment';
import {get, isString} from 'lodash';
import {supportUrl} from 'Config';
import $location from '$location';
import Workbench from 'app/WorkbenchReact';
import Tooltip from 'ui/Components/Tooltip';
import HelpIcon from 'ui/Components/HelpIcon';
import pluralize from 'pluralize';
import {joinAnd} from 'stringUtils';
import {byName as colors} from 'Styles/Colors';
import BubbleIcon from 'svg/bubble';
import InvoiceIcon from 'svg/invoice';
import {asReact} from 'ui/Framework/DOMRenderer';
import { calculatePlansCost, calcUsersMeta, calculateTotalPrice, getEnabledFeatures } from 'utils/SubscriptionUtils';

const SubscriptionOverview = createReactClass({
  propTypes: {
    onReady: PropTypes.func.isRequired,
    onForbidden: PropTypes.func.isRequired,
    orgId: PropTypes.string.isRequired
  },
  getInitialState: function () {
    return {
      organization: {},
      basePlan: {},
      spacePlans: [],
      grandTotal: 0,
      usersMeta: {}
    };
  },
  componentWillMount: function () {
    runTask(this.fetchData);
  },
  fetchData: function* () {
    const {orgId, onReady, onForbidden} = this.props;

    const resources = createResourceService(orgId, 'organization');
    const organization = yield getOrganization(orgId);

    if (!isOwnerOrAdmin(organization)) {
      onForbidden();
      return;
    }

    const endpoint = createOrganizationEndpoint(orgId);
    const plans = yield getPlansWithSpaces(endpoint).catch(ReloadNotification.apiErrorHandler);
    const accessibleSpaces = yield getSpaces(); // spaces that current user has access to

    if (!plans) {
      return;
    }

    onReady();

    const basePlan = plans.items.find(({planType}) => planType === 'base');
    const spacePlans = plans.items
      .filter(({planType}) => planType === 'space')
      .sort((plan1, plan2) => {
        const [name1, name2] = [plan1, plan2].map((plan) => get(plan, 'space.name', ''));
        return name1.localeCompare(name2);
      })
      // Set space.isAccessible to check if current user can go to space details.
      .map((plan) => {
        if (plan.space) {
          plan.space.isAccessible = !!accessibleSpaces.find((space) => space.sys.id === plan.space.sys.id);
        }
        return plan;
      });

    const membershipsResource = yield resources.get('organization_membership');
    const numMemberships = membershipsResource.usage;

    const grandTotal = calculateTotalPrice({
      allPlans: plans.items,
      basePlan,
      numMemberships
    });

    const usersMeta = calcUsersMeta({ basePlan, numMemberships });

    this.setState({basePlan, spacePlans, grandTotal, usersMeta, organization});
  },
  createSpace: function () {
    showCreateSpaceModal(this.props.orgId);
  },
  deleteSpace: function (space) {
    openDeleteSpaceDialog({
      space,
      onSuccess: () => { runTask(this.fetchData); }
    });
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
    const {basePlan, spacePlans, grandTotal, usersMeta, organization} = this.state;
    const {orgId} = this.props;

    return h(Workbench, {
      title: 'Subscription',
      icon: 'subscription',
      testId: 'subscription-page',
      content: h('div', {
        style: {padding: '0 2rem'}
      },
        h('div', {
          className: 'header'
        },
          h(BasePlan, { basePlan, orgId }),
          h(UsersForPlan, { usersMeta, orgId })
        ),
          h(SpacePlans, {
            spacePlans,
            onCreateSpace: this.createSpace,
            onDeleteSpace: this.deleteSpace,
            isOrgOwner: isOwner(organization)
          })
        ),
      sidebar: h(RightSidebar, {
        orgId,
        grandTotal,
        isOrgOwner: isOwner(organization),
        isOrgBillable: organization.isBillable,
        onContactUs: this.contactUs
      })
    });
  }
});

function Pluralized ({ text, count }) {
  const pluralizedText = pluralize(text, count, true);

  return <span>{pluralizedText}</span>;
}

Pluralized.propTypes = {
  text: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired
};

function UsersForPlan ({ usersMeta, orgId }) {
  const { numFree, numPaid, cost } = usersMeta;
  const numTotal = numFree + numPaid;

  return <div className='users'>
    <h2 className='section-title'>Users</h2>
    <p>
      <span>Your organization has <b><Pluralized text="user" count={numTotal} /></b>.&#32;</span>
      { numPaid > 0 &&
        <span>You are exceeding the limit of <Pluralized text="free user" count={numFree} /> by <Pluralized text="user" count={numPaid} />. That is <b>${cost}</b> per month.&#32;</span>
      }
      <a
        className='text-link'
        href={href(getOrgMembershipsNavState(orgId))}
        data-test-id='subscription-page.org-memberships-link'>
        Manage users
      </a>
    </p>
  </div>;
}

UsersForPlan.propTypes = {
  usersMeta: PropTypes.object.isRequired,
  orgId: PropTypes.string.isRequired
};

function BasePlan ({ basePlan, orgId }) {
  const enabledFeaturesNames = getEnabledFeatures(basePlan).map(({name}) => name);

  return <div className='platform'>
    <h2 className='section-title'>Platform</h2>
    <p data-test-id='subscription-page.base-plan-details'>
      <b>
        {basePlan.name}
      </b>
      {
        enabledFeaturesNames.length
          ? ` – includes ${joinAnd(enabledFeaturesNames)}. `
          : ' – doesn’t include any additional features. '
      }
      <a
        className='text-link'
        href={href(getOrgUsageNavState(orgId))}
        data-test-id='subscription-page.org-usage-link'>
        View usage
      </a>
    </p>
  </div>;
}

BasePlan.propTypes = {
  basePlan: PropTypes.object.isRequired,
  orgId: PropTypes.string.isRequired
};

function SpacePlans ({spacePlans, onCreateSpace, onDeleteSpace, isOrgOwner}) {
  const numSpaces = spacePlans.length;
  const hasSpacePlans = numSpaces > 0;
  const totalCost = calculatePlansCost({ plans: spacePlans });

  return <div>
    <h2 className='section-title'>Spaces</h2>
    <p style={{ marginBottom: '1.5em' }}>
      { !hasSpacePlans &&
        "Your organization doesn't have any spaces. "
      }
      { hasSpacePlans &&
        <span>Your organization has <b><Pluralized text="space" count={numSpaces} /></b>.&#32;</span>
      }
      {
        totalCost > 0 &&
          <span>The total for your spaces is <b><Price value={totalCost} /></b> per month.&#32;</span>
      }
      <a className='text-link' onClick={onCreateSpace}>Add Space</a>
    </p>

    { hasSpacePlans &&
      <table className='simple-table'>
        <thead>
          <tr>
            <th style={{width: '25%'}}>Name</th>
            <th style={{width: '30%'}}>Space type / price</th>
            <th style={{width: '10%'}}>Created by</th>
            <th style={{width: '10%'}}>Created on</th>
            <th style={{width: '25%'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          { spacePlans.map(plan => {
            return <SpacePlanRow
              key={plan.sys.id || plan.space && plan.space.sys.id}
              plan={plan}
              onDeleteSpace={onDeleteSpace}
              isOrgOwner={isOrgOwner}
            />;
          })}
        </tbody>
      </table>
    }
  </div>;
}

SpacePlans.propTypes = {
  spacePlans: PropTypes.array.isRequired,
  onCreateSpace: PropTypes.func.isRequired,
  onDeleteSpace: PropTypes.func.isRequired,
  isOrgOwner: PropTypes.bool.isRequired
};

function SpacePlanRow ({plan, onDeleteSpace, isOrgOwner}) {
  const space = plan.space;
  const enabledFeatures = getEnabledFeatures(plan);
  let actionLinks = [];
  let createdBy = '';
  let createdAt = '';

  if (space) {
    createdBy = getUserName(space.sys.createdBy || {});
    createdAt = moment.utc(space.sys.createdAt).format('DD/MM/YYYY');
    actionLinks = getSpaceActionLinks(space, isOrgOwner, onDeleteSpace);
  }

  const featuresTooltip = enabledFeatures.length
  ? 'This space type includes ' + joinAnd(enabledFeatures.map(({name}) => name))
  : 'This space type doesn’t include any additional features';

  return h('tr', null,
    h('td', {
      'data-test-id': 'subscription-page.spaces-list.space-name'
    }, h('strong', {style: {margin: 0}}, get(space, 'name', '—'))),
    h('td', {
      'data-test-id': 'subscription-page.spaces-list.space-plan'
    },
      h('strong', {style: {marginTop: 0}},
        plan.name
      ),
      h(HelpIcon, null, featuresTooltip),
      h('br'),
      h(Price, {value: plan.price, unit: 'month'})
    ),
    h('td', null, createdBy),
    h('td', null, createdAt),
    h('td', null, ...actionLinks)
  );
}

function RightSidebar ({grandTotal, orgId, isOrgOwner, isOrgBillable, onContactUs}) {
  // TODO - add these styles to stylesheets
  const iconStyle = {fill: colors.blueDarkest, paddingRight: '6px', position: 'relative', bottom: '-0.125em'};

  return h('div', {
    className: 'entity-sidebar',
    'data-test-id': 'subscription-page.sidebar'
  },
    isOrgBillable && h(Fragment, null,
      h('h2', {className: 'entity-sidebar__heading'}, 'Grand total'),
      h('p', {
        'data-test-id': 'subscription-page.sidebar.grand-total'
      },
        'Your grand total is ',
        h(Price, {value: grandTotal, style: {fontWeight: 'bold'}}),
        ' per month.'
      ),
      isOrgOwner && h('p', {
        style: {marginBottom: '28px'}
      },
        h('span', {style: iconStyle}, asReact(InvoiceIcon)),
        h('a', {
          className: 'text-link',
          href: href(getInvoiceNavState(orgId)),
          'data-test-id': 'subscription-page.sidebar.invoice-link'
        }, 'View invoices')
      ),
      h('div', {className: 'note-box--info'},
        h('p', null,
          'Note that the monthly invoice amount might deviate from the total shown ' +
          'above. This happens when you hit overages or make changes to your ' +
          'subscription during a billing cycle.'
        ),
        h('p', null,
        h('span', {style: iconStyle}, asReact(InvoiceIcon)),
        h('a', {
          className: 'text-link',
          href: href(getInvoiceNavState(orgId)),
          'data-test-id': 'subscription-page.sidebar.invoice-link'
        }, 'View invoices')
      )
      )
    ),
    !isOrgBillable && isOrgOwner && h(Fragment, null,
      h('h2', {className: 'entity-sidebar__heading'}, 'Your payment details'),
      h('p', null,
        'You need to provide us with your billing address and credit card details before ' +
        'creating paid spaces or adding users beyond the free limit.'
      ),
      h('p', null,
        h('span', {style: iconStyle}, asReact(InvoiceIcon)),
        h('a', {
          className: 'text-link',
          href: href(getPaymentNavState(orgId)),
          'data-test-id': 'subscription-page.sidebar.add-payment-link'
        }, 'Enter payment details')
      )
    ),
    h('h2', {className: 'entity-sidebar__heading'}, 'Need help?'),
    h('p', null,
      isOrgBillable && 'Do you need to upgrade or downgrade your spaces? ',
      !isOrgBillable && 'Do you have any questions about our pricing? ',
      'Don’t hesitate to talk to our customer success team.'
    ),
    h('p', {className: 'entity-sidebar__help-text'},
      h('span', {style: iconStyle}, asReact(BubbleIcon)),
      h('button', {
        className: 'text-link',
        onClick: onContactUs,
        'data-test-id': 'subscription-page.sidebar.contact-link'
      }, 'Get in touch with us')
    )
  );
}

function getSpaceActionLinks (space, isOrgOwner, onDeleteSpace) {
  const actionLinkStyle = {padding: '0 10px 0 0', display: 'inline', whiteSpace: 'nowrap'};

  const tooltip = h('div', {style: {whiteSpace: 'normal'}},
    'You don’t have access to this space. But since you’re an organization ',
    `${isOrgOwner ? 'owner' : 'admin'} you can grant yourself access by going to `,
    h('i', null, 'users'),
    ' and adding yourself to the space.'
  );

  let spaceLink = '';
  let usageLink = '';

  if (space.isAccessible) {
    spaceLink = h('a', {
      className: 'text-link',
      href: href(getSpaceNavState(space.sys.id)),
      style: actionLinkStyle,
      'data-test-id': 'subscription-page.spaces-list.space-link'
    }, 'Go to space');
    usageLink = h('a', {
      className: 'text-link',
      href: href(getSpaceUsageNavState(space.sys.id)),
      style: actionLinkStyle,
      'data-test-id': 'subscription-page.spaces-list.space-usage-link'
    }, 'Usage');
  } else {
    spaceLink = h(Tooltip, {
      tooltip: tooltip,
      options: {width: 400},
      style: actionLinkStyle
    }, h('button', {
      className: 'text-link',
      disabled: true,
      'data-test-id': 'subscription-page.spaces-list.space-link'
    }, 'Go to space'));
    usageLink = h(Tooltip, {
      tooltip: tooltip,
      options: {width: 280},
      style: actionLinkStyle
    }, h('button', {
      className: 'text-link',
      disabled: true,
      'data-test-id': 'subscription-page.spaces-list.usage-link'
    }, 'Usage'));
  }
  const deleteLink = h('button', {
    className: 'text-link text-link--destructive',
    style: actionLinkStyle,
    onClick: () => onDeleteSpace(space),
    'data-test-id': 'subscription-page.spaces-list.delete-space-link'
  }, 'Delete');

  return [spaceLink, usageLink, deleteLink];
}

function Price ({value = 0, currency = '$', unit = null, style = null}) {
  const valueStr = parseInt(value, 10).toLocaleString('en-US');
  const unitStr = unit && ` /${unit}`;
  return h('span', {style}, [currency, valueStr, unitStr].join(''));
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

function getOrgUsageNavState (orgId) {
  return {
    path: ['account', 'organizations', 'usage'],
    params: { orgId },
    options: { reload: true }
  };
}

function getOrgMembershipsNavState (orgId) {
  return {
    path: ['account', 'organizations', 'users'],
    params: { orgId },
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

function getPaymentNavState (orgId) {
  return {
    path: ['account', 'organizations', 'subscription_billing'],
    params: {orgId, pathSuffix: '/billing_address'},
    options: {reload: true}
  };
}

function getUserName ({firstName, lastName, email}) {
  const name = (firstName || lastName) ? `${firstName} ${lastName}` : email;
  return isString(name) ? name.trim() : '';
}

export default SubscriptionOverview;
