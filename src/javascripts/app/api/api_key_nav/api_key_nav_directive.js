'use strict';

angular.module('contentful')
.directive('cfApiKeyNav', function () {
  return {
    template: JST['api_key_nav'](),
    restrict: 'E',
    controller: ['$injector', function ($injector) {

      var $state = $injector.get('$state');
      var controller = this;

      var tabs = [
        {
          name: 'Content delivery keys',
          state: 'spaces.detail.api.keys.list'
        },
        {
          name: 'Content management keys',
          state: 'spaces.detail.api.cma_keys'
        },
        {
          name: 'Content model schema',
          state: 'spaces.detail.api.content_model'
        }
      ];

      controller.state = $state.current.name;

      controller.tabs = _.map(tabs, function (tab) {
        tab.selected = tab.state === controller.state;
        return tab;
      });

    }],
    controllerAs: 'navController'
  };
});
