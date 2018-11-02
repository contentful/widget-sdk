import React from 'react';
import PropTypes from 'prop-types';
import UserDetail from './UserDetail.es6';
import OrgAdminOnly from 'app/common/OrgAdminOnly.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import {
  getMembership,
  getUser,
  getSpaceMemberships
} from 'access_control/OrganizationMembershipRepository.es6';
import { getAllSpaces, getAllRoles } from 'access_control/OrganizationMembershipRepository.es6';
import ResolveLinks from '../../LinkResolver.es6';

const UserDetailFetcher = createFetcherComponent(async ({ orgId, userId }) => {
  const endpoint = createOrganizationEndpoint(orgId);

  const includePaths = ['roles', 'sys.space', 'sys.createdBy'];
  const membership = await getMembership(endpoint, userId);
  const [user, spaceMembershipsResult, spaces, roles] = await Promise.all([
    getUser(endpoint, membership.sys.user.sys.id),
    getSpaceMemberships(endpoint, {
      include: includePaths.join(),
      'sys.user.sys.id': membership.sys.user.sys.id,
      limit: 100
    }),
    getAllSpaces(endpoint),
    getAllRoles(endpoint)
  ]);
  let createdBy;
  try {
    createdBy = await getUser(endpoint, membership.sys.createdBy.sys.id);
  } catch (e) {
    createdBy = {
      firstName: '',
      lastName: '',
      avatarUrl: '',
      email: '',
      sys: { id: membership.sys.createdBy.sys.id }
    };
  }

  const { items, includes } = spaceMembershipsResult;
  const spaceMemberships = ResolveLinks({ paths: includePaths, items, includes });

  return {
    initialMembership: { ...membership, sys: { ...membership.sys, user } },
    createdBy,
    spaceMemberships,
    spaces,
    roles
  };
});

export default class UserDetailRoute extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
    onReady: PropTypes.func.isRequired,
    context: PropTypes.any
  };

  componentDidMount() {
    this.props.onReady();
  }

  render() {
    const { orgId, userId } = this.props;
    return (
      <OrgAdminOnly orgId={orgId}>
        <UserDetailFetcher orgId={orgId} userId={userId}>
          {({ isLoading, isError, data }) => {
            if (isLoading) {
              return <FetcherLoading message="Loading user..." />;
            }
            if (isError) {
              return <StateRedirect to="spaces.detail.entries.list" />;
            }

            return <UserDetail {...data} orgId={orgId} />;
          }}
        </UserDetailFetcher>
      </OrgAdminOnly>
    );
  }
}
