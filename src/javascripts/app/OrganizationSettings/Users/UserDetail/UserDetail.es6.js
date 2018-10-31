import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { getValue } from 'utils/kefir.es6';
import Workbench from 'app/common/Workbench.es6';
import { go } from 'states/Navigator.es6';
import { Button, ModalConfirm } from '@contentful/ui-component-library';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import UserCard from '../UserCard.es6';
import { orgRoles } from './OrgRoles.es6';

import {
  SpaceMembership,
  OrganizationMembership,
  Space,
  SpaceRole,
  User as UserPropType
} from '../PropTypes.es6';
import { OrganizationRoleSelector } from './OrganizationRoleSelector.es6';
import {
  removeMembership,
  updateMembership
} from 'access_control/OrganizationMembershipRepository.es6';

import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import UserSpaceMemberships from './UserSpaceMemberships/UserSpaceMemberships.es6';

const ServicesConsumer = require('../../../../reactServiceContext').default;

class UserDetail extends React.Component {
  static propTypes = {
    $services: PropTypes.shape({
      notification: PropTypes.object,
      TokenStore: PropTypes.object,
      OrganizationRoles: PropTypes.object
    }),
    initialMembership: OrganizationMembership.isRequired,
    createdBy: UserPropType.isRequired,
    spaceMemberships: PropTypes.arrayOf(SpaceMembership).isRequired,
    spaces: PropTypes.arrayOf(Space).isRequired,
    roles: PropTypes.arrayOf(SpaceRole).isRequired,
    orgId: PropTypes.string.isRequired
  };

  state = {
    membership: this.props.initialMembership,
    // Only org owners can create other owners
    disableOwnerRole: false
  };

  endpoint = createOrganizationEndpoint(this.props.orgId);

  async componentDidMount() {
    const disableOwnerRole = await this.shouldDisableOwnerRole();
    this.setState({ disableOwnerRole });
  }

  async shouldDisableOwnerRole() {
    const { TokenStore, OrganizationRoles } = this.props.$services;
    const org = await TokenStore.getOrganization(this.props.orgId);
    return !OrganizationRoles.isOwner(org);
  }

  isSelf() {
    const currentUser = getValue(this.props.$services.TokenStore.user$);
    return currentUser && currentUser.sys.id === this.state.membership.sys.user.sys.id;
  }

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
    const { notification } = this.props.$services;
    const { id, user } = this.state.membership.sys;

    const confirmation = await ModalLauncher.open(({ isShown, onClose }) => (
      <ModalConfirm
        title="Remove user from the organization"
        intent="negative"
        isShown={isShown}
        onConfirm={() => onClose(true)}
        onCancel={() => onClose(false)}>
        <React.Fragment>
          <p>
            You are about to remove {user.firstName} {user.lastName} from your organization.
          </p>
          <p>
            After removal this user will not be able to access this organization in any way. Do you
            want to proceed?
          </p>
        </React.Fragment>
      </ModalConfirm>
    ));

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
    const { spaceMemberships, createdBy, spaces, roles, orgId } = this.props;
    const { membership, disableOwnerRole } = this.state;
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
          <div className="user-details">
            <div className="user-details__sidebar">
              <section className="user-details__profile-section">
                <UserCard user={membership.sys.user} size="large" />
              </section>
              <section className="user-details__profile-section">
                <dl className="definition-list">
                  <dt>Last activity</dt>
                  <dd>{this.getLastActiveDate()}</dd>
                  <dt>Member since</dt>
                  <dd>{membership.sys.createdAt}</dd>
                  <dt>Invited by</dt>
                  <dd>{`${createdBy.firstName} ${createdBy.lastName}`}</dd>
                </dl>
              </section>
              <section className="user-details__profile-section">
                <dd className="definition-list">
                  <dt>Organization role</dt>
                  <dd>
                    <OrganizationRoleSelector
                      style={{ marginTop: '-5px' }}
                      isSelf={this.isSelf()}
                      disableOwnerRole={disableOwnerRole}
                      initialRole={membership.role}
                      onChange={this.changeOrgRole}
                    />
                  </dd>
                </dd>
                <p>{orgRoles.find(r => r.value === membership.role).description}</p>
              </section>
            </div>
            <div className="user-details__content">
              <h3 style={{ marginBottom: 30 }}>Space memberships</h3>
              <UserSpaceMemberships
                initialMemberships={spaceMemberships}
                user={user}
                spaces={spaces}
                roles={roles}
                orgId={orgId}
              />
            </div>
          </div>
        </Workbench.Content>
      </Workbench>
    );
  }
}

export default ServicesConsumer(
  'notification',
  {
    from: 'services/TokenStore.es6',
    as: 'TokenStore'
  },
  {
    as: 'OrganizationRoles',
    from: 'services/OrganizationRoles.es6'
  }
)(UserDetail);
