'use strict';

angular.module('contentful').directive('cfNotifications', function() {
  return {
    template: JST.cf_notifications(),
    restrict: 'E',
    replace: true
  };
});

