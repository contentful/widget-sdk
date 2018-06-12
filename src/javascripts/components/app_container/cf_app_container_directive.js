'use strict';

angular.module('contentful').directive('cfAppContainer', ['require', require => ({
  template: require('components/app_container/AppContainer').default(),
  restrict: 'E',

  // FIXME move this further down maybe
  controller: 'SpaceController'
})]);
