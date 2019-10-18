import React, { useCallback, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import _, { groupBy, first, map, filter, get } from 'lodash';

import { create as createMembershipRepo } from 'access_control/SpaceMembershipRepository';
import { canModifyUsers } from 'access_control/AccessChecker';
import createSpaceMembersRepo from 'data/CMA/SpaceMembersRepo.es6';
import RoleRepository from 'access_control/RoleRepository';
import { getAllUsers } from 'access_control/OrganizationMembershipRepository';
import resolveLinks from 'data/LinkResolver.es6';
import useAsync from 'app/common/hooks/useAsync.es6';
import { isOwnerOrAdmin } from 'services/OrganizationRoles.es6';
import { getModule } from 'NgRegistry.es6';
import { getOrgFeature } from 'data/CMA/ProductCatalog.es6';

import * as UserListActions from './UserListActions';
import UserListPresentation from './UserListPresentation';
import { VIEW_BY_NAME, VIEW_BY_ROLE } from './constants';

const fetch = (orgId, endpoint, space, onReady, setData) => async () => {
  const [members, spaceMemberships, roles, spaceUsers, hasTeamsFeature] = await Promise.all([
    createSpaceMembersRepo(endpoint).getAll(),
    createMembershipRepo(endpoint).getAll(),
    RoleRepository.getInstance(space).getAll(),
    getAllUsers(endpoint),
    getOrgFeature(orgId, 'teams', false)
  ]);

  const resolvedMembers = resolveLinks({
    paths: ['roles', 'relatedMemberships', 'sys.user'],
    includes: { Role: roles, SpaceMembership: spaceMemberships, User: spaceUsers },
    items: members
  });

  setData({ resolvedMembers, roles, spaceUsers, hasTeamsFeature });

  onReady();
};

const UserList = ({ onReady, jumpToRole }) => {
  const { endpoint, space, organization } = getModule('spaceContext');

  const [selectedView, setSelectedView] = useState(jumpToRole ? VIEW_BY_ROLE : VIEW_BY_NAME);
  const [isInvitingUsersToSpace, setIsInvitingUsersToSpace] = useState(false);
  const [data, setData] = useState(null);
  const boundFetch = fetch(organization.sys.id, endpoint, space, onReady, setData);
  const { isLoading, error } = useAsync(useCallback(boundFetch, []));

  const resolvedMembers = get(data, 'resolvedMembers', []);
  const roles = get(data, 'roles', []);
  const spaceUsers = get(data, 'spaceUsers', []);
  const hasTeamsFeature = get(data, 'hasTeamsFeature', false);

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
    return userGroups;
  }, [sortedMembers]);

  if (isLoading || error) {
    return null;
  }

  const userGroups = selectedView === VIEW_BY_NAME ? usersByName : usersByRole;

  const numberOfTeamMemberships = _(sortedMembers)
    .keyBy('sys.id')
    .mapValues(
      ({ relatedMemberships }) =>
        relatedMemberships.filter(({ sys: { linkType } }) => linkType === 'TeamSpaceMembership')
          .length
    )
    .value();

  const spaceUsersCount = sortedMembers.length;

  const actions = UserListActions.create(roles, spaceUsers);

  return (
    <UserListPresentation
      userGroups={userGroups}
      numberOfTeamMemberships={numberOfTeamMemberships}
      selectedView={selectedView}
      orgId={organization.sys.id}
      jumpToRole={jumpToRole}
      canModifyUsers={canModifyUsers()}
      isOwnerOrAdmin={isOwnerOrAdmin(organization)}
      isInvitingUsersToSpace={isInvitingUsersToSpace}
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
    return function(...args) {
      return command(...args).then(boundFetch);
    };
  }

  function openSpaceInvitationDialog() {
    setIsInvitingUsersToSpace(true);

    decorateWithRefetch(actions.openSpaceInvitationDialog(boundFetch))().finally(() => {
      setIsInvitingUsersToSpace(false);
    });
  }
};
UserList.propTypes = {
  onReady: PropTypes.func.isRequired,
  jumpToRole: PropTypes.string
};

export default UserList;
