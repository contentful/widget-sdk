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

      return base({
        name: 'home',
        url: '/home',
        label: 'Space home',
        template: template(),
        loadingText: 'Loading…',
        controller: [
          '$scope',
          $scope => {
            $scope.context.ready = true;
            $scope.context.forbidden = !accessChecker.getSectionVisibility().spaceHome;
          }
        ]
      });
    }
  ]);
