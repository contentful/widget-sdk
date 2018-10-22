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
          }
        ]
      });
    }
  ]);
