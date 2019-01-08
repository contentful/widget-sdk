import { get } from 'lodash';
import * as OrganizationRoles from 'services/OrganizationRoles.es6';
import * as accessChecker from 'access_control/AccessChecker/index.es6';
import * as Config from 'Config.es6';

export const spaceHomeController = [
  '$scope',
  'space',
  ($scope, space) => {
    $scope.context.ready = true;
    $scope.context.forbidden = !accessChecker.getSectionVisibility().spaceHome;
    $scope.readOnlySpace = Boolean(space.readOnlyAt);

    const spaceId = space.sys.id;
    const spaceName = space.name;
    const orgName = space.organization.name;
    $scope.supportUrl = `${
      Config.supportUrl
    }?read-only-space=true&space-id=${spaceId}&space-name=${spaceName}`;
    $scope.isAuthorOrEditor = accessChecker.isAuthorOrEditor(get(space, 'spaceMembership.roles'));
    $scope.spaceHomeProps = { spaceName, orgName };
    $scope.isSpaceAdmin = get(space, 'spaceMembership.admin');
    $scope.orgOwnerOrAdmin = OrganizationRoles.isOwnerOrAdmin(space.organization);
  }
];
