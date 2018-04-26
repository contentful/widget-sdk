import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import $location from '$location';
import * as Intercom from 'intercom';

import { get } from 'lodash';

import { supportUrl } from 'Config';
import * as ReloadNotification from 'ReloadNotification';
import { getPlansWithSpaces } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import createResourceService from 'services/ResourceService';
import { showDialog as showCreateSpaceModal } from 'services/CreateSpace';
import { openDeleteSpaceDialog } from 'services/DeleteSpace';
import { getSpaces, getOrganization } from 'services/TokenStore';
import { isOwnerOrAdmin, isOwner } from 'services/OrganizationRoles';
import { runTask } from 'utils/Concurrent';
import { calcUsersMeta, calculateTotalPrice } from 'utils/SubscriptionUtils';

import Workbench from 'ui/Components/Workbench/JSX';

import BasePlan from './BasePlan';
import UsersForPlan from './UsersForPlan';
import SpacePlans from './SpacePlans';
import Sidebar from './Sidebar';

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
          <Sidebar
            orgId={orgId}
            grandTotal={grandTotal}
            spacePlans={spacePlans}
            isOrgOwner={isOwner(organization)}
            isOrgBillable={Boolean(organization.isBillable)}
            onContactUs={this.contactUs}
          />
        </Workbench.Sidebar>
      </Workbench>
    );
  }
});

export default SubscriptionOverview;
