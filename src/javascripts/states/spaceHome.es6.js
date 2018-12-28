import { registerFactory } from 'NgRegistry.es6';
import base from 'states/Base.es6';
import homeTemplateDef from 'app/home/HomeTemplate.es6';
import { isOwnerOrAdmin } from 'services/OrganizationRoles.es6';

/**
 * @ngdoc service
 * @name states/space_home
 */
registerFactory('states/space_home', [
  'access_control/AccessChecker/index.es6',
  'Config.es6',
  'states/Resolvers.es6',
  (accessChecker, Config, { spaceResolver }) => {
    return base({
      name: 'home',
      url: '/home',
      label: 'Space home',
      resolve: {
        space: spaceResolver
      },
      template: homeTemplateDef(),
      loadingText: 'Loading…',
      controller: [
        '$scope',
        'space',
        ($scope, space) => {
          $scope.context.ready = true;
          $scope.context.forbidden = !accessChecker.getSectionVisibility().spaceHome;
          $scope.readOnlySpace = Boolean(space.readOnlyAt);

          const spaceId = space.sys.id;
          const spaceName = space.name;
          $scope.supportUrl = `${
            Config.supportUrl
          }?read-only-space=true&space-id=${spaceId}&space-name=${spaceName}`;

          $scope.orgOwnerOrAdmin = isOwnerOrAdmin(space.organization);
        }
      ]
    });
  }
]);
