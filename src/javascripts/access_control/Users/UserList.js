import React, { useCallback, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import _, { groupBy, first, map, filter, get } from 'lodash';

import { create as createMembershipRepo } from 'access_control/SpaceMembershipRepository';
import { canModifyUsers } from 'access_control/AccessChecker';
import createSpaceMembersRepo from 'data/CMA/SpaceMembersRepo';
import RoleRepository from 'access_control/RoleRepository';
import { getAllUsers } from 'access_control/OrganizationMembershipRepository';
import resolveLinks from 'data/LinkResolver';
import { useAsync } from 'core/hooks';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { getOrgFeature } from 'data/CMA/ProductCatalog';

import * as UserListActions from './UserListActions';
import UserListPresentation from './UserListPresentation';
import { VIEW_BY_NAME, VIEW_BY_ROLE } from './constants';

import { FetcherLoading } from 'app/common/createFetcherComponent';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import { ModalLauncher } from '@contentful/forma-36-react-components';
import AddUsers from 'app/SpaceSettings/Users/AddUsers/AddUsers';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { getOrganization, getOrganizationId } from 'core/services/SpaceEnvContext/utils';
import { createSpaceEndpoint } from 'data/EndpointFactory';

const fetch = (orgId, endpoint, space, setData) => async () => {
  const [members, spaceMemberships, roles, spaceUsers, hasTeamsFeature] = await Promise.all([
    createSpaceMembersRepo(endpoint).getAll(),
    createMembershipRepo(endpoint).getAll(),
    RoleRepository.getInstance(space).getAll(),
    getAllUsers(endpoint),
    getOrgFeature(orgId, 'teams', false),
  ]);

  const resolvedMembers = resolveLinks({
    paths: ['roles', 'sys.relatedMemberships', 'sys.user'],
    includes: { Role: roles, SpaceMembership: spaceMemberships, User: spaceUsers },
    items: members,
  });

  setData({ resolvedMembers, roles, spaceUsers, hasTeamsFeature });
};

const UserList = ({ jumpToRole }) => {
  const { currentSpace, currentSpaceId, currentEnvironmentId } = useSpaceEnvContext();
  const organization = getOrganization(currentSpace);
  const organizationId = getOrganizationId(currentSpace);
  const endpoint = createSpaceEndpoint(currentSpaceId, currentEnvironmentId);
  const memberships = createMembershipRepo(endpoint);
  const [selectedView, setSelectedView] = useState(jumpToRole ? VIEW_BY_ROLE : VIEW_BY_NAME);
  const [data, setData] = useState(null);
  const boundFetch = fetch(organizationId, endpoint, currentSpace, setData);
  const { isLoading, error } = useAsync(useCallback(boundFetch, []));
  const resolvedMembers = get(data, 'resolvedMembers', []);
  const roles = get(data, 'roles', []);
  const spaceUsers = get(data, 'spaceUsers', []);
  const hasTeamsFeature = get(data, 'hasTeamsFeature', false);
  const actions = UserListActions.create(roles, memberships);

  const sortedMembers = useMemo(
    () =>
      _(resolvedMembers)
        .filter('sys.user.email')
        .orderBy(['sys.user.firstName', 'sys.user.lastName'], ['asc', 'asc'])
        .value(),
    [resolvedMembers]
  );

  const adminCount = filter(sortedMembers, 'admin').length;

  const usersByName = useMemo(
    () =>
      groupBy(sortedMembers, ({ sys: { user: { firstName, email } } }) =>
        first((firstName || email).toUpperCase())
      ),
    [sortedMembers]
  );

  const usersByRole = useMemo(() => {
    let userGroups = _(sortedMembers)
      .map((member) => member.roles.map(({ name }) => ({ name, member })))
      .flatten()
      .groupBy('name')
      .mapValues((roles) => map(roles, 'member'))
      .value();
    const admins = filter(sortedMembers, 'admin');
    if (admins.length > 0) {
      userGroups = {
        Administrator: admins,
        ...userGroups,
      };
    }
    return userGroups;
  }, [sortedMembers]);

  if (isLoading || !data) {
    return (
      <EmptyStateContainer>
        <FetcherLoading />
      </EmptyStateContainer>
    );
  }

  if (error) {
    return <ForbiddenPage />;
  }

  const userGroups = selectedView === VIEW_BY_NAME ? usersByName : usersByRole;

  const numberOfTeamMemberships = _(sortedMembers)
    .keyBy('sys.id')
    .mapValues(
      ({ sys: { relatedMemberships } }) =>
        relatedMemberships.filter(({ sys: { linkType } }) => linkType === 'TeamSpaceMembership')
          .length
    )
    .value();

  const spaceUsersCount = sortedMembers.length;

  return (
    <UserListPresentation
      userGroups={userGroups}
      numberOfTeamMemberships={numberOfTeamMemberships}
      selectedView={selectedView}
      orgId={organizationId}
      spaceId={currentSpaceId}
      jumpToRole={jumpToRole}
      canModifyUsers={canModifyUsers()}
      isOwnerOrAdmin={isOwnerOrAdmin(organization)}
      hasTeamsFeature={hasTeamsFeature}
      spaceUsersCount={spaceUsersCount}
      openSpaceInvitationDialog={openSpaceInvitationDialog}
      openRoleChangeDialog={decorateWithRefetch(actions.openRoleChangeDialog)}
      openRemovalConfirmationDialog={actions.openRemovalConfirmationDialog(boundFetch)}
      onChangeSelectedView={setSelectedView}
      adminCount={adminCount}
    />
  );

  function decorateWithRefetch(command) {
    return function (...args) {
      return command(...args).then(boundFetch);
    };
  }

  function openSpaceInvitationDialog() {
    const unavailableUserIds = spaceUsers.map((user) => user.sys.id);
    ModalLauncher.open(({ isShown, onClose }) => (
      <AddUsers
        isShown={isShown}
        onClose={onClose}
        orgId={organizationId}
        unavailableUserIds={unavailableUserIds}
        space={currentSpace}
      />
    ));
  }
};
UserList.propTypes = {
  jumpToRole: PropTypes.string,
};

export default UserList;
