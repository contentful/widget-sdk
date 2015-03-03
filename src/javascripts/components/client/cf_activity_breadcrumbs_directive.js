'use strict';

angular.module('contentful').directive('cfActivityBreadcrumbs', function () {
  return {
    template: JST.cf_activity_breadcrumbs(),
    restrict: 'AE',
    replace: true
  };
});
