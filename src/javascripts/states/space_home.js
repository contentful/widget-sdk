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
      var base = require('states/Base.es6').default;
      var accessChecker = require('access_control/AccessChecker');
      var template = require('app/home/HomeTemplate.es6').default;
      var spaceResolver = require('states/Resolvers.es6').spaceResolver;
      var OrganizationRoles = require('services/OrganizationRoles.es6');
      var Config = require('Config.es6');

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

            $scope.orgOwner = OrganizationRoles.isOwner(space.organization);
          }
        ]
      });
    }
  ]);
