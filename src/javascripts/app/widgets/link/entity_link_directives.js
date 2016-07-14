'use strict';

angular.module('cf.app')

/**
 * @ngdoc service
 * @module cf.app
 * @name createEntityLinkDirective
 * @description
 * Creates a definition object for an entity link directive.
 * Entity link directives share both controller and an isolated
 * scope configuration, but differ in a template.
 */
.value('createEntityLinkDirective', function (template) {
  return {
    restrict: 'E',
    scope: {
      // hides all actions that may alter the state
      disabled: '=isDisabled',
      // entity to be rendered:
      // (optional, can be replaced with "link" and "entityStore")
      entity: '=',
      // link and entity store that can provide an entity for this link:
      // (optional, can be replaced with "entity")
      link: '=',
      entityStore: '=',
      // instance of entity helpers bound to a specific locale
      entityHelpers: '=',
      // object of actions
      // supported actions are: removeFromList, goToEditor
      actions: '=',
      // object of visual configuration options
      // valid options are: draggable, asThumb, showDetails
      config: '='
    },
    controller: 'EntityLinkController',
    template: JST[template]()
  };
})

.directive('cfAssetCard', ['createEntityLinkDirective', function (create) {
  return create('cf_asset_card');
}])

.directive('cfEntityLink', ['createEntityLinkDirective', function (create) {
  return create('cf_entity_link');
}]);
