'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/base
 * @description
 * Exposes a function that builds a state with loading views.
 */
.factory('states/base', [function () {
  return function base (definition) {
    if (!definition.loadingText) {
      var label = _.get(definition, 'label');

      definition.loadingText = label ? ('Loading ' + label + '...') : 'Please hold on...';
    }

    definition.template = JST.base_state_view({
      template: definition.template,
      loadingText: definition.loadingText
    });

    return definition;
  };
}]);
