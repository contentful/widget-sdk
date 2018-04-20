import React, {Fragment} from 'react';
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

import Workbench from 'ui/Components/Workbench/JSX';
import Icon from 'ui/Components/Icon';
import Tooltip from 'ui/Components/Tooltip';
import HelpIcon from 'ui/Components/HelpIcon';
import pluralize from 'pluralize';
import {joinAnd} from 'stringUtils';
import {byName as colors} from 'Styles/Colors';
import { calculatePlansCost, calcUsersMeta, calculateTotalPrice, getEnabledFeatures } from 'utils/SubscriptionUtils';
import { TextLink } from '@contentful/ui-component-library';

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
    const usersMeta = calcUsersMeta({ basePlan, numMemberships });
    const grandTotal = calculateTotalPrice({
      allPlans: plans.items,
      basePlan,
      numMemberships
    });

    this.setState({basePlan, spacePlans, grandTotal, usersMeta, organization});

    onReady();
  },

  createSpace: function () {
    showCreateSpaceModal(this.props.orgId);
  },

  deleteSpace: function (space) {
    return () => {
      openDeleteSpaceDialog({
        space,
        onSuccess: () => { runTask(this.fetchData); }
      });
    };
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

    return (
      <Workbench
        title='Subscription'
        icon='subscription'
        testId='subscription-page'
      >
        <Workbench.Content>
          <div style={{padding: '0px 2rem'}}>
            <div className='header'>
              <BasePlan basePlan={basePlan} orgId={orgId} />
              <UsersForPlan usersMeta={usersMeta} orgId={orgId} />
            </div>
            <SpacePlans
              spacePlans={spacePlans}
              onCreateSpace={this.createSpace}
              onDeleteSpace={this.deleteSpace}
              isOrgOwner={isOwner(organization)}
            />
          </div>
        </Workbench.Content>
        <Workbench.Sidebar>
          <RightSidebar
            orgId={orgId}
            grandTotal={grandTotal}
            isOrgOwner={isOwner(organization)}
            isOrgBillable={Boolean(organization.isBillable)}
            onContactUs={this.contactUs}
          />
        </Workbench.Sidebar>
      </Workbench>
    );
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
  const hasAnyFeatures = enabledFeatures.length > 0;

  let actionLinks = [];
  let createdBy = '';
  let createdAt = '';

  if (space) {
    createdBy = getUserName(space.sys.createdBy || {});
    createdAt = moment.utc(space.sys.createdAt).format('DD/MM/YYYY');
    actionLinks = getSpaceActionLinks(space, isOrgOwner, onDeleteSpace);
  }

  return <tr>
    <td><strong>{get(space, 'name', '-')}</strong></td>
    <td>
      <strong>{plan.name}</strong>
      { hasAnyFeatures &&
        <HelpIcon>This space includes {joinAnd(enabledFeatures.map(({name}) => name))}</HelpIcon>
      }
      <br />
      <Price value={plan.price} unit='month' />
    </td>
    <td>{createdBy}</td>
    <td>{createdAt}</td>
    <td>{actionLinks.map(actionLink => actionLink)}</td>
  </tr>;
}

SpacePlanRow.propTypes = {
  plan: PropTypes.object.isRequired,
  onDeleteSpace: PropTypes.func.isRequired,
  isOrgOwner: PropTypes.bool.isRequired
};

