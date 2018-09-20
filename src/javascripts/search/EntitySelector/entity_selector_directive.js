/**
 * @ngdoc directive
 * @name cfEntitySelector
 * @description
 * Allows to search and select entities (entries, assets, users).
 */
angular.module('contentful').directive('cfEntitySelector', [
  'require',
  _require => ({
    template: JST.entity_selector(),
    restrict: 'E',
    scope: {
      config: '=',
      labels: '=',
      listHeight: '=',
      onChange: '=',
      onNoEntities: '='
    },
    controller: [
      '$scope',
      _$scope => {
        // TODO: Move `entity_selector_controller.js` code in here.
      }
    ]
  })
]);
