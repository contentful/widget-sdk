'use strict';

angular.module('contentful')
.directive('cfKalturaEditor', ['require', function (require) {
  var $controller = require('$controller');
  var KalturaEditorControllerMixin = require('KalturaEditorControllerMixin');
  var kalturaClientWrapper = require('kalturaClientWrapper');
  var spaceContext = require('spaceContext');

  return {
    restrict: 'E',
    scope: {},
    template: JST['cf_video_editor'](),
    require: '^cfWidgetApi',
    link: function ($scope, $el, $attrs, widgetApi) {
      // TODO We should not mutate internal state in a link function.
      // The Kaltura client should be returned by a factory that is
      // parameterized over the organization ID.
      kalturaClientWrapper.setOrganizationId(spaceContext.space.getOrganizationId());

      $scope.providerVideoEditorController = _.extend({}, KalturaEditorControllerMixin);
      $scope.videoEditorController = $controller('cfVideoEditorController', {
        $scope: $scope,
        widgetApi: widgetApi
      });
    }
  };
}]);