function RightSidebar ({grandTotal, orgId, isOrgOwner, isOrgBillable, onContactUs}) {
  // TODO - add these styles to stylesheets
  const iconStyle = {fill: colors.blueDarkest, paddingRight: '6px', position: 'relative', bottom: '-0.125em'};

  return <div className='entity-sidebar' data-test-id='subscription-page.sidebar'>
    { isOrgBillable &&
      <Fragment>
        <h2 className='entity-sidebar__heading'>Grand total</h2>
        <p data-test-id='subscription-page.sidebar.grand-total'>
          Your grand total is <Price value={grandTotal} style={{fontWeight: 'bold'}} /> per month.
        </p>
        {
          isOrgOwner &&
          <p style={{marginBottom: '28px'}}>
            <Icon name='invoice' style={iconStyle} />
            <a
              className='text-link'
              href={href(getInvoiceNavState(orgId))}
              data-test-id='subscription-page.sidebar.invoice-link'
            >
              View invoices
            </a>
          </p>
        }
        <div className='note-box--info'>
          <p>
            Note that the monthly invoice amount might deviate from the total shown above. This happens when you hit overages or make changes to your subscription during a billing cycle.
          </p>
          <p>
            <Icon name='invoice' style={iconStyle} />
            <a
              className='text-link'
              href={href(getInvoiceNavState(orgId))}
              data-test-id='subscription-page.sidebar.invoice-link'
            >
              View invoices
            </a>
          </p>
        </div>
      </Fragment>
    }
    {
      !isOrgBillable && isOrgOwner &&
      <Fragment>
        <h2 className='entity-sidebar__heading'>Your payment details</h2>
        <p>
          You need to provide us with your billing address and credit card details before creating paid spaces or adding users beyond the free limit.
        </p>
        <Icon name='invoice' style={iconStyle} />
        <a
          className='text-link'
          href={href(getPaymentNavState(orgId))}
          data-test-id='subscription-page.sidebar.add-payment-link'
        >
          Enter payment details
        </a>
      </Fragment>
    }
    <h2 className='entity-sidebar__heading'>Need help?</h2>
    <p>
      { isOrgBillable && 'Do you need to upgrade or downgrade your spaces?' }
      { !isOrgBillable && 'Do you have any questions about our pricing?' }
      <Fragment>&#32;Don&apos;t hesitate to talk to our customer success team.</Fragment>
    </p>
    <p>
      <Icon name='bubble' style={iconStyle} />
      <button
        className='text-link'
        onClick={onContactUs}
        data-test-id='subscription-page.sidebar.contact-link'
      >
        Get in touch with us
      </button>
    </p>
  </div>;
}

RightSidebar.propTypes = {
  grandTotal: PropTypes.number.isRequired,
  orgId: PropTypes.string.isRequired,
  isOrgOwner: PropTypes.bool.isRequired,
  isOrgBillable: PropTypes.bool.isRequired,
  onContactUs: PropTypes.func.isRequired
};

function getSpaceActionLinks (space, isOrgOwner, onDeleteSpace) {
  const actionLinkStyle = {
    margin: '0 10px 0 0',
    display: 'inline',
    whiteSpace: 'nowrap'
  };
  const tooltip = (
    <div style={{whiteSpace: 'normal'}}>
      You don&apos;t have access to this space. But since you&apos;re an organization {isOrgOwner ? 'owner' : 'admin'} you can grant yourself access by going to <i>users</i> and adding yourself to the space.
    </div>
  );

  let spaceLink = (
    <TextLink
      extraClassNames='text-link'
      href={space.isAccessible && href(getSpaceNavState(space.sys.id))}
      disabled={!space.isAccessible}
      style={actionLinkStyle}
      data-test-id='subscription-page.spaces-list.space-link'
    >
      Go to space
    </TextLink>
  );
  let usageLink = (
    <TextLink
      extraClassNames='text-link'
      href={space.isAccessible && href(getSpaceUsageNavState(space.sys.id))}
      disabled={!space.isAccessible}
      style={actionLinkStyle}
      data-test-id='subscription-page.spaces-list.space-usage-link'
    >
      Usage
    </TextLink>
  );

  if (!space.isAccessible) {
    spaceLink = <Tooltip tooltip={tooltip} style={actionLinkStyle}>{spaceLink}</Tooltip>;
    usageLink = <Tooltip tooltip={tooltip} style={actionLinkStyle}>{usageLink}</Tooltip>;
  }

  const deleteLink = (
    <button
      className='text-link text-link--destructive'
      style={actionLinkStyle}
      onClick={onDeleteSpace(space)}
      data-test-id='subscription-page.spaces-list.delete-space-link'
    >
      Delete
    </button>
  );

  return [spaceLink, usageLink, deleteLink];
}

function Price ({value = 0, currency = '$', unit = null, style = null}) {
  const valueStr = parseInt(value, 10).toLocaleString('en-US');
  const unitStr = unit && ` /${unit}`;

  const priceStr = [currency, valueStr, unitStr].join('');

  return <span style={style}>{priceStr}</span>;
}

Price.propTypes = {
  value: PropTypes.number.isRequired,
  currency: PropTypes.string.isRequired,
  unit: PropTypes.string,
  style: PropTypes.object
};

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
