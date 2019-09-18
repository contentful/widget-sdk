import { get } from 'lodash';
import * as OrganizationRoles from 'services/OrganizationRoles.es6';
import { getValue } from 'utils/kefir.es6';
import { user$ } from 'services/TokenStore.es6';
import * as accessChecker from 'access_control/AccessChecker/index.es6';
import * as Config from 'Config.es6';

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
