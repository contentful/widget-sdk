import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

import { get } from 'lodash';

import notification from 'notification';
import * as ReloadNotification from 'ReloadNotification';
import { getPlansWithSpaces } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import createResourceService from 'services/ResourceService';
import { showDialog as showCreateSpaceModal } from 'services/CreateSpace';
import { showDialog as showChangeSpaceModal } from 'services/ChangeSpaceService';
import { openDeleteSpaceDialog } from 'services/DeleteSpace';
import { getSpaces, getOrganization } from 'services/TokenStore';
import { isOwnerOrAdmin, isOwner } from 'services/OrganizationRoles';
import { calcUsersMeta, calculateTotalPrice } from 'utils/SubscriptionUtils';
import { openModal as openCommittedSpaceWarningDialog } from 'components/shared/space-wizard/CommittedSpaceWarningModal';

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
    this.fetchData();
  },

  fetchData: async function () {
    const {orgId, onReady, onForbidden} = this.props;

    const resources = createResourceService(orgId, 'organization');
    const organization = await getOrganization(orgId);

    if (!isOwnerOrAdmin(organization)) {
      onForbidden();
      return;
    }

    const endpoint = createOrganizationEndpoint(orgId);
    let plans;

    try {
      plans = await getPlansWithSpaces(endpoint);
    } catch (e) {
      return ReloadNotification.apiErrorHandler(e);
    }

    const accessibleSpaces = await getSpaces(); // spaces that current user has access to

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

    const membershipsResource = await resources.get('organization_membership');
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

  spaceChanged (space, currentSpacePlan, newSpacePlan) {
    let notificationMsg = `Space ${space.name} successfully`;

    if (currentSpacePlan) {
      const changeType = newSpacePlan.price >= currentSpacePlan.price ? 'upgraded' : 'downgraded';
      notificationMsg = `${notificationMsg} ${changeType} to a ${newSpacePlan.name} space.`;
    } else {
      notificationMsg = `${notificationMsg} changed.`;
    }

    notification.info(notificationMsg);

    this.setState({
      upgradedSpace: space.sys.id
    });

    setTimeout(() => {
      this.setState({
        upgradedSpace: null
      });
    }, 6000);
  },

  createSpace: function () {
    showCreateSpaceModal(this.props.orgId);
  },

  changeSpace: function (space, action) {
    return () => {
      showChangeSpaceModal({
        organizationId: this.props.orgId,
        scope: 'organization',
        space,
        action,
        onSubmit: async () => {
          let spacePlans;

          spacePlans = this.state.spacePlans;
          const currentSpacePlan = spacePlans.find(plan => plan.gatekeeperKey === space.sys.id);

          try {
            await this.fetchData();
          } catch (e) {
            return ReloadNotification.apiErrorHandler(e);
          }

          spacePlans = this.state.spacePlans;
          const newSpacePlan = spacePlans.find(plan => plan.gatekeeperKey === space.sys.id);

          return this.spaceChanged(space, currentSpacePlan, newSpacePlan);
        }
      });
    };
  },

  deleteSpace: function (space, plan) {
    if (plan.committed) {
      return () => openCommittedSpaceWarningDialog();
    }

    return () => {
      openDeleteSpaceDialog({
        space,
        onSuccess: this.fetchData
      });
    };
  },

  render: function () {
    const {basePlan, spacePlans, grandTotal, usersMeta, upgradedSpace, organization} = this.state;
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
              basePlan={basePlan}
              spacePlans={spacePlans}
              upgradedSpace={upgradedSpace}
              onCreateSpace={this.createSpace}
              onChangeSpace={this.changeSpace}
              onDeleteSpace={this.deleteSpace}
              isOrgOwner={isOwner(organization)}
            />
          </div>
        </Workbench.Content>
        <Workbench.Sidebar>
          <Sidebar
            basePlan={basePlan}
            orgId={orgId}
            grandTotal={grandTotal}
            spacePlans={spacePlans}
            isOrgOwner={isOwner(organization)}
            isOrgBillable={Boolean(organization.isBillable)}
          />
        </Workbench.Sidebar>
      </Workbench>
    );
  }
});

export default SubscriptionOverview;
