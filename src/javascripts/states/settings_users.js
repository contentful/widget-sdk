'use strict';

angular
  .module('contentful')

  /**
   * @ngdoc service
   * @name states/settings/users
   */
  .factory('states/settings/users', [
    'require',
    require => {
      var base = require('states/Base.es6').default;

      var list = base({
        name: 'list',
        url: '',
        label: 'Users',
        loadingText: 'Loading users…',
        template: '<cf-user-list class="workbench user-list" />'
      });

      return {
        name: 'users',
        url: '/users',
        abstract: true,
        children: [list]
      };
    }
  ]);
