import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import Workbench from 'ui/Components/Workbench/JSX.es6';
import { go } from 'states/Navigator.es6';
import { Button } from '@contentful/ui-component-library';

import { SpaceMembership, OrganizationMembership } from '../PropTypes.es6';
import { OrganizationRoleSelector } from './OrganizationRoleSelector.es6';
import {
  removeMembership,
  updateMembership
} from 'access_control/OrganizationMembershipRepository.es6';

import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import UserSpaceMemberships from './UserSpaceMemberships.es6';

const ServicesConsumer = require('../../../../reactServiceContext').default;

class UserDetail extends React.Component {
  static propTypes = {
    $services: PropTypes.shape({
      notification: PropTypes.object,
      confirm: PropTypes.object
    }),
    initialMembership: OrganizationMembership.isRequired,
    spaceMemberships: PropTypes.arrayOf(SpaceMembership).isRequired,
    orgId: PropTypes.string.isRequired
  };

  state = {
    membership: this.props.initialMembership
  };

  endpoint = createOrganizationEndpoint(this.props.orgId);

  getLastActiveDate() {
    const dateString = this.state.membership.sys.lastActiveAt;

    return dateString ? moment(dateString, moment.ISO_8601).fromNow() : 'Not available';
  }

  toggleOrgRoleDropdown() {
    this.setState({ orgRoleDropdownIsOpen: !this.state.orgRoleDropdownIsOpen });
  }

  changeOrgRole = async role => {
    const { notification } = this.props.$services;
    const oldMembership = this.state.membership;
    const {
      sys: { id, version }
    } = oldMembership;
    let updatedMembership;

    try {
      updatedMembership = await updateMembership(this.endpoint, { id, role, version });
    } catch (e) {
      notification.error(e.data.message);
      return;
    }

    this.setState({
      membership: {
        role,
        sys: {
          ...oldMembership.sys,
          version: updatedMembership.sys.version
        }
      }
    });
    notification.info(`
      Role successfully changed to ${role}
    `);
  };

  async removeMembership() {
    const { notification, confirm } = this.props.$services;
    const { id, user } = this.state.membership.sys;

    const message = (
      <React.Fragment>
        <p>
          You are about to remove {user.firstName} {user.lastName} from your organization.
        </p>
        <p>
          After removal this user will not be able to access this organization in any way. Do you
          want to proceed?
        </p>
      </React.Fragment>
    );
    const confirmation = await confirm.default({
      title: 'Remove user from the organization',
      message
    });

    if (!confirmation) {
      return;
    }

    try {
      await removeMembership(this.endpoint, id);
    } catch (e) {
      notification.error(e.data.message);
      return;
    }

    this.goToUserList();
  }

  goToUserList() {
    go({
      path: ['account', 'organizations', 'users']
    });
  }

  render() {
    const { spaceMemberships, orgId } = this.props;
    const { membership } = this.state;
    const { user } = membership.sys;

    return (
      <Workbench testId="organization-users-page">
        <Workbench.Header>
          <Workbench.Title>Users</Workbench.Title>
          <div className="workbench-header__actions">
            <Button buttonType="negative" onClick={() => this.removeMembership()}>
              Remove membership
            </Button>
          </div>
        </Workbench.Header>
        <Workbench.Content>
          <div style={{ padding: '1em 2em 2em' }}>
            <section className="user-details__card">
              <img src={user.avatarUrl} className="user-details__avatar" />
              <div>
                <h2>{`${user.firstName} ${user.lastName}`}</h2>
                <p>{user.email}</p>
              </div>
            </section>
            <section style={{ display: 'flex', marginBottom: 50 }}>
              <div style={{ width: '31.6%' }}>
                <h4>Organization role</h4>
                <OrganizationRoleSelector
                  initialRole={membership.role}
                  onChange={this.changeOrgRole}
                />
              </div>
              <div>
                <h4>Last activity</h4>
                <p>{this.getLastActiveDate()}</p>
              </div>
            </section>

            <h3 style={{ marginBottom: 30 }}>Space memberships</h3>
            <UserSpaceMemberships initialMemberships={spaceMemberships} user={user} orgId={orgId} />
          </div>
        </Workbench.Content>
      </Workbench>
    );
  }
}

export default ServicesConsumer('notification', {
  as: 'confirm',
  from: 'app/ConfirmationDialog.es6'
})(UserDetail);
