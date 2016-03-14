'use strict';

angular.module('contentful')
.controller('cfKalturaEditorController', ['$injector', function($injector){
  var KalturaEditorControllerMixin = $injector.get('KalturaEditorControllerMixin');
  var kalturaClientWrapper = $injector.get('kalturaClientWrapper');
  var spaceContext = $injector.get('spaceContext');

  kalturaClientWrapper.setOrganizationId(spaceContext.space.getOrganizationId());

  _.extend(this, KalturaEditorControllerMixin);
}]);
