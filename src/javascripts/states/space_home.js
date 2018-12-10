'use strict';

angular
  .module('contentful')
  /**
   * @ngdoc service
   * @name states/space_home
   */
  .factory('states/space_home', [
    'require',
    require => {
      const base = require('states/Base.es6').default;
      const accessChecker = require('access_control/AccessChecker');
      const template = require('app/home/HomeTemplate.es6').default;
      const spaceResolver = require('states/Resolvers.es6').spaceResolver;
      const OrganizationRoles = require('services/OrganizationRoles.es6');
      const Config = require('Config.es6');

      return base({
        name: 'home',
        url: '/home',
        label: 'Space home',
        resolve: {
          space: spaceResolver
        },
        template: template(),
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

            $scope.orgOwnerOrAdmin = OrganizationRoles.isOwnerOrAdmin(space.organization);
          }
        ]
      });
    }
  ]);
