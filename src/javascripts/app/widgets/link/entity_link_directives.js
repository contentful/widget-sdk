'use strict';

angular.module('cf.app')

.directive('cfAssetCard', ['createEntityLinkDirective', function (create) {
  return create('cf_asset_card');
}])

.directive('cfEntityLink', ['createEntityLinkDirective', function (create) {
  return create('cf_entity_link');
}])

.value('createEntityLinkDirective', function (template) {
  return {
    restrict: 'E',
    scope: {
      link: '=',
      entity: '=',
      entityStore: '=',
      entityHelpers: '=',
      actions: '=',
      config: '='
    },
    controller: 'EntityLinkController',
    template: JST[template]()
  };
});
