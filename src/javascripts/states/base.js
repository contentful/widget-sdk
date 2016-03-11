'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/base
 * @description
 * Exposes a function that builds a state with loading views.
 */
.factory('states/base', [function () {
  return function base(definition) {
    if (!definition.loadingText) {
      var label = dotty.get(definition, 'ncyBreadcrumb.label');
      definition.loadingText = label ? ('Loading your ' + label + '...') : 'Loading...';
    }

    definition.template = JST.base_state_view({
      template: definition.template,
      loadingText: definition.loadingText
    });

    return definition;
  };
}]);

