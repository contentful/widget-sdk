import { get } from 'lodash';
import * as OrganizationRoles from 'services/OrganizationRoles';
import { getValue } from 'utils/kefir';
import { user$ } from 'services/TokenStore';
import * as accessChecker from 'access_control/AccessChecker';
import * as Config from 'Config';

export const spaceHomeController = ($scope, space) => {
  $scope.context.ready = true;
  $scope.context.forbidden = !accessChecker.getSectionVisibility().spaceHome;
  $scope.readOnlySpace = Boolean(space.readOnlyAt);

  const spaceId = space.sys.id;
  const spaceName = space.name;
  const orgName = space.organization.name;
  const orgId = space.organization.sys.id;
  $scope.supportUrl = `${Config.supportUrl}?read-only-space=true&space-id=${spaceId}&space-name=${spaceName}`;
  $scope.isAuthorOrEditor = accessChecker.isAuthorOrEditor(get(space, 'spaceMember.roles'));
  $scope.spaceHomeProps = { spaceName, orgName, orgId, spaceId };
  $scope.isSpaceAdmin = get(space, 'spaceMember.admin');
  $scope.orgOwnerOrAdmin = OrganizationRoles.isOwnerOrAdmin(space.organization);

  const user = getValue(user$) || {};
  $scope.welcomeProps = {
    user: {
      firstName: user.firstName,
      signInCount: user.signInCount
    }
  };
};
