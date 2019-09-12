import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import _, { noop, groupBy, first, map, orderBy, filter } from 'lodash';

import { create as createMembershipRepo } from 'access_control/SpaceMembershipRepository.es6';
import createSpaceMembersRepo from 'data/CMA/SpaceMembersRepo.es6';
import RoleRepository from 'access_control/RoleRepository.es6';
import { getAllUsers } from 'access_control/OrganizationMembershipRepository.es6';
import resolveLinks from 'data/LinkResolver.es6';
import useAsync from 'app/common/hooks/useAsync.es6';
import { getModule } from 'NgRegistry.es6';
import { isOwnerOrAdmin } from 'services/OrganizationRoles.es6';

import UserListPresentation from './UserListPresentation.es6';
import { VIEW_BY_NAME, VIEW_BY_ROLE } from './constants.es6';

const fetch = (endpoint, space, onReady) => async () => {
  const [members, spaceMemberships, roles, users] = await Promise.all([
    createSpaceMembersRepo(endpoint).getAll(),
    createMembershipRepo(endpoint).getAll(),
    RoleRepository.getInstance(space).getAll(),
    getAllUsers(endpoint)
  ]);

  const resolvedMembers = resolveLinks({
    paths: ['roles', 'relatedMemberships', 'sys.user'],
    includes: { Role: roles, SpaceMembership: spaceMemberships, User: users },
    items: members
  });

  onReady();

  return { resolvedMembers };
};

const UserList = ({ onReady }) => {
  const [selectedView, setSelectedView] = useState(VIEW_BY_NAME);
  const { endpoint, space, organization } = getModule('spaceContext');
  const accessChecker = getModule('access_control/AccessChecker');
  const { isLoading, error, data } = useAsync(useCallback(fetch(endpoint, space, onReady), []));
  if (isLoading || error) {
    return null;
  }

  const { resolvedMembers } = data;
  const sortedMembers = orderBy(
    resolvedMembers,
    ['sys.user.firstName', 'sys.user.lastName'],
    ['asc', 'asc']
  );

  let userGroups;
  if (selectedView === VIEW_BY_NAME) {
    userGroups = groupBy(sortedMembers, ({ sys: { user: { firstName } } }) =>
      first(firstName.toUpperCase())
    );
  } else if (selectedView === VIEW_BY_ROLE) {
    userGroups = _(sortedMembers)
      .map(member => member.roles.map(({ name }) => ({ name, member })))
      .flatten()
      .groupBy('name')
      .mapValues(roles => map(roles, 'member'))
      .value();
    const admins = filter(sortedMembers, 'admin');
    if (admins.length > 0) {
      userGroups = {
        Administrator: admins,
        ...userGroups
      };
    }
  }

  const numberOfTeamMemberships = _(sortedMembers)
    .keyBy('sys.id')
    .mapValues(
      ({ relatedMemberships }) =>
        relatedMemberships.filter(({ sys: { linkType } }) => linkType === 'TeamSpaceMembership')
          .length
    )
    .value();

  return (
    <UserListPresentation
      orgId={organization.sys.id}
      isOwnerOrAdmin={isOwnerOrAdmin(organization)}
      canModifyUsers={accessChecker.canModifyUsers()}
      selectedView={selectedView}
      openRemovalConfirmationDialog={noop}
      openRoleChangeDialog={noop}
      openSpaceInvitationDialog={noop}
      onChangeSelectedView={setSelectedView}
      userGroups={userGroups}
      numberOfTeamMemberships={numberOfTeamMemberships}
    />
  );
};

UserList.propTypes = {
  onReady: PropTypes.func.isRequired
};

export default UserList;
